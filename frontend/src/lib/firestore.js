/**
 * MindFlow Firestore Service
 * All Firestore read/write operations are centralized here.
 * Falls back to localStorage when Firebase is not configured (DEMO_MODE).
 */
import {
  collection, addDoc, getDocs, query, where,
  orderBy, limit, serverTimestamp, doc, setDoc, getDoc,
} from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import api from './api';
import { calculateBurnoutScore, generateMockHistory } from './burnoutEngine';

// ─── Paths ────────────────────────────────────────────────
const checkinCol = (uid) => collection(db, 'users', uid, 'checkins');
const userDoc = (uid) => doc(db, 'users', uid);

// ─── Save a check-in ──────────────────────────────────────
export async function saveCheckin(uid, values) {
  const result = calculateBurnoutScore(values);
  const payload = {
    ...values,
    score: result.score,
    level: result.level,
    createdAt: serverTimestamp(),
    dateKey: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  };

  if (DEMO_MODE) {
    localStorage.setItem('mf_last_checkin', JSON.stringify(values));
    // Append to mock history in localStorage
    const history = getLocalHistory();
    history.unshift({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem('mf_history', JSON.stringify(history.slice(0, 30)));
    return payload;
  }

  // Write to Firestore
  await addDoc(checkinCol(uid), payload);
  // Also update the user-level summary doc for quick reads
  await setDoc(userDoc(uid), {
    lastScore: result.score,
    lastLevel: result.level,
    lastCheckinDate: payload.dateKey,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return payload;
}

// ─── Fetch 14-day burnout history ─────────────────────────
export async function fetchHistory(uid, days = 14) {
  if (DEMO_MODE) {
    const saved = localStorage.getItem('mf_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.slice(0, days).map(d => ({
        date: d.dateKey || d.createdAt?.split('T')[0],
        score: d.score,
      })).reverse();
    }
    // Generate fresh mock history
    const lastCheckin = JSON.parse(localStorage.getItem('mf_last_checkin') || 'null');
    const base = lastCheckin ? calculateBurnoutScore(lastCheckin).score : 50;
    return generateMockHistory(base);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    checkinCol(uid),
    where('createdAt', '>=', since),
    orderBy('createdAt', 'asc'),
    limit(days),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      date: data.dateKey,
      score: data.score,
    };
  });
}

// ─── Fetch last check-in values ───────────────────────────
export async function fetchLastCheckin(uid) {
  if (DEMO_MODE) {
    return JSON.parse(localStorage.getItem('mf_last_checkin') || 'null');
  }

  const q = query(checkinCol(uid), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const { mood, sleep, workload, stress } = snap.docs[0].data();
  return { mood, sleep, workload, stress };
}

// ─── Fetch 100-day heatmap data for CalmCal ───────────────
export async function fetchHeatmapData(uid, days = 100) {
  if (DEMO_MODE) {
    const saved = localStorage.getItem('mf_history');
    if (saved) {
      return JSON.parse(saved).map(d => ({
        date: d.dateKey || d.createdAt?.split('T')[0],
        count: scoreToHeatLevel(d.score),
        isRecovery: d.score < 35,
      }));
    }
    return generateDemoHeatmap(days);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    checkinCol(uid),
    where('createdAt', '>=', since),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      date: data.dateKey,
      count: scoreToHeatLevel(data.score),
      isRecovery: data.score < 35,
    };
  });
}

// ─── Campus analytics for WellPulse (aggregated) ─────────
export async function fetchCampusStats() {
  if (DEMO_MODE) {
    return {
      avgBurnout: 42.8,
      highRiskCount: 128,
      calmSessions: 3492,
      engagementIndex: 88.5,
    };
  }

  try {
    const { data } = await api.get('/analytics/overview');
    return {
      avgBurnout: data.campusAverageBurnout,
      highRiskCount: data.highRiskCount,
      calmSessions: 3492, // Still mock for now as this isn't in backend yet
      engagementIndex: data.checkInRate,
      totalStudents: data.totalStudents || 14200,
    };
  } catch (err) {
    console.error('Failed to fetch campus stats:', err);
    return { avgBurnout: 0, highRiskCount: 0, calmSessions: 0, engagementIndex: 0, totalStudents: 14200 };
  }
}

export async function fetchDepartmentStats() {
  if (DEMO_MODE) {
    return [];
  }
  try {
    const { data } = await api.get('/analytics/departments');
    return data;
  } catch (err) {
    console.error('Failed to fetch department stats:', err);
    return [];
  }
}

export async function fetchSyslogAlerts() {
  if (DEMO_MODE) {
    return [];
  }
  try {
    const { data } = await api.get('/alerts');
    return data;
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────
function scoreToHeatLevel(score) {
  if (score <= 35) return 1;  // calm / cyan
  if (score <= 55) return 2;  // balanced / lime
  return 3;                   // high stress / red
}

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem('mf_history') || '[]');
  } catch {
    return [];
  }
}

function generateDemoHeatmap(days) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const isRecovery = Math.random() > 0.85;
    return {
      date: date.toISOString().split('T')[0],
      count: isRecovery ? 0 : Math.floor(Math.random() * 4),
      isRecovery,
    };
  });
}
