import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AudioSessionModal from '../components/resources/AudioSessionModal';
import ArticleModal from '../components/resources/ArticleModal';
import BreathingModal from '../components/resources/BreathingModal';
import HistoryModal from '../components/resources/HistoryModal';

const MOCK_RESOURCES = [
  { id: 1, type: 'article', title: 'Cognitive Reframing Techniques', duration: '5 min read', category: 'Therapy', icon: 'psychology' },
  { id: 2, type: 'audio', title: 'Deep Focus Flow', duration: '45 min audio', category: 'Focus', icon: 'headphones' },
  { id: 3, type: 'exercise', title: 'Box Breathing Routine', duration: '3 min exercise', category: 'Calm', icon: 'air' },
  { id: 4, type: 'video', title: 'Understanding Burnout', duration: '12 min video', category: 'Education', icon: 'smart_display' },
  { id: 5, type: 'article', title: 'Navigating Academic Stress', duration: '8 min read', category: 'Academics', icon: 'menu_book' },
  { id: 6, type: 'audio', title: 'Sleep Synchronization', duration: '30 min audio', category: 'Sleep', icon: 'bedtime' },
];

export default function Resources() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSession, setActiveSession] = useState(null);
  const todayKey = `mf_engaged_${new Date().toLocaleDateString('en-CA')}`;
  const [engagedMinutes, setEngagedMinutes] = useState(() => {
    const saved = localStorage.getItem(`mf_engaged_${new Date().toLocaleDateString('en-CA')}`);
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [showHistory, setShowHistory] = useState(false);
  
  const handleStartSession = (res) => {
    setActiveSession(res);
  };

  const handleSessionComplete = (minutes) => {
    if (minutes > 0) {
      setEngagedMinutes(prev => {
        const newValue = Math.min(prev + minutes, 20); // Cap at 20 for the goal
        localStorage.setItem(todayKey, newValue.toString());
        return newValue;
      });
    }
    setActiveSession(null);
  };

  const filteredResources = MOCK_RESOURCES.filter(res => 
    (selectedCategory === 'All' || res.category === selectedCategory) &&
    (res.title.toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <div className="crt-overlay" style={{ background:'transparent', color:'#e5e2e3', minHeight:'100vh', fontFamily:'Inter, sans-serif' }}>
      <Sidebar active="resources" />
      <Header title="Resource Nexus" subtext="SYNC_STATE: OPTIMAL" searchPlaceholder="Search resources, exercises, media..." onSearch={setSearch} />

      <main className="pt-28 pb-12 px-6 md:ml-64 relative z-20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-bold tracking-tight text-4xl mb-2" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Resource Nexus</h1>
              <p className="text-sm terminal-text opacity-50 uppercase tracking-widest">Curated knowledge & interventions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Featured Resource */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="lg:col-span-8 glass-panel p-8 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DBE7] opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[240px]">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full border border-[#00DBE7]/30 text-[#00DBE7] text-[10px] font-bold tracking-widest mb-4">FEATURED PROTOCOL</span>
                  <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily:'Space Grotesk' }}>Neural Synchronization: Alpha State</h2>
                  <p className="text-white/60 text-sm max-w-xl">A 15-minute guided binaural sequence designed to down-regulate your nervous system and prepare the mind for deep, focused academic work.</p>
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <button 
                    onClick={() => handleStartSession({ title: 'Neural Synchronization: Alpha State', type: 'audio', category: 'Focus' })}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest bg-[#e1fdff] text-[#020202] hover:scale-105 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    START SESSION
                  </button>
                  <span className="text-xs text-white/40 terminal-text">15 MIN • AUDIO</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats / Daily Goal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-4 glass-panel p-8 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-white/50 tracking-widest uppercase mb-6">Daily Knowledge Goal</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle 
                        cx="50" cy="50" r="45" fill="none" stroke="#D2FF00" strokeWidth="6" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - (283 * (engagedMinutes / 20))} 
                        style={{ filter: 'drop-shadow(0 0 6px rgba(210,255,0,0.5))', transition: 'stroke-dashoffset 1s ease-out' }} 
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-[#D2FF00]">{Math.round((engagedMinutes/20)*100)}%</span>
                  </div>
                  <div>
                    <div className="text-white font-bold mb-1">{engagedMinutes} / 20 Mins</div>
                    <div className="text-xs text-white/40">Engaged with resources today</div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowHistory(true)}
                className="w-full py-3 rounded-lg border border-white/10 text-xs font-bold tracking-widest text-white/60 hover:bg-white/5 transition-colors">
                VIEW HISTORY
              </button>
            </motion.div>
          </div>

          {/* Categories */}
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {['All', 'Therapy', 'Focus', 'Calm', 'Education', 'Sleep'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 border border-white/5 hover:border-white/20'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res, i) => (
              <motion.div 
                key={res.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass-panel p-6 group cursor-pointer hover:border-white/20 transition-all hover:-translate-y-1"
                onClick={() => handleStartSession(res)}
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00DBE7]/10 transition-colors border border-white/5 group-hover:border-[#00DBE7]/30">
                    <span className="material-symbols-outlined text-white/60 group-hover:text-[#00DBE7] transition-colors">{res.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase border border-white/10 px-2 py-1 rounded">
                    {res.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-[#e1fdff] transition-colors">{res.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40 terminal-text">
                    <span>{res.duration}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="uppercase">{res.type}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </main>

      {/* Active Session Overlay Modals */}
      <AnimatePresence>
        {activeSession && activeSession.type === 'article' && (
          <ArticleModal 
            key="article" 
            session={activeSession} 
            onClose={() => setActiveSession(null)} 
            onComplete={handleSessionComplete} 
          />
        )}
        {activeSession && activeSession.type === 'exercise' && (
          <BreathingModal 
            key="exercise" 
            session={activeSession} 
            onClose={() => setActiveSession(null)} 
            onComplete={handleSessionComplete} 
          />
        )}
        {activeSession && activeSession.type === 'video' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-3xl glass-panel rounded-[2rem] p-8 border hud-border relative">
              <button onClick={() => setActiveSession(null)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
              <h3 className="font-bold text-2xl mb-2 text-[#e1fdff]" style={{ fontFamily: 'Space Grotesk' }}>{activeSession.title}</h3>
              <p className="text-xs terminal-text text-[#00f2ff] tracking-widest mb-6">VIDEO STREAMING ACTIVE • {activeSession.duration}</p>
              
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 relative flex items-center justify-center">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/sA0uwuCA9d0?autoplay=1" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-[#D2FF00]">info</span>
                  Educational telemetry preview. Mental Health Burnout Protocol active.
                </p>
                <button onClick={() => handleSessionComplete(12)} className="border rounded-lg px-4 py-2 font-bold terminal-text text-[10px] bg-[#D2FF00]/10 border-[#D2FF00]/30 text-[#D2FF00] hover:bg-[#D2FF00]/20 transition-all cursor-pointer">
                  MARK_SESSION_COMPLETE
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {activeSession && activeSession.type === 'audio' && (
          <AudioSessionModal 
            key="audio" 
            session={activeSession} 
            onClose={() => setActiveSession(null)} 
            onComplete={handleSessionComplete} 
          />
        )}
        {showHistory && (
          <HistoryModal 
            key="history"
            engagedMinutes={engagedMinutes}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
