import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HelpCircle, PhoneCall, AlertTriangle, ShieldAlert, CheckCircle, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';

export default function Support() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [ticket, setTicket] = useState({ subject: '', category: 'General Help', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, []);

  const faqs = [
    {
      q: "What is MindFlow's role in my academic schedule?",
      a: "MindFlow uses cognitive load monitoring and predictive models to scan your class, exam, and assignment timeline. It identifies peak-stress zones and automatically suggests optimal times for deep recovery and breaks."
    },
    {
      q: "Is my identity anonymous in the Neural Network community?",
      a: "Yes! All posts and interactions inside the Neural Network are fully anonymized. Your peers only see your posts with automated group metadata and system-generated pseudonyms."
    },
    {
      q: "How can I request an urgent session with a campus counselor?",
      a: "You can submit a ticket using the form on this page with the category marked as 'Counselor Callback'. Your counselor's dashboard will flag it immediately. Alternatively, you can use the direct hotlines in the Emergency Crisis panel."
    },
    {
      q: "Can I update my academic details and semester?",
      a: "Yes, you can edit your active academic semester at any time! Click your profile icon in the top right, navigate to Account Settings, and select Edit Profile to update your details."
    }
  ];

  const categories = ['General Help', 'Counselor Callback', 'Platform Bug', 'Academic Stress'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTicket({ subject: '', category: 'General Help', message: '' });
    }, 1200);
  };

  return (
    <div className="crt-overlay" style={{ background: 'transparent', color: '#e5e2e3', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active="support" />
      <Header title="Support Command" subtext="Connect with counselor assistance and institution-wide help resources" />

      {/* Main Container */}
      <main className="pt-28 pb-12 px-6 md:ml-64 relative z-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: FAQ & Contact Form */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* FAQ Accordion Accord */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard style={{ padding: '32px' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="text-[#00f2ff]" size={24} />
                    <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Frequently Asked Questions</h2>
                  </div>

                  <div className="space-y-4">
                    {faqs.map((faq, idx) => {
                      const isExpanded = activeFaq === idx;
                      return (
                        <div 
                          key={idx}
                          className="border rounded-2xl overflow-hidden transition-all duration-300"
                          style={{ 
                            background: isExpanded ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                            borderColor: isExpanded ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <button
                            onClick={() => setActiveFaq(isExpanded ? null : idx)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                          >
                            <span className="font-semibold text-sm pr-4" style={{ color: isExpanded ? '#00f2ff' : '#e5e2e3' }}>
                              {faq.q}
                            </span>
                            <span className={`material-symbols-outlined transition-transform duration-300 text-sm ${isExpanded ? 'rotate-180 text-[#00f2ff]' : 'text-[#b9cacb]'}`}>
                              expand_more
                            </span>
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                              >
                                <div className="px-6 pb-6 text-xs leading-relaxed" style={{ color: '#b9cacb' }}>
                                  {faq.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Counselor Help Ticket Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <GlassCard style={{ padding: '32px' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-[#D2FF00]" size={24} />
                      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Direct Help Portal</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded border border-[#00f2ff]/30 text-[9px] font-bold tracking-widest uppercase terminal-text text-[#00f2ff]" style={{ background: 'rgba(0,242,255,0.05)' }}>
                      Response Protocol: Active
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-10 space-y-4"
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#D2FF00]/30" style={{ background: 'rgba(210,255,0,0.1)' }}>
                          <CheckCircle className="text-[#D2FF00]" size={36} />
                        </div>
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Ticket Synced Successfully</h3>
                        <p className="text-xs max-w-md mx-auto" style={{ color: '#b9cacb' }}>
                          Your concern has been transmitted directly to our student support system. A campus counselor or technical administrator will contact you shortly.
                        </p>
                        <button
                          onClick={() => setSubmitted(false)}
                          className="px-6 py-2 rounded-full border border-white/10 text-xs font-bold hover:bg-white/5 transition-all terminal-text"
                        >
                          SUBMIT_NEW_TICKET
                        </button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Ticket Category</label>
                            <select
                              value={ticket.category}
                              onChange={(e) => setTicket({ ...ticket, category: e.target.value })}
                              className="w-full bg-[#0e0e0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#D2FF00]/50 outline-none transition-all"
                              style={{ color: '#e5e2e3' }}
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-[#131314]">{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Subject</label>
                            <input
                              required
                              type="text"
                              placeholder="e.g. Schedule Sync Glitch"
                              value={ticket.subject}
                              onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#D2FF00]/50 outline-none transition-all"
                              style={{ color: '#e5e2e3' }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Detailed Description</label>
                          <textarea
                            required
                            rows={5}
                            placeholder="Please explain the issue or concern you are experiencing..."
                            value={ticket.message}
                            onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-[#D2FF00]/50 outline-none transition-all resize-none"
                            style={{ color: '#e5e2e3' }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110"
                          style={{ 
                            background: 'linear-gradient(135deg, #00f2ff 0%, #006a71 100%)', 
                            color: '#001f22',
                            boxShadow: '0 8px 25px rgba(0,242,255,0.15)'
                          }}
                        >
                          {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 14, height: 14, border: '2px solid rgba(0,31,34,0.3)', borderTopColor: '#001f22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              TRANSMITTING...
                            </span>
                          ) : (
                            <>
                              <Send size={14} />
                              SYNC_SUPPORT_TICKET
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            </div>

            {/* Right: Urgent Hotlines & Quick Stats */}
            <aside className="lg:col-span-4 space-y-8">
              
              {/* Emergency Hotline Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl p-8 border-t-2 shadow-2xl relative overflow-hidden"
                style={{ 
                  background: 'rgba(255,138,174,0.03)', 
                  backdropFilter: 'blur(24px)', 
                  border: '1px solid rgba(255,138,174,0.1)', 
                  borderTop: '2px solid #ff8aae' 
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle at top right, #ff8aae, transparent)' }} />
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <ShieldAlert className="text-[#ff8aae]" size={24} />
                  <h3 className="font-semibold text-xl" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Emergency Crisis</h3>
                </div>

                <p className="text-xs mb-6 leading-relaxed relative z-10 text-[#b9cacb]">
                  If you are experiencing a severe mental health crisis, feeling unsafe, or needing immediate urgent support, please reach out directly:
                </p>

                <div className="space-y-4 relative z-10">
                  {[
                    { title: 'National Crisis Lifeline', tel: '988', desc: 'Free, confidential support 24/7' },
                    { title: 'Crisis Text Line', text: 'HOME to 741741', desc: 'Text for immediate counselor link' },
                    { title: 'Campus Security', tel: 'Emergency Ext: 911', desc: 'On-site local student safety' }
                  ].map((hotline, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl border transition-all duration-300 hover:border-[#ff8aae]/40"
                      style={{ background: 'rgba(255,138,174,0.05)', borderColor: 'rgba(255,138,174,0.1)' }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs" style={{ color: '#e1fdff' }}>{hotline.title}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#ff8aae]">
                          <PhoneCall size={10} />
                          <span>{hotline.tel || 'TEXT'}</span>
                        </div>
                      </div>
                      <p className="text-[10px]" style={{ color: '#b9cacb' }}>{hotline.desc}</p>
                      {hotline.tel && (
                        <a 
                          href={`tel:${hotline.tel.split(':').pop().trim()}`}
                          className="mt-2 block w-full py-1 text-center rounded bg-[#ff8aae]/10 text-[9px] font-bold uppercase tracking-wider text-[#ff8aae] hover:bg-[#ff8aae]/20 transition-all border border-[#ff8aae]/10"
                        >
                          DIAL_IMMEDIATELY
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Status Command Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-3xl p-8 border shadow-2xl relative"
                style={{ 
                  background: 'rgba(14,14,15,0.65)', 
                  backdropFilter: 'blur(24px)', 
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Support Diagnostics</h4>
                  <span className="text-[8px] tracking-widest text-[#D2FF00]/60 terminal-text font-bold uppercase border border-[#D2FF00]/20 px-1.5 py-0.5 rounded bg-[#D2FF00]/5">DEMO</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Sync Status', val: 'CLINICAL DEMO', color: '#D2FF00' },
                    { label: 'Avg Latency (Simulated)', val: '14.2ms', color: '#00f2ff' },
                    { label: 'Active Agents (Simulated)', val: '3 Nodes', color: '#e1fdff' }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs terminal-text pb-2 border-b border-white/5">
                      <span style={{ color: '#b9cacb' }}>{stat.label}</span>
                      <span className="font-bold" style={{ color: stat.color }}>{stat.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
