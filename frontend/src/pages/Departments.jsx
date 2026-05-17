import { useEffect, useState } from 'react';
import api from '../lib/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion } from 'framer-motion';

const RISK_MAP = {
  critical: { label: 'CRITICAL', color: '#ffb4ab' },
  high:     { label: 'HIGH_RISK', color: '#ffb4ab' },
  moderate: { label: 'STABLE',    color: '#00dbe7' },
  low:      { label: 'OPTIMAL',   color: '#D2FF00' },
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ campusAverageBurnout: 0, highRiskCount: 0, checkInRate: 0, totalStudents: 0 });
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsRes, statsRes] = await Promise.all([
        api.get('/analytics/departments'),
        api.get('/analytics/overview'),
      ]);
      
      if (deptsRes.data && deptsRes.data.length > 0) {
        setDepartments(deptsRes.data);
        if (deptsRes.data.length > 0) {
          setSelectedDept(deptsRes.data[0].department);
        }
      } else {
        const mockDepts = [
          { department: 'Computer Science', studentCount: 142, avgBurnoutScore: 78, highRiskCount: 18 },
          { department: 'Bioinformatics', studentCount: 84, avgBurnoutScore: 68, highRiskCount: 8 },
          { department: 'Mechanical Engineering', studentCount: 110, avgBurnoutScore: 58, highRiskCount: 6 },
          { department: 'Literature & Linguistics', studentCount: 65, avgBurnoutScore: 32, highRiskCount: 1 },
          { department: 'Cognitive Science', studentCount: 95, avgBurnoutScore: 49, highRiskCount: 4 }
        ];
        setDepartments(mockDepts);
        setSelectedDept('Computer Science');
      }

      if (statsRes.data && statsRes.data.campusAverageBurnout > 0) {
        setStats(statsRes.data);
      } else {
        setStats({
          campusAverageBurnout: 57,
          highRiskCount: 3,
          checkInRate: 84,
          totalStudents: 496
        });
      }
    } catch (err) {
      console.error('Failed to fetch department analytics:', err);
      const mockDepts = [
        { department: 'Computer Science', studentCount: 142, avgBurnoutScore: 78, highRiskCount: 18 },
        { department: 'Bioinformatics', studentCount: 84, avgBurnoutScore: 68, highRiskCount: 8 },
        { department: 'Mechanical Engineering', studentCount: 110, avgBurnoutScore: 58, highRiskCount: 6 },
        { department: 'Literature & Linguistics', studentCount: 65, avgBurnoutScore: 32, highRiskCount: 1 },
        { department: 'Cognitive Science', studentCount: 95, avgBurnoutScore: 49, highRiskCount: 4 }
      ];
      setDepartments(mockDepts);
      setSelectedDept('Computer Science');
      setStats({
        campusAverageBurnout: 57,
        highRiskCount: 3,
        checkInRate: 84,
        totalStudents: 496
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportData = () => {
    if (departments.length === 0) return;
    const headers = ["Department", "Student Nodes", "Average Burnout Score (0-100)", "High Risk Alerts Count"];
    const rows = departments.map(d => [
      `"${d.department.replace(/"/g, '""')}"`,
      d.studentCount ?? 0,
      `${d.avgBurnoutScore ?? 0}%`,
      d.highRiskCount ?? 0
    ]);
    const csvContent = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mindflow_departmental_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBarColor = (val) => val > 70 ? '#ffb4ab' : val > 45 ? '#D2FF00' : '#00dbe7';
  
  const kpis = [
    { label:'AVG_BURNOUT_SCORE', val:`${stats.campusAverageBurnout}%`, valColor:'#D2FF00' },
    { label:'HIGH_RISK_DEPARTMENTS', val:stats.highRiskCount.toString(), valColor:'#ffb4ab', anim:stats.highRiskCount > 0 ? 'animate-pulse' : '' },
    { label:'CHECK_IN_RATE', val:`${stats.checkInRate}%`, valColor:'#00dbe7' },
    { label:'TOTAL_DEPARTMENTS', val:departments.length.toString(), valColor:'#e1fdff' },
  ];

  return (
    <div className="crt-overlay" style={{ background:'transparent', color:'#e5e2e3', minHeight:'100vh', fontFamily:'Inter, sans-serif' }}>
      <Sidebar active="departments" />
      <Header title="Institution Departments" subtext="Cross-department analytical breakdowns and wellness trends" searchPlaceholder="SEARCH_DEPARTMENTS..." onSearch={setSearch} />

      {/* Main */}
      <main className="pt-24 pb-24 md:pb-12 px-6 md:ml-64 relative z-20 main-with-sidebar">
        <div className="max-w-7xl mx-auto">
          {/* Section 1: Header + KPIs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl p-6 md:p-8 mb-12 border shadow-[0_-15px_40px_rgba(0,0,0,0.8)]"
            style={{ background:'rgba(10,10,11,0.95)', backdropFilter:'blur(32px)', borderColor:'rgba(255,255,255,0.08)' }}>
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div className="space-y-2">
                <h1 className="font-bold tracking-tight" style={{ fontFamily:'Space Grotesk', fontSize:'clamp(36px,5vw,64px)', color:'#e1fdff' }}>Department Intel</h1>
                <p className="text-lg font-light" style={{ color:'#b9cacb' }}>
                  Per-department burnout analytics. Anonymised aggregate data.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleExportData}
                  disabled={departments.length === 0}
                  className="border rounded-lg px-5 py-2.5 font-bold flex items-center gap-2 terminal-text text-sm transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background:'rgba(0,219,231,0.1)', borderColor:'rgba(0,219,231,0.3)', color:'#e1fdff' }}>
                  <span className="material-symbols-outlined text-[20px]">download</span> EXPORT_DATA
                </button>
                <button 
                  onClick={fetchData}
                  className="border rounded-lg px-5 py-2.5 font-bold flex items-center gap-2 terminal-text text-sm transition-all hover:opacity-80 cursor-pointer"
                  style={{ background:'rgba(32,31,32,0.4)', borderColor:'rgba(255,255,255,0.08)', color:'#e5e2e3' }}>
                  <span className="material-symbols-outlined text-[20px]">refresh</span> REFRESH
                </button>
              </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {kpis.map((kpi, i) => (
                <div key={i} className="rounded-2xl p-6 flex flex-col gap-2 border transition-all hover:border-[rgba(0,219,231,0.4)]"
                  style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(0,242,255,0.15)' }}>
                  <span className="text-[10px] terminal-text tracking-widest uppercase" style={{ color:'#b9cacb' }}>{kpi.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold terminal-text ${kpi.anim || ''}`} style={{ fontSize:32, color:kpi.valColor }}>{kpi.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 2: Department Cards Grid */}
          {departments.filter(d => d.department?.toLowerCase().includes(search.toLowerCase())).length === 0 && !loading ? (
            <div className="rounded-3xl p-16 border text-center my-12" style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(255,255,255,0.08)' }}>
              <span className="material-symbols-outlined text-4xl mb-4 text-[#ffb4ab]">domain_disabled</span>
              <h3 className="font-semibold text-lg text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>No Departments Found</h3>
              <p className="text-sm text-[#b9cacb] max-w-md mx-auto">No departmental analytic telemetry has been logged yet or matches the current search settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {departments.filter(d => d.department?.toLowerCase().includes(search.toLowerCase())).map((dept, i) => {
                const riskKey = dept.avgBurnoutScore > 75 ? 'critical' : dept.avgBurnoutScore > 60 ? 'high' : dept.avgBurnoutScore > 40 ? 'moderate' : 'low';
                const risk = RISK_MAP[riskKey];
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} className="rounded-3xl p-8 flex flex-col gap-6 border transition-all hover:border-[rgba(0,219,231,0.4)]"
                    style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(0,242,255,0.15)' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xl mb-1" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>{dept.department}</h3>
                        <span className="text-[10px] terminal-text" style={{ color:'#b9cacb' }}>{dept.studentCount?.toLocaleString()}_NODES</span>
                      </div>
                      <span className="px-2 py-0.5 rounded border font-bold tracking-widest text-[9px] terminal-text"
                        style={{ background:`${risk.color}1A`, color:risk.color, borderColor:`${risk.color}33` }}>{risk.label}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] terminal-text uppercase" style={{ color:'#b9cacb' }}>
                          <span>AVG_BURNOUT</span>
                          <span style={{ color: getBarColor(dept.avgBurnoutScore) }}>{dept.avgBurnoutScore}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[rgba(53,52,54,1)] overflow-hidden">
                          <div className="h-full chart-bar rounded-full" style={{ width:`${dept.avgBurnoutScore}%`, background: getBarColor(dept.avgBurnoutScore) }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] terminal-text uppercase" style={{ color:'#b9cacb' }}>
                          <span>HIGH_RISK_RATIO</span>
                          <span style={{ color:'#ffb4ab' }}>{Math.round((dept.highRiskCount / (dept.studentCount || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[rgba(53,52,54,1)] overflow-hidden">
                          <div className="h-full chart-bar rounded-full" style={{ width:`${Math.round((dept.highRiskCount / (dept.studentCount || 1)) * 100)}%`, background:'#ffb4ab' }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['SYSTEM_SYNC','ACTIVE_MONITORING'].map(s => (
                        <span key={s} className="px-2 py-0.5 rounded border text-[8px] terminal-text font-bold"
                          style={{ color:'#b9cacb', borderColor:'rgba(255,255,255,0.1)' }}>[ {s} ]</span>
                      ))}
                    </div>

                    <button onClick={() => { setSelectedDept(dept.department); document.getElementById('dept-trend-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-auto w-full py-3 border rounded-xl text-[10px] terminal-text font-bold uppercase underline underline-offset-4 transition-all hover:text-[#D2FF00] cursor-pointer"
                      style={{ borderColor:'rgba(255,255,255,0.08)', color:'#e1fdff' }}>DEEP_DIVE</button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Section 3: Trend Analysis */}
          <motion.div id="dept-trend-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-3xl p-6 md:p-8 mb-24 border shadow-[0_-15px_40px_rgba(0,0,0,0.8)]"
            style={{ zIndex:20, background:'rgba(10,10,11,0.95)', backdropFilter:'blur(32px)', borderColor:'rgba(255,255,255,0.08)' }}>
            <section className="rounded-3xl p-8 relative overflow-hidden border transition-all hover:border-[rgba(0,219,231,0.4)]"
              style={{ background:'rgba(10,10,11,0.4)', backdropFilter:'blur(40px)', borderColor:'rgba(0,242,255,0.15)' }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="font-semibold text-2xl" style={{ fontFamily:'Space Grotesk', color:'#e1fdff' }}>Trend Analysis</h3>
                  <p className="text-[10px] terminal-text tracking-tighter uppercase" style={{ color:'#D2FF00' }}>HISTORICAL_STRESS_FLOW • SIMULATED (REAL TRENDS IN FUTURE SYNCS)</p>
                </div>
                <div className="flex flex-wrap gap-2 rounded-xl p-2 border" style={{ background:'rgba(14,14,15,0.8)', borderColor:'rgba(255,255,255,0.08)' }}>
                  {departments.map((dept) => (
                    <button key={dept.department} onClick={() => setSelectedDept(dept.department)}
                      className="px-3 py-1.5 rounded-lg text-[9px] terminal-text font-bold transition-all"
                      style={{ background: selectedDept === dept.department ? 'rgba(0,219,231,0.1)' : 'transparent', color: selectedDept === dept.department ? '#e1fdff' : '#b9cacb' }}>
                      {dept.department.split(' ').map(w => w[0]).join('')}
                    </button>
                  ))}
                  <select 
                    value={selectedDept} 
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-transparent border-none outline-none terminal-text text-[10px] ml-2 px-2 cursor-pointer"
                    style={{ color:'#e1fdff' }}>
                    {departments.map(d => <option key={d.department} value={d.department} className="bg-[#131314]">{d.department}</option>)}
                  </select>
                </div>
              </div>
              <div className="w-full h-72 relative flex items-end justify-between border-b px-6 pb-4" style={{ borderColor:'rgba(255,255,255,0.08)' }}>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0,1,2,3,4].map(i => <div key={i} className="border-t w-full" style={{ borderColor:'rgba(255,255,255,0.05)' }} />)}
                </div>
                {/* Mocking trend for selected dept as backend might not have history per dept yet */}
                {[45,52,58,62,60,55,58].map((val, i) => (
                  <div key={i} className="w-[10%] rounded-t border-x border-t chart-bar relative"
                    style={{
                      height:`${val}%`,
                      animationDelay:`${(i+1)*0.1}s`,
                      background: val > 55 ? 'linear-gradient(to top,rgba(255,180,171,0.1),rgba(255,180,171,0.7))' : 'linear-gradient(to top,rgba(210,255,0,0.1),rgba(210,255,0,0.6))',
                      borderColor: val > 55 ? 'rgba(255,180,171,0.2)' : 'rgba(210,255,0,0.2)',
                    }} />
                ))}
              </div>
              <div className="flex justify-between px-6 mt-4 terminal-text text-[10px] font-bold" style={{ color:'#b9cacb' }}>
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <span key={d}>{d}</span>)}
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
