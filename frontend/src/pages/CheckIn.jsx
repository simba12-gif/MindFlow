import { useState, useMemo } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MoodSlider from '../components/MoodSlider';
import BurnoutGauge from '../components/BurnoutGauge';
import StressOrb from '../components/StressOrb';
import { calculateBurnoutScore } from '../lib/burnoutEngine';
import { useAuth } from '../context/AuthContext';

const PHASES = ['checkin', 'result'];

export default function CheckIn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('checkin');
  const [values, setValues] = useState({ mood: 6, sleep: 7, workload: 5, stress: 4 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const liveResult = useMemo(() => calculateBurnoutScore(values), [values]);

  const set = (k) => (v) => setValues(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = calculateBurnoutScore(values);
      
      // Map to backend schema
      const payload = {
        moodScore: values.mood,
        sleepHours: values.sleep,
        workloadRating: values.workload,
        stressLevel: values.stress,
        notes: "", // Optional notes field
        dateKey: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
      };

      await api.post('/checkins', payload);
      localStorage.setItem('mf_last_checkin_date', payload.dateKey);
      
      // Wait briefly for the server-side async calculation to finish
      await new Promise(r => setTimeout(r, 1200));
      const { data: serverScore } = await api.get('/burnout/me');

      if (serverScore.hasData) {
        // Now fetch real AI insights for the result screen
        const { data: aiRes } = await api.get('/insights/me');
        const local = calculateBurnoutScore(values);
        
        setResult({
          score: serverScore.score,
          risk: serverScore.riskLevel,
          level: serverScore.riskLevel.toUpperCase(),
          trend: serverScore.trend,
          color: local.color, // Keep the color mapping from engine
          insights: aiRes.insights || local.advice
        });
      } else {
        // Fallback to local calculation if server fetch fails or is too slow
        setResult(calculateBurnoutScore(values));
      }
      setPhase('result');
    } catch (err) {
      console.error('Failed to save check-in:', err);
      if (err.response?.status === 400) {
        setError("Sync blocked: You've already submitted a check-in for today.");
        localStorage.setItem('mf_last_checkin_date', new Date().toLocaleDateString('en-CA'));
      } else {
        setError("Neural link unstable: Failed to sync check-in data.");
      }
      
      // Still show local result even if sync fails
      const res = calculateBurnoutScore(values);
      setResult(res);
      setPhase('result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper noise" style={{ minHeight: '100vh' }}>
      <Sidebar active="checkin" />
      <Header title="Mood Check-In" subtext="Take a moment to tune in and log your current state" />

      <div style={{ paddingLeft: '256px', paddingTop: 120, paddingBottom: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── Check-In Form ── */}
          {phase === 'checkin' && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ marginBottom: 32 }}>
                <div className="chip" style={{ marginBottom: 16 }}>
                  <Sparkles size={12} />
                  Daily MoodMap Check-In
                </div>
                <h1 className="heading-md" style={{ marginBottom: 8 }}>How are you feeling today?</h1>
                <p className="body-md">Four questions. 30 seconds. Personalised burnout insight.</p>
              </div>

              {error && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,180,171,0.2)', background: 'rgba(255,180,171,0.05)', color: '#ffb4ab', fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <GlassCard hover={false} style={{ padding: 32, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <MoodSlider label="Overall Mood" value={values.mood} onChange={set('mood')} min={1} max={10} showEmoji />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <MoodSlider label="Sleep last night" value={values.sleep} onChange={set('sleep')} min={0} max={12} step={0.5} unit="h" />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <MoodSlider label="Academic workload" value={values.workload} onChange={set('workload')} min={1} max={10} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <MoodSlider label="Stress level" value={values.stress} onChange={set('stress')} min={1} max={10} />
                </div>
              </GlassCard>

              {/* Live preview */}
              <GlassCard hover={false} style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0 }}>
                  <StressOrb score={liveResult.score} size={64} />
                </div>
                <div>
                  <div className="label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Estimated risk</div>
                  <div style={{ color: liveResult.color, fontWeight: 700, fontSize: 16 }}>
                    {liveResult.level}
                  </div>
                </div>
              </GlassCard>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '16px 0' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Calculating your score…
                  </span>
                ) : (
                  <><span>Analyse my wellbeing</span><ArrowRight size={18} /></>
                )}
              </button>
            </motion.div>
          )}

          {/* ── Result ── */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                  <CheckCircle size={48} color="#34d399" style={{ marginBottom: 16 }} />
                </motion.div>
                <h2 className="heading-md" style={{ marginBottom: 8 }}>Check-in complete!</h2>
                <p className="body-md">Here's your burnout analysis for today.</p>
              </div>

              {/* Orb + score */}
              <GlassCard hover={false} style={{
                padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginBottom: 20,
                background: `linear-gradient(135deg, ${result.color}12, rgba(255,255,255,0.02))`,
                border: `1px solid ${result.color}30`,
              }}>
                <StressOrb score={result.score} size={160} />
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 800, color: result.color, lineHeight: 1 }}>
                    {result.score}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>burnout risk score</div>
                  <div style={{ marginTop: 12, padding: '6px 20px', borderRadius: 50, background: `${result.color}20`, border: `1px solid ${result.color}35`, display: 'inline-block', fontSize: 16, fontWeight: 600, color: result.color }}>
                    {result.level}
                  </div>
                </div>
              </GlassCard>

              {/* Advice */}
              <GlassCard hover={false} style={{ padding: 24, marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 16 }}>AI-generated recovery advice</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(result.insights || result.advice).map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: `${result.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: result.color }}>{i + 1}</div>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{a}</span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard')}>
                  <span>View full dashboard</span><ArrowRight size={18} />
                </button>
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setPhase('checkin'); setResult(null); }}>
                  <RotateCcw size={16} /> Redo check-in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
