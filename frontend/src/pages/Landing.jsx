import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralCanvas from '../components/NeuralCanvas';
import TiltCard from '../components/TiltCard';

export default function Landing() {
  const navigate = useNavigate();
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [activeCore, setActiveCore] = useState(null);


  const [showAlert, setShowAlert] = useState(false);

  const handleCtaSubmit = (e) => {
    e.preventDefault();
    if (ctaEmail.trim()) {
      navigate('/auth');
    }
  };


  // Floating demo alert — shows automatically to wow hackathon judges
  useEffect(() => {
    const show1 = setTimeout(() => setShowAlert(true), 2500);
    const hide1 = setTimeout(() => setShowAlert(false), 8500);
    const interval = setInterval(() => {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);
    }, 16000);
    return () => { clearTimeout(show1); clearTimeout(hide1); clearInterval(interval); };
  }, []);

  useEffect(() => {
    // Custom cursor
    const onMove = (e) => {
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };
    document.addEventListener('mousemove', onMove);

    // Scroll reveal + nav
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    const nav = document.getElementById('main-nav');
    const onScroll = () => {
      const y = window.scrollY;
      revealEls.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) el.classList.add('active');
      });
      if (nav) {
        if (y > 20) nav.classList.add('bg-[#030305]/80', 'border-white/10');
        else nav.classList.remove('bg-[#030305]/80', 'border-white/10');
      }
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    // Mouse parallax for hero layers
    const onMouseMove = (e) => {
      document.querySelectorAll('.parallax-layer').forEach(layer => {
        const d = parseFloat(layer.dataset.depth) || 0;
        const x = (window.innerWidth / 2 - e.pageX) / 60;
        const y = (window.innerHeight / 2 - e.pageY) / 60;
        layer.style.transform = `translate3d(${x * d}px,${y * d}px,0)`;
      });
    };
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div style={{ background: 'transparent', color: '#e5e2e3', cursor: 'none', overflowX: 'hidden', fontFamily: 'Space Grotesk, sans-serif' }}>
      {/* Custom cursor */}
      <div className="custom-cursor" />
      <div className="custom-cursor-follower" />



      {/* Nav */}
      <nav id="main-nav" className="fixed top-0 w-full z-50 flex justify-between items-center px-10 py-6 transition-all duration-500 backdrop-blur-xl bg-[#030305]/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, letterSpacing: '-0.04em', color: '#e1fdff' }}>MINDFLOW</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: 'rgba(255,68,68,0.08)', borderColor: 'rgba(255,68,68,0.25)' }}>
            <span className="live-dot" />
            <span className="text-[9px] terminal-text font-bold tracking-widest" style={{ color: '#ff6666' }}>LIVE</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-12">
          {['DASHBOARD', 'RESOURCES', 'COMMUNITY'].map((l, i) => {
            const dest = i === 0 ? '/dashboard' : (i === 1 ? '/resources' : '/community');
            return (
              <motion.div
                key={l}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link to={dest} className="text-[11px] font-semibold tracking-[0.3em] transition-colors duration-300"
                  style={{ color: i === 0 ? '#e1fdff' : '#b9cacb' }}>{l}</Link>
              </motion.div>
            );
          })}
        </div>
        <Link to="/auth">
          <button className="px-8 py-3 rounded-full font-bold text-xs tracking-[0.2em] transition-all hover:scale-105"
            style={{ background: '#e1fdff', color: '#003548' }}>
            GET STARTED
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="sticky top-0 min-h-screen flex flex-col items-center justify-center text-center px-10 overflow-hidden z-10">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Neural particle network — reacts to mouse */}
          <NeuralCanvas style={{ opacity: 0.38 }} />
          {/* Aurora depth blobs */}
          <div className="aurora-blob aurora-cyan" style={{ width: '70vw', height: '55vh', top: '5%', left: '10%' }} />
          <div className="aurora-blob aurora-lime" style={{ width: '55vw', height: '65vh', top: '25%', right: '5%' }} />
          <div className="aurora-blob aurora-purple" style={{ width: '50vw', height: '50vh', bottom: '8%', left: '40%' }} />
        </div>
        <div className="relative z-10 ultra-wide space-y-10" style={{ animation: 'heroReveal 1.2s cubic-bezier(0.22,1,0.36,1) forwards', opacity: 0 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(48px,7vw,80px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: '#e1fdff' }}>
            PREDICT <span style={{ fontStyle: 'italic', fontWeight: 300 }}>BURNOUT.</span><br />
            PREVENT <span style={{ color: '#D2FF00' }}>CRISIS.</span>
          </h1>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-px w-20" style={{ background: 'linear-gradient(90deg,transparent,#e1fdff)' }} />
            <p className="text-[11px] font-semibold tracking-[0.5em]" style={{ color: '#e1fdff' }}>PROTECT STUDENTS</p>
            <div className="h-px w-20" style={{ background: 'linear-gradient(270deg,transparent,#e1fdff)' }} />
          </div>
          <p className="text-lg font-light max-w-2xl mx-auto leading-relaxed" style={{ color: '#b9cacb' }}>
            Shift mental health support from reactive response to proactive prevention with next-generation AI emotional intelligence.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-12">
            <Link to="/auth">
              <button className="px-12 py-5 rounded-full font-bold text-sm tracking-[0.2em] transition-all hover:scale-105"
                style={{ background: '#e1fdff', color: '#003548', boxShadow: '0 0 40px rgba(225,253,255,0.2)' }}>
                FOR STUDENTS
              </button>
            </Link>
            <Link to="/auth">
              <button className="px-12 py-5 rounded-full font-bold text-sm tracking-[0.2em] transition-all border"
                style={{ color: '#e1fdff', borderColor: 'rgba(225,253,255,0.2)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(24px)' }}>
                FOR INSTITUTIONS
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-12 flex flex-col items-center gap-4" style={{ opacity: 0.4 }}>
          <span className="text-[10px] tracking-[0.4em] terminal-text">SCROLL TO EXPLORE</span>
          <div className="w-px h-20" style={{ background: 'linear-gradient(to bottom,#e1fdff,rgba(225,253,255,0.5),transparent)' }} />
        </div>
      </section>

      {/* Bento Grid */}
      <section className="sticky top-0 min-h-screen py-20 px-10 border-t z-20 flex items-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ background: 'rgba(3,3,5,0.4)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="ultra-wide">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* MoodMap */}
            <div className="md:col-span-7 glass-panel reveal-on-scroll rounded-[3rem] p-16 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none transition-all duration-700"
                style={{ background: 'rgba(0,219,231,0.05)', filter: 'blur(100px)' }} />
              <div className="flex flex-col h-full justify-between gap-16">
                <div className="max-w-md">
                  <span className="text-[11px] font-semibold tracking-[0.3em] block mb-8" style={{ color: '#D2FF00' }}>MODULE 01</span>
                  <h3 className="text-3xl font-bold mb-6" style={{ color: '#e1fdff', fontFamily: 'Space Grotesk' }}>MOODMAP</h3>
                  <p className="text-lg font-light leading-relaxed" style={{ color: '#b9cacb' }}>
                    Our AI parses micro-patterns in sentiment to predict mental fatigue before it peaks. Real-time emotional scoring at your fingertips.
                  </p>
                </div>
                <div className="relative h-64 rounded-3xl border p-10 overflow-hidden transition-all"
                  style={{ background: 'rgba(53,52,54,0.2)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-end gap-5 h-full">
                    {[40, 65, 90, 50, 30].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-2xl transition-all duration-1000 relative"
                        style={{ height: `${h}%`, background: h === 90 ? 'rgba(210,255,0,0.4)' : 'rgba(0,219,231,0.15)' }}>
                        {h === 90 && <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest" style={{ background: '#D2FF00', color: '#020202' }}>CRITICAL</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Right cards */}
            <div className="md:col-span-5 flex flex-col gap-12">
              <div className="glass-panel reveal-on-scroll rounded-[3rem] p-12 flex flex-col items-center justify-center text-center gap-8 flex-grow"
                style={{ transitionDelay: '100ms' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center border" style={{ background: 'rgba(182,0,248,0.1)', borderColor: 'rgba(182,0,248,0.2)' }}>
                  <span className="material-symbols-outlined text-5xl" style={{ color: '#ebb2ff' }}>query_stats</span>
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>INSIGHTS</h4>
                  <p className="font-light px-6" style={{ color: '#b9cacb' }}>Instant feedback on cognitive load and emotional trajectory.</p>
                </div>
              </div>
              <div className="glass-panel reveal-on-scroll rounded-[3rem] p-12 flex flex-col gap-8 relative overflow-hidden"
                style={{ transitionDelay: '200ms', borderColor: 'rgba(0,219,231,0.1)' }}>
                <span className="text-[11px] font-semibold tracking-[0.3em]" style={{ color: '#D2FF00' }}>MODULE 02</span>
                <h3 className="text-2xl font-bold" style={{ color: '#e1fdff', fontFamily: 'Space Grotesk' }}>CALMCAL</h3>
                <p className="font-light" style={{ color: '#b9cacb' }}>Stress-aware calendar assistant visualizing your week as a thermal stress map.</p>
              </div>
            </div>
            {/* WellPulse */}
            <div className="md:col-span-12 glass-panel reveal-on-scroll rounded-[3rem] p-16 overflow-hidden relative" style={{ transitionDelay: '150ms' }}>
              <div className="flex flex-col md:flex-row gap-20 items-center">
                <div className="flex-1 space-y-10">
                  <span className="text-[11px] font-semibold tracking-[0.3em]" style={{ color: '#D2FF00' }}>MODULE 03</span>
                  <h3 className="text-4xl font-bold tracking-tight" style={{ color: '#e1fdff', fontFamily: 'Space Grotesk' }}>WELLPULSE</h3>
                  <p className="text-lg font-light leading-relaxed" style={{ color: '#b9cacb' }}>
                    For Institutions: High-fidelity wellbeing analytics that help counselors monitor campus-wide mental health with privacy-first architecture.
                  </p>
                  <Link to="/auth">
                    <button className="flex items-center gap-4 font-bold uppercase tracking-[0.4em] text-xs group" style={{ color: '#D2FF00' }}>
                      EXPLORE DASHBOARD <span className="material-symbols-outlined transition-transform duration-500 group-hover:translate-x-4">east</span>
                    </button>
                  </Link>
                </div>
                <div className="flex-1 w-full">
                  <div className="aspect-video glass-panel rounded-2xl overflow-hidden border relative group/preview" style={{ borderColor: 'rgba(0,219,231,0.2)' }}>
                    <img 
                      src="/analytics.png" 
                      alt="WellPulse Analytics Dashboard Preview" 
                      className="w-full h-full object-cover opacity-70 group-hover/preview:opacity-100 group-hover/preview:scale-[1.02] transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030305]/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#060608]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-bold tracking-widest text-[#00DBE7] uppercase">
                      <span className="material-symbols-outlined text-[12px] animate-pulse">analytics</span>
                      LIVE PREVIEW ACTIVE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Core */}
      <section className="sticky top-0 min-h-screen py-20 px-10 border-t z-30 flex items-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ background: 'rgba(3,3,5,0.6)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="ultra-wide space-y-16">
          <div className="text-center reveal-on-scroll">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#e1fdff', fontFamily: 'Space Grotesk' }}>INTELLIGENCE CORE</h2>
            <p className="mt-4 text-sm tracking-widest terminal-text" style={{ color: '#b9cacb' }}>PROPRIETARY TECHNOLOGY STACK</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'memory', color: '#e1fdff', title: 'Neural Engine', tags: ['AI', 'CORE'], desc: 'ADVANCED PATTERN RECOGNITION, COGNITIVE MODELING, REAL-TIME PROCESSING' },
              { icon: 'hub', color: '#D2FF00', title: 'Predictive Mesh', tags: ['INFRA', 'NETWORK'], desc: 'DISTRIBUTED SENSOR NETWORK, TOPOLOGICAL DATA ANALYSIS, PREDICTIVE ROUTING' },
              { icon: 'sync_alt', color: '#ebb2ff', title: 'Sync Protocol', tags: ['PROTOCOL', 'API'], desc: 'BI-DIRECTIONAL TELEMETRY, END-TO-END ENCRYPTION, LOW LATENCY WEBSOCKETS' },
            ].map((card, i) => (
              <TiltCard key={i} className="glass-panel reveal-on-scroll rounded-2xl overflow-hidden group" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="relative h-64 flex items-center justify-center border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="material-symbols-outlined transition-all duration-700 group-hover:scale-110 relative z-10"
                    style={{ fontSize: 80, color: `${card.color}99` }}>{card.icon}</span>
                  <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                    {card.tags.map(t => (
                      <span key={t} className="px-2 py-1 rounded text-[10px] font-semibold tracking-[0.2em] terminal-text"
                        style={{ background: 'rgba(42,42,43,0.8)', color: '#b9cacb' }}>{t}</span>
                    ))}
                  </div>
                  <button onClick={() => navigate('/auth')} className="absolute bottom-4 right-4 w-10 h-10 rounded flex items-center justify-center transition-colors duration-300 z-10 cursor-pointer"
                    style={{ background: '#e5e2e3', color: '#131314' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#D2FF00'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#e5e2e3'; }}>
                    <span className="material-symbols-outlined text-base">arrow_outward</span>
                  </button>
                </div>
                <div className="p-8" style={{ background: 'rgba(28,27,28,0.3)' }}>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: card.color, fontFamily: 'Space Grotesk' }}>{card.title}</h3>
                  <p className="text-xs tracking-[0.15em] terminal-text leading-relaxed opacity-60" style={{ color: '#b9cacb' }}>{card.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="sticky top-0 min-h-screen py-40 px-10 text-center border-t z-40 flex items-center justify-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="ultra-wide relative z-10 space-y-16 reveal-on-scroll">
          <h2 className="font-bold tracking-tighter" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(40px,6vw,80px)', color: '#e1fdff' }}>
            READY FOR<br />FLOW STATE?
          </h2>
          <form onSubmit={handleCtaSubmit} className="flex flex-col md:flex-row justify-center gap-4 max-w-2xl mx-auto">
            <input className="rounded-full px-10 py-6 w-full outline-none terminal-text text-xs tracking-widest bg-white/[0.03]"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#e5e2e3' }}
              placeholder="ENTER INSTITUTION EMAIL" type="email" value={ctaEmail} onChange={e => setCtaEmail(e.target.value)} required />
            <button type="submit" className="px-12 py-6 rounded-full font-bold tracking-[0.2em] text-xs whitespace-nowrap transition-all hover:shadow-[0_0_40px_rgba(210,255,0,0.4)] cursor-pointer"
              style={{ background: '#D2FF00', color: '#020202' }}>
              GET EARLY ACCESS
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="sticky top-0 w-full py-20 px-10 border-t z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        style={{ background: 'rgba(3,3,5,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="ultra-wide grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
          <div className="flex flex-col gap-6">
            <span className="font-bold tracking-tighter" style={{ fontFamily: 'Space Grotesk', fontSize: 28, color: '#e1fdff' }}>MINDFLOW</span>
            <p className="text-[11px] tracking-[0.3em] terminal-text leading-relaxed opacity-40" style={{ color: '#b9cacb' }}>
              © 2024 MINDFLOW ECOSYSTEM.<br />ELEVATE YOUR CONSCIOUSNESS.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {['PRIVACY', 'ETHICS AI', 'RESEARCH', 'CONTACT'].map(l => (
              <a key={l} href="#" className="text-[11px] font-semibold tracking-[0.3em] terminal-text transition-colors hover:text-[#D2FF00]" style={{ color: '#b9cacb' }}>{l}</a>
            ))}
          </div>
          <div className="flex md:justify-end gap-10">
            {['language', 'share', 'terminal'].map(i => (
              <span key={i} className="material-symbols-outlined cursor-pointer transition-colors hover:text-[#e1fdff]" style={{ color: '#b9cacb' }}>{i}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* Demo Alert Toast — auto-appears to showcase live monitoring capability */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ x: '130%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '130%', opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-32 right-6 z-[200] max-w-[290px] cursor-pointer"
            onClick={() => navigate('/auth')}
            style={{
              background: 'rgba(9,9,11,0.97)',
              border: '1px solid rgba(255,180,171,0.25)',
              borderRadius: 20,
              padding: '18px 20px',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 24px 70px rgba(0,0,0,0.65), 0 0 50px rgba(255,80,80,0.07)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,180,171,0.12)', border: '1px solid rgba(255,180,171,0.3)' }}>
                <div className="w-2 h-2 rounded-full bg-[#ffb4ab]" style={{ animation: 'livePulse 1s ease-in-out infinite' }} />
              </div>
              <div>
                <p className="text-[9px] terminal-text font-bold tracking-widest uppercase mb-1.5" style={{ color: '#ffb4ab' }}>
                  BURNOUT ALERT · LIVE
                </p>
                <p className="text-xs leading-relaxed mb-2.5" style={{ color: '#e5e2e3' }}>
                  High risk detected in CS cluster — 3 students flagged for counselor review.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D2FF00] animate-pulse" />
                  <p className="text-[9px] terminal-text font-semibold" style={{ color: '#D2FF00' }}>AI INTERVENTION QUEUED</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* FAB */}
      <Link to="/checkin">
        <button className="fixed bottom-12 right-12 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
          style={{ background: '#e1fdff', color: '#003548' }}>
          <span className="material-symbols-outlined font-bold">bolt</span>
        </button>
      </Link>



      <style>{`
        @keyframes heroReveal { to { opacity:1; transform:translateY(0); } }
        body { cursor: none; }
      `}</style>
    </div>
  );
}
