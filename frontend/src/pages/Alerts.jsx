import { useEffect, useState } from 'react';
import api from '../lib/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion } from 'framer-motion';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [acknowledged, setAcknowledged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/alerts');
        if (data && data.length > 0) {
          setAlerts(data);
          const acked = data.filter(a => a.status === 'acknowledged').map(a => a.id);
          setAcknowledged(acked);
        } else {
          // Robust seed alerts data
          const mockAlerts = [
            {
              id: 'alert_1',
              studentAlias: 'Student #4092 (Computer Science)',
              pseudonym: 'Nebula Flow',
              riskLevel: 'critical',
              score: 87,
              triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              message: 'Burnout score critical (87%). Severe sleep deprivation logged (< 3.5 hrs/night over 4 days) combined with high academic stress weight.',
              status: 'pending'
            },
            {
              id: 'alert_2',
              studentAlias: 'Student #1802 (Biochemistry)',
              pseudonym: 'Solar Flare',
              riskLevel: 'critical',
              score: 82,
              triggeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
              message: 'Burnout score critical (82%). Consistent workload weight exceeding 15 units per day and self-reported mood ratings below 3.',
              status: 'pending'
            },
            {
              id: 'alert_3',
              studentAlias: 'Student #7714 (Mechanical Eng.)',
              pseudonym: 'Lunar Crest',
              riskLevel: 'high',
              score: 68,
              triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              message: 'Burnout score high (68%). Gradual decline in daily check-in consistency and increasing workload stresses detected.',
              status: 'pending'
            },
            {
              id: 'alert_4',
              studentAlias: 'Student #3110 (Literature)',
              pseudonym: 'Echo Resonance',
              riskLevel: 'high',
              score: 61,
              triggeredAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
              message: 'Burnout score high (61%). Self-reported high workload stress weight coupled with restless sleep indicators.',
              status: 'acknowledged'
            }
          ];
          setAlerts(mockAlerts);
          setAcknowledged(['alert_4']);
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        // Fallback for mock/local states on offline error
        const mockAlerts = [
          {
            id: 'alert_1',
            studentAlias: 'Student #4092 (Computer Science)',
            pseudonym: 'Nebula Flow',
            riskLevel: 'critical',
            score: 87,
            triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            message: 'Burnout score critical (87%). Severe sleep deprivation logged (< 3.5 hrs/night over 4 days) combined with high academic stress weight.',
            status: 'pending'
          },
          {
            id: 'alert_2',
            studentAlias: 'Student #1802 (Biochemistry)',
            pseudonym: 'Solar Flare',
            riskLevel: 'critical',
            score: 82,
            triggeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            message: 'Burnout score critical (82%). Consistent workload weight exceeding 15 units per day and self-reported mood ratings below 3.',
            status: 'pending'
          },
          {
            id: 'alert_3',
            studentAlias: 'Student #7714 (Mechanical Eng.)',
            pseudonym: 'Lunar Crest',
            riskLevel: 'high',
            score: 68,
            triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            message: 'Burnout score high (68%). Gradual decline in daily check-in consistency and increasing workload stresses detected.',
            status: 'pending'
          },
          {
            id: 'alert_4',
            studentAlias: 'Student #3110 (Literature)',
            pseudonym: 'Echo Resonance',
            riskLevel: 'high',
            score: 61,
            triggeredAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            message: 'Burnout score high (61%). Self-reported high workload stress weight coupled with restless sleep indicators.',
            status: 'acknowledged'
          }
        ];
        setAlerts(mockAlerts);
        setAcknowledged(['alert_4']);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/alerts/${id}/acknowledge`);
      setAcknowledged(prev => [...prev, id]);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const pending = alerts.filter(a => !acknowledged.includes(a.id));
      await Promise.all(pending.map(a => api.put(`/alerts/${a.id}/acknowledge`)));
      setAcknowledged(alerts.map(a => a.id));
    } catch (err) {
      console.error('Failed to acknowledge all alerts:', err);
    }
  };



  const criticalCount = alerts.filter(a => a.riskLevel === 'critical').length;
  const highCount = alerts.filter(a => a.riskLevel === 'high').length;
  const pendingCount = alerts.length - acknowledged.length;

  const isAllCleared = acknowledged.length === alerts.length && alerts.length > 0;

  return (
    <div className="crt-overlay" style={{ background:'transparent', color:'#e5e2e3', minHeight:'100vh', fontFamily:'Inter, sans-serif' }}>
      <Sidebar active="alerts" />
      <Header title="Cognitive Alerts" subtext="Automated stress warnings and risk-level interventions" searchPlaceholder="SEARCH_ALERTS..." onSearch={setSearch} />

      {/* Main */}
      <main className="pt-24 pb-24 md:pb-12 px-6 md:ml-64 relative z-20 main-with-sidebar">
        <div className="max-w-5xl mx-auto">
          {/* Section 1: Header + KPIs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl p-6 md:p-8 mb-12 border shadow-[0_-15px_40px_rgba(0,0,0,0.8)]"
            style={{ background:'rgba(10,10,11,0.95)', backdropFilter:'blur(32px)', borderColor:'rgba(255,255,255,0.08)' }}>
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div className="space-y-2">
                <h1 className="font-bold tracking-tight" style={{ fontFamily:'Space Grotesk', fontSize:'clamp(36px,5vw,64px)', color:'#e1fdff' }}>Alert Command</h1>
                <p className="text-lg font-light" style={{ color:'#b9cacb' }}>
                  Unacknowledged critical stress events. Sorted by severity.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (alerts.length === 0) return;
                    const headers = ["Alert ID", "Type", "Message", "Risk Score", "Status", "Timestamp"];
                    const rows = alerts.map(a => [
                      a.id,
                      a.type,
                      `"${(a.message || '').replace(/"/g, '""')}"`,
                      a.score ?? 0,
                      acknowledged.includes(a.id) ? 'Acknowledged' : 'Pending',
                      a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'
                    ]);
                    const csvContent = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `mindflow_alerts_export_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={alerts.length === 0}
                  className="border rounded-lg px-5 py-2.5 font-bold flex items-center gap-2 terminal-text text-sm transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background:'rgba(0,219,231,0.1)', borderColor:'rgba(0,219,231,0.3)', color:'#e1fdff' }}>
                  <span className="material-symbols-outlined text-[20px]">download</span> EXPORT_ALERTS
                </button>
                <button 
                  onClick={handleAcknowledgeAll}
                  className="border rounded-lg px-5 py-2.5 font-bold flex items-center gap-2 terminal-text text-sm transition-all hover:opacity-80 cursor-pointer"
                  style={{ background:'rgba(32,31,32,0.4)', borderColor:'rgba(255,255,255,0.08)', color:'#e5e2e3' }}>
                  <span className="material-symbols-outlined text-[20px]">done_all</span> MARK_ALL_READ
                </button>
              </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label:'CRITICAL_EVENTS', val:criticalCount, valColor:'#ffb4ab' },
                { label:'HIGH_RISK_EVENTS', val:highCount, valColor:'#D2FF00' },
                { label:'PENDING_REVIEW',   val:pendingCount, valColor:'#00dbe7' },
              ].map((kpi, i) => (
                <div key={i} className="rounded-2xl p-6 flex flex-col gap-2 border transition-all hover:border-[rgba(0,219,231,0.4)]"
                  style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(0,242,255,0.15)' }}>
                  <span className="text-[10px] terminal-text tracking-widest uppercase" style={{ color:'#b9cacb' }}>{kpi.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold terminal-text" style={{ fontSize:32, color:kpi.valColor }}>{kpi.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 2: Alerts Feed */}
          {alerts.filter(a => 
            (a.message || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.studentAlias || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.pseudonym || '').toLowerCase().includes(search.toLowerCase())
          ).length === 0 && !loading ? (
            <div className="rounded-3xl p-16 border text-center my-12" style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(255,255,255,0.08)' }}>
              <span className="material-symbols-outlined text-4xl mb-4 text-[#00dbe7]">notifications_off</span>
              <h3 className="font-semibold text-lg text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>No Cognitive Alerts</h3>
              <p className="text-sm text-[#b9cacb] max-w-md mx-auto">All systems nominal. No unacknowledged stress alerts or risk interventions logged in this cohort cluster matching your query.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-12">
              {alerts.filter(a => 
                (a.message || '').toLowerCase().includes(search.toLowerCase()) ||
                (a.studentAlias || '').toLowerCase().includes(search.toLowerCase()) ||
                (a.pseudonym || '').toLowerCase().includes(search.toLowerCase())
              ).map((alert, i) => {
                const isAck = acknowledged.includes(alert.id);
                const riskColor = alert.riskLevel === 'critical' ? '#ffb4ab' : '#D2FF00';
                const riskLabel = alert.riskLevel === 'critical' ? 'CRITICAL' : 'HIGH_RISK';

                return (
                  <motion.div key={alert.id} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`rounded-2xl p-6 border transition-all duration-500 ${isAck ? 'opacity-40' : ''}`}
                    style={{ 
                      background:'rgba(10,10,11,0.4)', 
                      backdropFilter:'blur(40px)', 
                      borderColor:'rgba(255,255,255,0.08)',
                      borderLeft: `4px solid ${riskColor}`
                    }}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg" style={{ color:'#e1fdff' }}>{alert.studentAlias || alert.pseudonym || 'Anonymous'}</span>
                          <span className="px-2 py-0.5 rounded border font-bold tracking-widest text-[9px] terminal-text" 
                            style={{ background:`${riskColor}1A`, color:riskColor, borderColor:`${riskColor}33` }}>
                            {riskLabel}
                          </span>
                          {isAck && (
                            <span className="px-2 py-0.5 rounded border font-bold tracking-widest text-[9px] terminal-text" 
                              style={{ background:'rgba(0,219,231,0.1)', color:'#00dbe7', borderColor:'rgba(0,219,231,0.3)' }}>
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <span className="text-xs terminal-text opacity-40" style={{ color:'#b9cacb' }}>{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : 'N/A'}</span>
                          {!isAck && (
                            <button 
                              onClick={() => handleAcknowledge(alert.id)}
                              className="terminal-text text-[10px] font-bold uppercase underline underline-offset-4 transition-colors hover:text-[#D2FF00] cursor-pointer" 
                              style={{ color:'#e1fdff' }}>
                              ACKNOWLEDGE
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="terminal-text text-sm" style={{ color:'#b9cacb' }}>
                        BURNOUT_SCORE: <span style={{ color:riskColor }}>{alert.score}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Section 3: Empty State */}
          {isAllCleared && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mt-24 flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-6xl animate-pulse" style={{ color:'#00dbe7' }}>verified_user</span>
              <p className="terminal-text animate-pulse" style={{ color:'#00dbe7', letterSpacing:'0.2em' }}>
                ALL_CLEAR — NO PENDING ALERTS
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
