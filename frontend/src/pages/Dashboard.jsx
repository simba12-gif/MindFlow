import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { calculateBurnoutScore } from '../lib/burnoutEngine';
import { parseISO, format, startOfWeek, isSameWeek } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [burnout, setBurnout] = useState(null);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [scoreRes, historyRes, calendarRes, todayCheckinRes] = await Promise.all([
          api.get('/burnout/me', { signal: controller.signal }),
          api.get('/burnout/me/history', { signal: controller.signal }),
          api.get('/calendar/me', { signal: controller.signal }),
          api.get('/checkins/me/today', { signal: controller.signal }).catch(err => {
            console.warn('Failed to fetch today checkin status, falling back:', err);
            return { data: { checkedIn: false } };
          })
        ]);

        if (scoreRes.data.hasData) {
          setBurnout({
            score: scoreRes.data.score,
            level: scoreRes.data.riskLevel,
            advice: scoreRes.data.recommendations || []
          });
        } else {
          setBurnout(calculateBurnoutScore({ mood: 7, sleep: 7, workload: 4, stress: 3 }));
        }

        setHistory(historyRes.data.map(h => ({
          score: h.score,
          date: h.calculatedAt
        })));

        setEvents(calendarRes.data);

        const localCheckinDate = localStorage.getItem('mf_last_checkin_date');
        const isTodayLocal = localCheckinDate === new Date().toLocaleDateString('en-CA');
        setCheckedInToday(!!todayCheckinRes?.data?.checkedIn || isTodayLocal);

        setErrorCount(0);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Failed to fetch dashboard data:', err);
          setErrorCount(prev => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    const poll = setInterval(load, 30000); // Sync every 30s for real-time feel
    return () => {
      clearInterval(poll);
      controller.abort();
    };
  }, [user?.uid]);

  // Real-time Academic Load Calculation (Weekly)
  const academicLoad = useMemo(() => {
    if (!events.length) return { score: 30, label: 'Stable' };
    const totalWeight = events.reduce((acc, curr) => acc + (curr.stressWeight || 0), 0);
    const score = Math.min(100, Math.round((totalWeight / 40) * 100));
    return {
      score,
      label: score > 75 ? 'Critical' : score > 40 ? 'Heavy' : 'Optimal'
    };
  }, [events]);



  const score = burnout?.score ?? null;
  const label = score === null ? 'SYNCING...' : score < 30 ? 'Zen' : score < 60 ? 'Aware' : 'Strained';
  const sublabel = score === null ? 'CONNECTING TELEMETRY' : score < 30 ? 'OPTIMAL FLOW STATE' : score < 60 ? 'MONITOR CLOSELY' : 'TAKE A BREAK';

  // Build 7-day academic load chart from real events
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const chartHeights = useMemo(() => {
    const weights = new Array(7).fill(0);
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    events.forEach(ev => {
      if (!ev.startTime) return;
      const d = parseISO(ev.startTime);
      if (isSameWeek(d, now, { weekStartsOn: 1 })) {
        const dayIdx = (d.getDay() + 6) % 7; // Map Sun=0 to 6, Mon=1 to 0
        weights[dayIdx] += (ev.stressWeight || 0);
      }
    });

    // Normalize: let's say a 'max' day is 15 weight units
    return weights.map(w => Math.max(10, Math.min(95, (w / 15) * 100)));
  }, [events]);

  if (loading) {
    return (
      <div style={{ background: 'transparent', color: '#e5e2e3', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <Sidebar active="dashboard" />
        <Header
          title={`Welcome back, ${user?.displayName || 'Student'}`}
          subtext="ESTABLISHING_NEURAL_LINK..."
        />
        <main className="pt-28 pb-12 px-6 md:ml-64 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              {/* Orb Card Skeleton */}
              <div className="lg:col-span-8 glass-panel rounded-[2rem] p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[550px] hud-border animate-pulse">
                <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.01]">
                  <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                    <div className="w-32 h-32 rounded-full bg-white/[0.03]" />
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded w-48 mt-8" />
                <div className="h-3 bg-white/5 rounded w-32 mt-4" />
              </div>
              {/* Right Cards Skeleton */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="glass-panel rounded-[2rem] p-8 flex-1 hud-border animate-pulse flex flex-col justify-between" style={{ minHeight: '260px' }}>
                  <div className="space-y-4">
                    <div className="h-6 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="h-20 bg-white/5 rounded-2xl w-full" />
                </div>
                <div className="glass-panel rounded-[2rem] p-8 flex-1 hud-border animate-pulse flex flex-col justify-between" style={{ minHeight: '260px' }}>
                  <div className="space-y-4">
                    <div className="h-6 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="h-20 bg-white/5 rounded-2xl w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', color: '#e5e2e3', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active="dashboard" />
      <Header
        title={`Welcome back, ${user?.displayName || 'Student'}`}
        subtext={user?.semester ? `${user.semester} • MindFlow Active` : "Your cognitive wellness dashboard"}
      />

      {/* Main */}
      <main className="pt-24 pb-0 px-6 md:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto">
          {errorCount >= 3 && (
            <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono flex items-center justify-between z-50 relative">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse text-sm">warning</span>
                <span>TELEMETRY_SYNC_FAILURE: Failed to establish persistent sync link with neural core. Displaying offline/cached metrics.</span>
              </div>
              <button onClick={() => setErrorCount(0)} className="text-[10px] uppercase underline underline-offset-2 hover:text-white cursor-pointer font-bold">DISMISS</button>
            </div>
          )}
          {/* Hero Bento */}
          <div className="pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              {/* MoodMap Orb */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-8 glass-panel rounded-[2rem] p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[550px] hud-border">
                <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                  <div className="w-4/5 h-4/5 rounded-full border border-[#e1fdff]/20 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute w-3/5 h-3/5 rounded-full border border-[#D2FF00]/10 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                </div>
                <div className="text-center z-10 mb-8">
                  <h2 className="font-bold tracking-widest uppercase mb-1" style={{ fontFamily: 'Space Grotesk', fontSize: 24, color: '#e1fdff' }}>MoodMap Core</h2>
                  <p className="text-[9px] terminal-text tracking-[0.3em] animate-pulse mb-4" style={{ color: '#D2FF00' }}>NEURAL ENGINE PROCESSING</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12" style={{ background: 'rgba(210,255,0,0.4)' }} />
                    <p className="terminal-text text-sm">BURNOUT_PROBABILITY: <span className="font-bold" style={{ color: '#D2FF00' }}>{score !== null ? `${score}%` : 'CALCULATING...'}</span></p>
                    <div className="h-px w-12" style={{ background: 'rgba(210,255,0,0.4)' }} />
                  </div>
                </div>
                {/* SVG Orb */}
                <div className="relative w-72 h-72 md:w-96 md:h-96 z-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full orb-pulse" style={{ background: 'rgba(0,219,231,0.1)', filter: 'blur(80px)' }} />
                  <svg className="w-full h-full mood-orb-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#74f5ff" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#006a71" stopOpacity="0.2" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="85" fill="none" stroke="#D2FF00" strokeDasharray="10 5" strokeWidth="0.5" className="animate-spin" style={{ animationDuration: '8s' }} />
                    <circle cx="100" cy="100" r="95" fill="none" stroke="#00dbe7" strokeDasharray="2 10" strokeWidth="0.2" className="animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                    <circle cx="100" cy="100" r="70" fill="url(#orbGrad)" className="orb-pulse heartbeat" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-bold drop-shadow-lg" style={{ fontFamily: 'Space Grotesk', fontSize: 48, color: 'white' }}>{label}</span>
                    <p className="terminal-text tracking-[0.4em] text-[10px] mt-2" style={{ color: '#D2FF00' }}>{sublabel}</p>
                    <p className="terminal-text tracking-[0.2em] text-[8px] opacity-60 mt-1" style={{ color: '#b9cacb' }}>REAL-TIME SYNC</p>
                  </div>
                </div>
                {/* Stats row */}
                <div className="mt-12 flex gap-12 z-10 w-full justify-center">
                  {[['STRESS_LEVEL', score === null ? '---' : score < 30 ? 'LOW' : score < 60 ? 'MED' : 'HIGH'],
                  ['ACADEMIC_LOAD', academicLoad.label.toUpperCase()],
                  ['SLEEP_QLTY', score === null ? '---' : `${Math.max(15, Math.round(100 - score * 0.8))}%`]].map(([k, v]) => (
                    <div key={k} className="text-center group cursor-default">
                      <p className="text-[10px] terminal-text opacity-60 mb-1" style={{ color: '#b9cacb' }}>{k}</p>
                      <p className="font-semibold text-2xl transition-colors" style={{ fontFamily: 'Space Grotesk', color: (v === 'HIGH' || v === 'CRITICAL') ? '#ffb4ab' : '#e1fdff' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right column */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                {/* Daily Check-in */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-panel rounded-[2rem] p-8 hud-border">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-semibold text-xl tracking-wide" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Daily Status</h3>
                    <span className="material-symbols-outlined animate-pulse" style={{ color: checkedInToday ? '#34d399' : '#D2FF00' }}>
                      {checkedInToday ? 'check_circle' : 'bolt'}
                    </span>
                  </div>

                  {checkedInToday ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-105"
                        style={{
                          background: 'rgba(52, 211, 153, 0.1)',
                          border: '2px solid rgba(52, 211, 153, 0.4)',
                          boxShadow: '0 0 25px rgba(52, 211, 153, 0.2)'
                        }}>
                        <span className="material-symbols-outlined text-4xl text-[#34d399]">done_all</span>
                      </div>
                      <p className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: '#34d399', fontFamily: 'Space Grotesk' }}>
                        Checked in today
                      </p>
                      <p className="text-[10px] terminal-text opacity-70 tracking-widest mb-6" style={{ color: '#b9cacb' }}>
                        COGNITIVE TELEMETRY SECURED
                      </p>

                      <div className="w-full bg-[#000]/30 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
                        <div className="text-left">
                          <p className="text-[9px] terminal-text opacity-50 mb-0.5">CURRENT_INDEX</p>
                          <p className="text-sm font-semibold" style={{ color: '#e1fdff' }}>Burnout Risk</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-mono" style={{ color: score !== null ? (score < 30 ? '#00DBE7' : score < 60 ? '#D2FF00' : '#ffb4ab') : '#e1fdff' }}>
                            {score !== null ? `${score}%` : '---'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs terminal-text opacity-70 tracking-widest mb-8" style={{ color: '#b9cacb' }}>HOW ARE YOU VIBRATING TODAY?</p>
                      <div className="grid grid-cols-2 gap-4">
                        {[['mood', 'Focused'], ['cloud', 'Drained'], ['auto_awesome', 'Creative'], ['self_improvement', 'Restless']].map(([icon, label]) => (
                          <Link key={icon} to="/checkin">
                            <button className="magnetic-btn w-full flex flex-col items-center gap-3 p-6 rounded-2xl border group transition-all"
                              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                              <span className="material-symbols-outlined text-3xl group-hover:text-[#D2FF00] transition-colors" style={{ color: '#e1fdff' }}>{icon}</span>
                              <span className="text-[10px] terminal-text opacity-80" style={{ color: '#b9cacb' }}>{label}</span>
                            </button>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>

                {/* AI Insights */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-panel rounded-[2rem] p-8 flex-1 border-l-[3px]" style={{ borderLeftColor: 'rgba(210,255,0,0.6)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,219,231,0.1)' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#e1fdff', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <h3 className="font-semibold text-xl tracking-tight" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Predictive Mesh Insights</h3>
                  </div>
                  <div className="space-y-6">
                    {burnout?.advice && burnout.advice.length > 0 ? (
                      burnout.advice.slice(0, 2).map((a, i) => (
                        <div key={i} className="relative pl-6" style={{ borderLeft: `2px solid ${i === 0 ? 'rgba(210,255,0,0.3)' : 'rgba(0,219,231,0.3)'}`, paddingLeft: 24 }}>
                          <p className="text-[9px] terminal-text mb-1 tracking-[0.2em]" style={{ color: i === 0 ? '#D2FF00' : '#e1fdff' }}>{i === 0 ? 'PROACTIVE ALERT' : 'SUGGESTION'}</p>
                          <p className="text-sm leading-relaxed opacity-90" style={{ color: '#e5e2e3' }}>{a}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="relative pl-6" style={{ borderLeft: '2px solid rgba(210,255,0,0.3)', paddingLeft: 24 }}>
                          <p className="text-[9px] terminal-text mb-1 tracking-[0.2em]" style={{ color: '#D2FF00' }}>INITIALIZING_MESH</p>
                          <p className="text-sm leading-relaxed opacity-90" style={{ color: '#e5e2e3' }}>Analyzing your neural patterns. Complete a check-in for deep insights.</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Link to="/calmcal">
                    <button className="mt-8 text-[10px] terminal-text font-bold flex items-center gap-2 transition-all hover:opacity-100 opacity-80 group" style={{ color: '#e1fdff' }}>
                      FULL_ANALYSIS_DATA <span className="material-symbols-outlined text-[10px] group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>


        </div>
      </main>

    </div>
  );
}
