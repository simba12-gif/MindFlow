import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  getDate,
  parseISO
} from 'date-fns';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function CalmCal() {
  const { user } = useAuth();
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly'); // 'weekly' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  const handleScheduleRecovery = async () => {
    try {
      setToast({ message: 'INJECTING_RECOVERY_CYCLES...', type: 'info' });
      
      const isDemo = user?.uid?.startsWith('demo-');
      
      let generatedEvents = [];
      if (isDemo) {
        // Generate a local recovery event for the selectedDate
        const startHour = '14:00';
        const endHour = '14:45';
        const startIso = `${format(selectedDate, 'yyyy-MM-dd')}T${startHour}:00`;
        const endIso = `${format(selectedDate, 'yyyy-MM-dd')}T${endHour}:00`;
        
        generatedEvents = [{
          id: 'recovery_' + Date.now(),
          title: '🌿 MindFlow Recovery Break',
          type: 'recovery',
          startTime: startIso,
          endTime: endIso,
          stressWeight: 0,
          source: 'manual'
        }];
      } else {
        const { data } = await api.post('/calendar/recover');
        generatedEvents = data.events || [];
      }
      
      if (generatedEvents.length > 0) {
        setHeatmap(prev => [...prev, ...generatedEvents]);
        setToast({ message: `Protocol complete: Generated ${generatedEvents.length} recovery breaks.`, type: 'success' });
      } else {
        setToast({ message: 'No high-stress peak periods detected in the next 7 days.', type: 'info' });
      }
      
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.warn('API /calendar/recover failed or offline, generating local fallback:', err);
      const startHour = '14:00';
      const endHour = '14:45';
      const startIso = `${format(selectedDate, 'yyyy-MM-dd')}T${startHour}:00`;
      const endIso = `${format(selectedDate, 'yyyy-MM-dd')}T${endHour}:00`;
      
      const fallbackEvent = {
        id: 'recovery_fallback_' + Date.now(),
        title: '🌿 MindFlow Recovery Break',
        type: 'recovery',
        startTime: startIso,
        endTime: endIso,
        stressWeight: 0,
        source: 'manual'
      };
      
      setHeatmap(prev => [...prev, fallbackEvent]);
      setToast({ message: 'Protocol completed locally: Injected daily recovery break.', type: 'success' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const deletedEvent = heatmap.find(ev => ev.id === eventId);
    setHeatmap(prev => prev.filter(ev => ev.id !== eventId));
    setToast({ message: 'SYNCHRONIZING_DELETION...', type: 'info' });
    
    try {
      const isDemo = !eventId || eventId.startsWith('mock_') || eventId.startsWith('temp_') || eventId.startsWith('recovery_') || eventId.startsWith('temp');
      if (!isDemo) {
        await api.delete(`/calendar/events/${eventId}`);
      }
      setToast({ message: 'Event permanently purged from timeline.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to delete event:', err);
      if (deletedEvent) {
        setHeatmap(prev => [...prev, deletedEvent]);
      }
      setToast({ message: 'Failed to synchronize deletion. Rolled back.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    type: 'class', 
    startDate: format(new Date(), 'yyyy-MM-dd'), 
    endDate: format(new Date(), 'yyyy-MM-dd'), 
    startTime: '', 
    endTime: '', 
    stressWeight: 3 
  });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/calendar/me');
        setHeatmap(data);
      } catch (err) {
        console.error('Failed to fetch calendar heatmap:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Sync modal dates when selectedDate changes in the grid
  useEffect(() => {
    if (selectedDate) {
      const d = format(selectedDate, 'yyyy-MM-dd');
      setNewEvent(prev => ({ ...prev, startDate: d, endDate: d }));
    }
  }, [selectedDate]);

  const handleAddEvent = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Prepare data
    const startIso = `${newEvent.startDate}T${newEvent.startTime}:00`;
    const endIso = `${newEvent.endDate}T${newEvent.endTime}:00`;
    const payload = {
      title: newEvent.title,
      type: newEvent.type,
      startTime: startIso,
      endTime: endIso,
      stressWeight: newEvent.stressWeight
    };

    // --- OPTIMISTIC UPDATE ---
    const tempId = 'temp_' + Date.now();
    const optimisticEvent = {
      id: tempId,
      ...payload,
      source: 'manual'
    };

    // Close modal and update state immediately
    setShowAddModal(false);
    setHeatmap(prev => [...prev, optimisticEvent]);
    
    // Reset form
    setNewEvent({ 
      title: '', 
      type: 'class', 
      startDate: format(new Date(), 'yyyy-MM-dd'), 
      endDate: format(new Date(), 'yyyy-MM-dd'), 
      startTime: '', 
      endTime: '', 
      stressWeight: 3 
    });

    try {
      const { data } = await api.post('/calendar', payload);
      
      // Update the temporary event with the real ID from the server
      setHeatmap(prev => prev.map(ev => ev.id === tempId ? { ...ev, id: data.id } : ev));
    } catch (err) {
      console.error('Failed to add event:', err);
      // ROLLBACK: Remove the optimistic event if the sync failed
      setHeatmap(prev => prev.filter(ev => ev.id !== tempId));
      alert('Neural sync failed. Your timeline has been rolled back.');
    }
  };

  // Build view display
  const displayData = useMemo(() => {
    const today = new Date();
    const intervalStart = view === 'monthly' ? startOfMonth(today) : startOfWeek(today, { weekStartsOn: 1 });
    const intervalEnd = view === 'monthly' ? endOfMonth(today) : addDays(intervalStart, 6);
    
    const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    
    return days.map(day => {
      const dayEvents = heatmap.filter(event => {
        if (!event.startTime) return false;
        return isSameDay(parseISO(event.startTime), day);
      });
      const totalWeight = dayEvents.reduce((acc, curr) => acc + curr.stressWeight, 0);
      const count = dayEvents.length;
      
      // Calculate level based on total stress weight or count
      let lvl = 'empty';
      let color = 'rgba(255,255,255,0.05)';
      
      if (totalWeight >= 10 || count >= 5) {
        lvl = 'critical';
        color = '#ff8aae';
      } else if (totalWeight >= 6 || count >= 3) {
        lvl = 'high';
        color = '#ffb4ab';
      } else if (totalWeight >= 3 || count >= 2) {
        lvl = 'med';
        color = '#D2FF00';
      } else if (totalWeight > 0 || count > 0) {
        lvl = 'low';
        color = '#00f2ff';
      }
      
      return {
        dateObj: day,
        date: getDate(day),
        day: format(day, 'EEE'),
        lvl,
        color,
        val: totalWeight,
        count
      };
    });
  }, [view, heatmap]);

  const selectedDayEvents = useMemo(() => {
    return heatmap.filter(event => {
      if (!event.startTime) return false;
      return isSameDay(parseISO(event.startTime), selectedDate);
    })
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime) - new Date(b.startTime);
      });
  }, [selectedDate, heatmap]);

  // Weekly metrics calculation
  const weeklyMetrics = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    
    const weekEvents = heatmap.filter(event => {
      if (!event.startTime) return false;
      const d = parseISO(event.startTime);
      return d >= start && d <= end;
    });

    const totalWeight = weekEvents.reduce((acc, curr) => acc + curr.stressWeight, 0);
    // Theoretical max: 5 weight units * 3 events per day * 7 days = 105
    // Let's normalize it so 40+ weight is "High Risk"
    const riskScore = Math.min(100, Math.round((totalWeight / 40) * 100));
    
    let loadStatus = 'Optimal';
    let loadColor = '#00f2ff';
    if (riskScore >= 75) {
      loadStatus = 'Heavy';
      loadColor = '#ffb4ab';
    } else if (riskScore >= 40) {
      loadStatus = 'Moderate';
      loadColor = '#D2FF00';
    }

    return {
      riskScore,
      loadStatus,
      loadColor,
      totalWeight,
      count: weekEvents.length
    };
  }, [heatmap]);

  // Deeply Tailored Smart Breaks
  const smartBreaks = useMemo(() => {
    const breaks = [];
    if (selectedDayEvents.length === 0) return [{ icon:'bedtime', color:'#00f2ff', borderColor:'rgba(0,219,231,0.2)', bg:'rgba(0,219,231,0.1)', title:'Rest & Recharge', desc:'No events logged for today. Focus on deep recovery and sleep hygiene.' }];

    const highLoadEvent = selectedDayEvents.find(ev => ev.stressWeight >= 4);
    const totalDuration = selectedDayEvents.reduce((acc, ev) => acc + (new Date(ev.endTime) - new Date(ev.startTime)) / 60000, 0);

    // 1. Post-Peak Recovery
    if (highLoadEvent) {
      breaks.push({ 
        icon:'energy_savings_leaf', color:'#ffb4ab', borderColor:'rgba(255,180,171,0.2)', bg:'rgba(255,180,171,0.1)', 
        title:'Post-Peak Reset', 
        desc: `High-load session "${highLoadEvent.title}" detected. Schedule 15 mins of NSDR (Non-Sleep Deep Rest) immediately after.` 
      });
    }

    // 2. Schedule Gaps
    for (let i = 0; i < selectedDayEvents.length - 1; i++) {
      const gapMin = (new Date(selectedDayEvents[i+1].startTime) - new Date(selectedDayEvents[i].endTime)) / 60000;
      
      if (gapMin >= 30) {
        breaks.push({ 
          icon:'timer', color:'#D2FF00', borderColor:'rgba(210,255,0,0.2)', bg:'rgba(210,255,0,0.1)', 
          title:'Optimal Break Window', 
          desc: `${Math.round(gapMin)}-minute gap found after "${selectedDayEvents[i].title}". Perfect for a mindful walk or hydration.` 
        });
        break; // Just one gap suggestion for now
      }
    }

    // 3. Concentration Strategy
    if (totalDuration > 180) {
      breaks.push({ 
        icon:'psychology', color:'#ebb2ff', borderColor:'rgba(235,178,255,0.2)', bg:'rgba(235,178,255,0.1)', 
        title:'Deep Focus Protocol', 
        desc: `You have ${Math.round(totalDuration/60)}h of work today. Use 90-minute focus blocks to prevent cognitive decline.` 
      });
    }

    return breaks;
  }, [selectedDayEvents]);

  // Scroll parallax
  useEffect(() => {
    const onScroll = () => {
      const s = window.pageYOffset;
      const s1 = document.getElementById('stars-p1');
      const s2 = document.getElementById('stars-p2');
      if (s1) s1.style.transform = `translateY(${s * 0.05}px)`;
      if (s2) s2.style.transform = `translateY(${s * 0.1}px)`;
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="obsidian-grid" style={{ background:'transparent', color:'#e5e2e3', minHeight:'100vh', fontFamily:'Inter, sans-serif' }}>
      <Sidebar active="calmcal" />
      <Header title="CalmCal Scheduler" subtext="Time management, stress tracking, and recovery cycles" />

      {/* Main Canvas */}
      <main className="md:pl-64 pt-24 min-h-screen">
        <div className="px-6 py-8 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 pb-12">
            <div className="space-y-2">
              <h1 className="font-bold" style={{ fontFamily:'Space Grotesk', fontSize:'clamp(40px,5vw,64px)', color:'#e1fdff' }}>CalmCal</h1>
              <p className="text-lg font-light max-w-xl" style={{ color:'#b9cacb' }}>Your schedule, harmonized with your mental state. Predictive burnout mapping powered by the Neural Engine.</p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full border" style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.08)' }}>
              <button 
                onClick={() => setView('weekly')}
                className={`px-6 py-2 rounded-full font-bold text-xs terminal-text transition-all ${view === 'weekly' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-[#b9cacb] hover:text-[#e5e2e3]'}`}
                style={{ background: view === 'weekly' ? 'rgba(0,242,255,0.15)' : 'transparent' }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setView('monthly')}
                className={`px-6 py-2 rounded-full font-bold text-xs terminal-text transition-all ${view === 'monthly' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-[#b9cacb] hover:text-[#e5e2e3]'}`}
                style={{ background: view === 'monthly' ? 'rgba(0,242,255,0.15)' : 'transparent' }}
              >
                Monthly
              </button>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs terminal-text transition-all hover:brightness-110 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              style={{ background:'linear-gradient(135deg, #00f2ff 0%, #006a71 100%)', color:'#001f22' }}
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add Event
            </button>
          </header>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left — Heatmap + Timeline */}
            <div className="lg:col-span-8 space-y-8">
              {/* Thermal Heatmap */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl p-8 overflow-hidden relative shadow-2xl"
                style={{ background:'rgba(14,14,15,0.65)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{ background:'linear-gradient(135deg,rgba(0,219,231,0.05) 0%,rgba(210,255,0,0.05) 50%,rgba(255,180,171,0.1) 100%)' }} />
                <div className={`grid ${view === 'monthly' ? 'grid-cols-7 gap-3' : 'grid-cols-7 gap-4'} mb-6 relative z-10`}>
                  {DAYS.map(d => <div key={d} className="text-center text-[10px] terminal-text font-bold pb-2 uppercase tracking-widest" style={{ color:'#b9cacb', opacity:0.5 }}>{d}</div>)}
                  {displayData.map((item, i) => (
                    <motion.div 
                      layout
                      key={i} 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      onClick={() => setSelectedDate(item.dateObj)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 hover:scale-110 cursor-pointer group ${isSameDay(selectedDate, item.dateObj) ? 'ring-2 ring-white/20' : ''}`}
                      style={{ 
                         background: isSameDay(selectedDate, item.dateObj) ? `${item.color}30` : (item.lvl === 'empty' ? 'rgba(255,255,255,0.03)' : `${item.color}15`),
                        border: `1px solid ${isSameDay(selectedDate, item.dateObj) ? item.color : (item.lvl === 'empty' ? 'rgba(255,255,255,0.05)' : `${item.color}30`)}`,
                        boxShadow: item.lvl === 'critical' ? `0 0 15px ${item.color}20` : 'none',
                        zIndex: isSameDay(selectedDate, item.dateObj) ? 20 : 1
                      }}
                    >
                      <span className="font-bold text-sm" style={{ color: item.lvl === 'empty' ? '#4a4a4b' : item.color }}>{item.date}</span>
                      {view === 'weekly' && item.lvl === 'critical' && <span className="text-[8px] font-bold mt-1 tracking-tighter" style={{ color:item.color }}>PEAK</span>}
                      {view === 'weekly' && item.lvl === 'low' && <span className="material-symbols-outlined text-[10px] mt-0.5" style={{ color:item.color }}>spa</span>}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                        <div className="bg-[#0e0e0f] border border-white/10 rounded-lg px-3 py-2 text-[10px] terminal-text whitespace-nowrap shadow-2xl">
                          <span className="font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.lvl}_STATE</span>
                          <div className="text-[#b9cacb] mt-0.5">Stress Level: {item.val}/10</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Recovery Injection */}
                <div className="recovery-alert-glow rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-4 relative overflow-hidden">
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ background:'rgba(0,219,231,0.2)', borderColor:'rgba(0,219,231,0.3)' }}>
                      <span className="material-symbols-outlined text-4xl" style={{ color:'#e1fdff' }}>energy_savings_leaf</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-widest" style={{ background:'#e1fdff', color:'#003548' }}>Priority</span>
                        <h4 className="font-semibold text-xl" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Recovery Injection</h4>
                      </div>
                      <p className="text-sm" style={{ color:'#b9cacb' }}>AI suggests a 45-min deep focus break after the Exam period.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleScheduleRecovery}
                    className="relative z-10 px-8 py-3 rounded-full font-bold text-xs terminal-text transition-all hover:shadow-[0_0_20px_rgba(0,219,231,0.4)] cursor-pointer"
                    style={{ background:'#e1fdff', color:'#003548' }}
                  >
                    Schedule Now
                  </button>
                </div>
              </motion.div>

              {/* Daily Timeline */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="rounded-3xl p-8 shadow-2xl" style={{ background:'rgba(14,14,15,0.65)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-2xl" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Daily Flow: {format(selectedDate, 'MMM d')}</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ background:'rgba(0,219,231,0.1)', borderColor:'rgba(0,219,231,0.2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full sync-protocol" style={{ background:'#e1fdff' }} />
                      <span className="text-[10px] font-bold terminal-text tracking-widest" style={{ color:'#e1fdff' }}>Sync Protocol</span>
                    </div>
                  </div>
                  <span className="px-4 py-1 rounded-full text-xs terminal-text border" style={{ background:'rgba(255,180,171,0.1)', color:'#ffb4ab', borderColor:'rgba(255,180,171,0.3)' }}>{selectedDayEvents.length} Events</span>
                </div>
                <div className="space-y-6 relative ml-4 pl-8" style={{ borderLeft:'2px solid rgba(255,255,255,0.08)' }}>
                  {selectedDayEvents.length > 0 ? selectedDayEvents.map((item, i) => (
                    <div key={i} className="timeline-item relative group py-2">
                      <div className="absolute w-5 h-5 rounded-full border-2 sync-protocol transition-colors"
                        style={{ left:-42, top:16, background:'#0e0e0f', borderColor: item.stressWeight >= 4 ? '#ffb4ab' : '#e1fdff', boxShadow: item.stressWeight >= 4 ? '0 0 10px #ffb4ab' : 'none' }} />
                      <div className="timeline-drawer rounded-2xl p-5 border transition-all"
                        style={{ background: item.stressWeight >= 4 ? 'rgba(255,180,171,0.05)' : 'rgba(14,14,15,0.65)', backdropFilter:'blur(8px)', borderColor: item.stressWeight >= 4 ? 'rgba(255,180,171,0.2)' : 'rgba(255,255,255,0.08)' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs terminal-text mb-1" style={{ color:'#e1fdff' }}>{format(parseISO(item.startTime), 'hh:mm a')}</p>
                            <h5 className="font-bold text-lg" style={{ fontFamily:'Space Grotesk', color: item.stressWeight >= 4 ? '#ffb4ab' : '#e1fdff' }}>{item.title}</h5>
                            <p className="text-sm opacity-60" style={{ color:'#b9cacb' }}>Weight: {item.stressWeight}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button 
                              onClick={() => handleDeleteEvent(item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all cursor-pointer mb-1"
                              title="Delete Event"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                            <span className="px-3 py-1 rounded-lg text-[10px] font-bold terminal-text" style={{ background:'rgba(42,42,43,0.8)', color:'#b9cacb' }}>
                              {Math.round((new Date(item.endTime) - new Date(item.startTime)) / 60000)} MIN
                            </span>
                            {item.type === 'recovery' && <span className="text-[10px] font-bold italic" style={{ color:'#D2FF00' }}>Recommended</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 opacity-40">
                      <span className="material-symbols-outlined text-4xl mb-2">calendar_today</span>
                      <p className="terminal-text text-sm">NO_EVENTS_LOGGED_FOR_THIS_INTERVAL</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right sidebar panel */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Burnout Ring */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-3xl p-8 border-t-2 shadow-2xl" 
                style={{ 
                  background:'rgba(14,14,15,0.65)', 
                  backdropFilter:'blur(24px)', 
                  border:'1px solid rgba(255,255,255,0.1)', 
                  borderTop:`2px solid ${weeklyMetrics.loadColor}80` 
                }}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="material-symbols-outlined" style={{ color: weeklyMetrics.loadColor }}>{weeklyMetrics.riskScore >= 75 ? 'warning' : 'bolt'}</span>
                  <h3 className="font-semibold text-2xl" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Weekly Burnout</h3>
                </div>
                <div className="relative h-48 flex items-center justify-center mb-6">
                  <svg className="w-40 h-40 -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(42,42,43,1)" strokeWidth="8" />
                    <circle 
                      cx="80" cy="80" r="70" fill="transparent" stroke={weeklyMetrics.loadColor} 
                      strokeDasharray="440" 
                      strokeDashoffset={440 - (440 * weeklyMetrics.riskScore) / 100} 
                      strokeLinecap="round" strokeWidth="12" 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold transition-all" style={{ color: weeklyMetrics.loadColor }}>{weeklyMetrics.riskScore}%</span>
                    <span className="text-[10px] terminal-text uppercase tracking-widest" style={{ color:'#b9cacb' }}>
                      {weeklyMetrics.riskScore >= 75 ? 'High Risk' : weeklyMetrics.riskScore >= 40 ? 'Moderate' : 'Stable'}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    ['Academic Load', weeklyMetrics.loadStatus, weeklyMetrics.loadColor, weeklyMetrics.riskScore],
                    ['Sleep Reserve', weeklyMetrics.riskScore > 80 ? 'Critical' : 'Normal', weeklyMetrics.riskScore > 80 ? '#ffb4ab' : '#e1fdff', 100 - weeklyMetrics.riskScore]
                  ].map(([k,v,c,w]) => (
                    <div key={k}>
                      <div className="flex justify-between items-center text-xs terminal-text mb-1">
                        <span style={{ color:'#e5e2e3' }}>{k}</span>
                        <span className="font-bold" style={{ color:c }}>{v}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(42,42,43,1)' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${w}%` }}
                          className="h-full rounded-full" 
                          style={{ background:c }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Smart Breaks */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-3xl p-8 shadow-2xl" style={{ background:'rgba(14,14,15,0.65)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-2xl" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Smart Breaks</h3>
                  <span className="material-symbols-outlined cursor-pointer hover:text-[#e1fdff] transition-colors" style={{ color:'#b9cacb' }}>info</span>
                </div>
                <div className="space-y-4">
                  {smartBreaks.map(item => (
                    <div key={item.title} className="smart-break-card p-5 rounded-2xl cursor-pointer group border"
                      style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300"
                          style={{ background:item.bg, borderColor:item.borderColor }}>
                          <span className="material-symbols-outlined text-2xl" style={{ color:item.color, fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <span className="font-bold text-lg" style={{ fontFamily:'Space Grotesk', color:item.color }}>{item.title}</span>
                      </div>
                      <p className="text-sm" style={{ color:'#b9cacb' }}>{item.desc}</p>
                    </div>
                  ))}
                  {smartBreaks.length === 0 && (
                    <p className="text-center text-xs terminal-text opacity-40 py-4">NO_SUGGESTIONS_PENDING</p>
                  )}
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>



      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-[2.5rem] p-10 border shadow-2xl overflow-hidden"
              style={{ background:'rgba(14,14,15,0.95)', borderColor:'rgba(255,255,255,0.1)' }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background:'radial-gradient(circle at top right, #00f2ff, transparent)' }} />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="text-3xl font-bold" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Add Event</h3>
                  <p className="text-xs terminal-text mt-1" style={{ color:'#D2FF00' }}>[ DATE_SYNC: {format(selectedDate, 'yyyy-MM-dd')} ]</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined" style={{ color:'#b9cacb' }}>close</span>
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] terminal-text uppercase tracking-widest ml-2" style={{ color:'#b9cacb' }}>Event Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Advanced Neuro-Algorithms"
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00f2ff]/50 transition-all"
                    style={{ color:'#e5e2e3' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] terminal-text uppercase tracking-widest ml-2" style={{ color:'#b9cacb' }}>Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={newEvent.startDate}
                      onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00f2ff]/50 transition-all"
                      style={{ color:'#e5e2e3', colorScheme:'dark' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] terminal-text uppercase tracking-widest ml-2" style={{ color:'#b9cacb' }}>End Date</label>
                    <input 
                      required
                      type="date" 
                      value={newEvent.endDate}
                      onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00f2ff]/50 transition-all"
                      style={{ color:'#e5e2e3', colorScheme:'dark' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] terminal-text uppercase tracking-widest ml-2" style={{ color:'#b9cacb' }}>Start Time</label>
                    <input 
                      required
                      type="time" 
                      value={newEvent.startTime}
                      onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00f2ff]/50 transition-all"
                      style={{ color:'#e5e2e3', colorScheme:'dark' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] terminal-text uppercase tracking-widest ml-2" style={{ color:'#b9cacb' }}>End Time</label>
                    <input 
                      required
                      type="time" 
                      value={newEvent.endTime}
                      onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00f2ff]/50 transition-all"
                      style={{ color:'#e5e2e3', colorScheme:'dark' }}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] terminal-text uppercase tracking-widest" style={{ color:'#b9cacb' }}>Neural Load / Stress Weight</label>
                    <span className="font-bold text-lg" style={{ color: newEvent.stressWeight >= 4 ? '#ffb4ab' : '#00f2ff' }}>{newEvent.stressWeight}</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={newEvent.stressWeight}
                    onChange={e => setNewEvent({...newEvent, stressWeight: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]"
                  />
                  <div className="flex justify-between px-1 text-[8px] terminal-text opacity-40" style={{ color:'#b9cacb' }}>
                    <span>LOW_LOAD</span>
                    <span>CRITICAL_PEAK</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 rounded-2xl font-bold text-sm tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                  style={{ background:'linear-gradient(135deg, #00f2ff 0%, #006a71 100%)', color:'#001f22', boxShadow:'0 10px 30px rgba(0,242,255,0.2)' }}
                >
                  SYNC_TO_CALENDAR
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{ 
              position: 'fixed', bottom: 32, right: 32, zIndex: 1000, 
              background: 'rgba(14, 14, 15, 0.95)', backdropFilter: 'blur(20px)',
              border: toast.type === 'success' ? '1px solid rgba(0, 219, 231, 0.3)' : toast.type === 'error' ? '1px solid rgba(255, 180, 171, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: toast.type === 'success' ? '0 10px 30px rgba(0, 219, 231, 0.2)' : toast.type === 'error' ? '0 10px 30px rgba(255, 180, 171, 0.2)' : '0 10px 30px rgba(255, 255, 255, 0.05)',
              borderRadius: '1.25rem', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12
            }}
          >
            <span className="material-symbols-outlined animate-pulse" style={{ color: toast.type === 'success' ? '#00f2ff' : toast.type === 'error' ? '#ffb4ab' : '#ebb2ff' }}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'warning' : 'info'}
            </span>
            <span className="text-xs font-bold terminal-text" style={{ color: '#e5e2e3' }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
