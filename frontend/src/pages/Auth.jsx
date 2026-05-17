import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAdditionalUserInfo } from 'firebase/auth';

export default function Auth() {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [signupRole, setSignupRole] = useState('student');


  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let isNew = false;
      let userRole = 'student';
      if (tab === 'signin') {
        const res = await login(email, password);
        isNew = res?.isNewUser;
        userRole = res?.role || 'student';
      } else {
        const res = await signup(email, password, name || 'Student', signupRole);
        isNew = res?.isNewUser;
        userRole = signupRole;
      }
      navigate(isNew ? '/onboarding' : (userRole === 'counselor' ? '/wellpulse' : '/dashboard'));
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account already exists with this email. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment before trying again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'signup') {
        // New user flow — set pending flag so auth page 
        // stays mounted and form fields get populated
        localStorage.setItem('google_signup_pending', 'true');
        localStorage.setItem('mf_signup_role', signupRole);
      }

      const result = await loginWithGoogle();
      if (!result) return;

      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser;

      if (tab === 'signin') {
        // Sign in flow — existing user only
        if (isNewUser) {
          // They don't have an account — tell them to sign up
          await result.user.delete(); // remove the auto-created Firebase user
          localStorage.removeItem('google_signup_pending');
          setError('No account found with this Google account. Please create an account first.');
          return;
        }
        // Existing user — redirect to dashboard (handled by onAuthStateChanged)

      } else {
        // Signup flow — new user only
        if (!isNewUser) {
          // Account already exists — tell them to sign in
          localStorage.removeItem('google_signup_pending');
          setError('An account already exists with this Google account. Please sign in instead.');
          setTab('signin');
          return;
        }
        // New user — populate form fields and wait for 2s delay
        setName(result.user.displayName || '');
        setEmail(result.user.email || '');
      }

    } catch (err) {
      localStorage.removeItem('google_signup_pending');
      // Handle specific Firebase auth errors with friendly messages
      const code = err.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in method.');
      } else if (code === 'auth/cancelled-popup-request') {
        // Silently ignore — user opened multiple popups
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 p-6 pt-24 z-10">
      {/* Animated floating orbs — premium depth behind the card */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[
          { size: 520, x: '-8%', y: '5%', color: 'rgba(0,219,231,0.07)', dur: '13s', delay: '0s' },
          { size: 380, x: '85%', y: '-5%', color: 'rgba(210,255,0,0.05)', dur: '16s', delay: '2.5s' },
          { size: 460, x: '72%', y: '65%', color: 'rgba(192,132,252,0.06)', dur: '11s', delay: '1s' },
          { size: 320, x: '18%', y: '72%', color: 'rgba(0,219,231,0.04)', dur: '19s', delay: '4.5s' },
        ].map((orb, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: orb.size, height: orb.size,
              left: orb.x, top: orb.y,
              background: orb.color,
              filter: 'blur(100px)',
              animation: `orbFloat ${orb.dur} ease-in-out infinite`,
              animationDelay: orb.delay,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="block w-fit mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer"
              style={{ background: '#D2FF00', boxShadow: '0 0 30px rgba(210,255,0,0.3)' }}>
              <span className="material-symbols-outlined text-[#020202]" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
          </Link>
          <h1 className="font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, color: '#e1fdff' }}>
            Welcome to MindFlow
          </h1>
          <p className="text-sm font-semibold tracking-widest opacity-60 uppercase" style={{ color: '#b9cacb' }}>
            Proactive Mental Health Interface
          </p>
        </div>

        <div className="glass-panel glow-cycle p-8 md:p-10 relative overflow-hidden" style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* subtle background glow inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DBE7] opacity-5 blur-[100px] pointer-events-none" />

          <div className="flex bg-[#000]/40 rounded-xl p-1 mb-8 border border-white/5 relative z-10">
            {['signin', 'signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-3 text-xs font-bold tracking-widest uppercase rounded-lg transition-all"
                style={{
                  background: tab === t ? 'rgba(0,219,231,0.1)' : 'transparent',
                  color: tab === t ? '#e1fdff' : 'rgba(255,255,255,0.3)',
                  border: tab === t ? '1px solid rgba(0,219,231,0.3)' : '1px solid transparent',
                  boxShadow: tab === t ? '0 0 20px rgba(0,219,231,0.1)' : 'none'
                }}>
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-5 mb-8 relative z-10">
            {tab === 'signup' && (
              <div className="flex bg-[#000]/40 rounded-xl p-1 border border-white/5 relative z-10 gap-2">
                {['student', 'counselor'].map(r => (
                  <button type="button" key={r} onClick={() => setSignupRole(r)}
                    className="flex-1 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all"
                    style={{
                      background: signupRole === r ? 'rgba(192,132,252,0.1)' : 'transparent',
                      color: signupRole === r ? '#c084fc' : 'rgba(255,255,255,0.3)',
                      border: signupRole === r ? '1px solid rgba(192,132,252,0.3)' : '1px solid transparent',
                      boxShadow: signupRole === r ? '0 0 15px rgba(192,132,252,0.1)' : 'none'
                    }}>
                    {r === 'student' ? 'Student' : 'Counselor'}
                  </button>
                ))}
              </div>
            )}
            {tab === 'signup' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[20px]">person</span>
                <input
                  type="text" placeholder="Full Name"
                  className="w-full bg-[#0e0e0f]/80 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-[#e1fdff] placeholder-white/20 focus:outline-none focus:border-[#D2FF00]/50 transition-all"
                  value={name} onChange={e => setName(e.target.value)} required={tab === 'signup'}
                />
              </div>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[20px]">mail</span>
              <input
                type="email" placeholder="you@university.edu"
                className="w-full bg-[#0e0e0f]/80 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-[#e1fdff] placeholder-white/20 focus:outline-none focus:border-[#D2FF00]/50 transition-all"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[20px]">lock</span>
              <input
                type="password" placeholder="••••••••"
                className="w-full bg-[#0e0e0f]/80 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-[#e1fdff] placeholder-white/20 focus:outline-none focus:border-[#D2FF00]/50 transition-all"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 mt-2 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: '#D2FF00', color: '#0e0e0f', boxShadow: '0 0 20px rgba(210,255,0,0.2)' }}>
              {loading ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'AUTHORIZE ACCESS' : 'INITIALIZE ACCOUNT'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">External Auth</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full py-3 mb-8 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 transition-all border hover:bg-white/5 relative z-10"
            style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#e1fdff' }}>
            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            GOOGLE AUTH
          </button>
        </div>

        <p className="text-center text-[10px] tracking-widest text-white/20 mt-8 font-mono">
          ALL DATA ANONYMIZED. END-TO-END ENCRYPTED.
        </p>
      </motion.div>

      {/* Test Credentials Side Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel w-full max-w-sm"
        style={{
          borderRadius: 24,
          border: '1px solid rgba(0, 219, 231, 0.2)',
          background: 'rgba(3, 3, 5, 0.6)',
          backdropFilter: 'blur(30px)',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 219, 231, 0.05)',
          color: '#e1fdff',
          fontFamily: 'Space Grotesk, sans-serif'
        }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#D2FF00', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          Demo Access Keys
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Counselor credentials */}
          <div 
            onClick={() => { setEmail('counselor@university.edu'); setPassword('mindflow2026'); setTab('signin'); }}
            className="transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Counselor Dashboard</span>
              <span style={{ fontSize: '9px', opacity: 0.4, fontStyle: 'italic', textTransform: 'none' }}>Click to autofill</span>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: '#e1fdff', marginBottom: '4px' }}>
              <span style={{ opacity: 0.4 }}>ID:</span> counselor@university.edu
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: '#e1fdff' }}>
              <span style={{ opacity: 0.4 }}>PW:</span> mindflow2026
            </div>
          </div>

          {/* Student credentials */}
          <div 
            onClick={() => { setEmail('student@university.edu'); setPassword('mindflow2026'); setTab('signin'); }}
            className="transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ fontSize: '10px', color: '#00DBE7', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Student Dashboard</span>
              <span style={{ fontSize: '9px', opacity: 0.4, fontStyle: 'italic', textTransform: 'none' }}>Click to autofill</span>
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: '#e1fdff', marginBottom: '4px' }}>
              <span style={{ opacity: 0.4 }}>ID:</span> student@university.edu
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: '#e1fdff' }}>
              <span style={{ opacity: 0.4 }}>PW:</span> mindflow2026
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
