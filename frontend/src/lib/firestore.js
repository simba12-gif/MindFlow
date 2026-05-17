/**
 * MindFlow Firestore Service
 * All Firestore read/write operations are centralized here.
 */
import {
  collection, addDoc, getDocs, query, where,
  orderBy, limit, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import api from './api';
import { calculateBurnoutScore } from './burnoutEngine';

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
  const q = query(checkinCol(uid), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const { mood, sleep, workload, stress } = snap.docs[0].data();
  return { mood, sleep, workload, stress };
}

// ─── Fetch 100-day heatmap data for CalmCal ───────────────
export async function fetchHeatmapData(uid, days = 100) {
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
  try {
    const { data } = await api.get('/analytics/departments');
    return data;
  } catch (err) {
    console.error('Failed to fetch department stats:', err);
    return [];
  }
}

export async function fetchSyslogAlerts() {
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
