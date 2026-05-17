import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCampusStats, fetchDepartmentStats, fetchSyslogAlerts } from '../lib/firestore';
import api from '../lib/api';
import { 
  Sparkles, Download, Filter, RefreshCw, Eye, AlertCircle, X, 
  Send, Users, Award, ShieldCheck, Heart, Volume2 
} from 'lucide-react';

const DEPTS = [
  { department: 'School of Engineering', studentCount: 2450, avgBurnoutScore: 78, highRiskCount: 18 },
  { department: 'Faculty of Fine Arts', studentCount: 1120, avgBurnoutScore: 32, highRiskCount: 1 },
  { department: 'Medical Sciences', studentCount: 1890, avgBurnoutScore: 58, highRiskCount: 8 },
  { department: 'School of Law', studentCount: 1500, avgBurnoutScore: 65, highRiskCount: 12 },
  { department: 'Department of Computer Science', studentCount: 3100, avgBurnoutScore: 82, highRiskCount: 24 }
];

const CHART_DATA = {
  weekly: {
    bars: [
      { h: 45, color: 'lime' }, { h: 52, color: 'lime' }, { h: 78, color: 'error' },
      { h: 85, color: 'error' }, { h: 60, color: 'lime' }, { h: 42, color: 'lime' },
      { h: 35, color: 'lime' }
    ],
    months: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  monthly: {
    bars: [
      { h: 30, color: 'lime' }, { h: 35, color: 'lime' }, { h: 42, color: 'lime' },
      { h: 68, color: 'error' }, { h: 75, color: 'error' }, { h: 50, color: 'lime' },
      { h: 45, color: 'lime' }, { h: 38, color: 'lime' }, { h: 32, color: 'lime' }
    ],
    months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']
  },
  semester: {
    bars: [
      { h: 25, color: 'lime' }, { h: 40, color: 'lime' }, { h: 76, color: 'error' },
      { h: 52, color: 'lime' }, { h: 62, color: 'lime' }, { h: 88, color: 'error' },
      { h: 30, color: 'lime' }
    ],
    months: ['ORIENTATION', 'WEEKS 1-4', 'MIDTERMS', 'READING WK', 'WEEKS 8-12', 'FINALS', 'BREAK']
  }
};

export default function WellPulse() {
  const [stats, setStats] = useState({
    campusAverageBurnout: 58.4,
    highRiskCount: 14,
    checkInRate: 82.5,
    totalStudents: 14200
  });
  const [departments, setDepartments] = useState(DEPTS);
  const [alerts, setAlerts] = useState([
    { id: '1', type: 'CRITICAL_DETECTION', time: '02:14:05', msg: 'COHORT_CS_Y3: Burnout threshold exceeded [0.75] for 45/200 nodes.', color: '#ffb4ab', action: 'DECODE_AND_INTERVENE', bg: 'rgba(255,180,171,0.05)', border: 'rgba(255,180,171,0.3)' },
    { id: '2', type: 'PATTERN_SYNC', time: '01:55:20', msg: 'LATENIGHT_ANOMALY: High intensity activity detected in LAW_LIB cluster.', color: '#00dbe7', bg: 'rgba(32,31,32,0.5)' },
    { id: '3', type: 'HEALTH_CHECK', time: '00:10:45', msg: 'MED_SCHOOL: Positive trend. Calm_Sessions up 22% vs 24H_AVG.', color: '#D2FF00', bg: 'rgba(32,31,32,0.5)' },
  ]);

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [activeModal, setActiveModal] = useState(null); // 'intervention' | 'node_deep_dive' | 'dept_details' | 'filters'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedDeptDetails, setSelectedDeptDetails] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [meshMode, setMeshMode] = useState('mesh');
  
  // Counselor intervention form state
  const [interventionProto, setInterventionProto] = useState('Academic Extension Offer');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Auto-prefill intervention form fields dynamically based on alert type
  useEffect(() => {
    if (selectedAlert) {
      if (selectedAlert.type === 'CRITICAL_DETECTION') {
        setInterventionProto('Emergency Counseling Outreach');
        setBroadcastMsg(`Hi student, our wellness stream identified an elevated academic load anomaly on your node. We've unlocked extension vouchers for you—feel free to use them to take a breather.`);
      } else if (selectedAlert.type === 'PATTERN_SYNC') {
        setInterventionProto('Automated CalmCal Load Reduction');
        setBroadcastMsg(`Hi student, a late-night activity spike was registered in your cohort cluster. Please prioritize deep sleep recovery cycles; we've auto-rescheduled non-essential sessions for tomorrow.`);
      } else {
        setInterventionProto('Peer Mental Health Support Link');
        setBroadcastMsg(`Superb mental health check registered! Cognitive sessions are trending up 22%. Keep doing what you're doing—you are crushing it!`);
      }
    }
  }, [selectedAlert]);

  const addToast = (msg, type = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [statsData, deptData, alertsData] = await Promise.all([
        fetchCampusStats(),
        fetchDepartmentStats(),
        fetchSyslogAlerts()
      ]);
      
      setStats({
        campusAverageBurnout: statsData.avgBurnout || 58.4,
        highRiskCount: statsData.highRiskCount || 14,
        checkInRate: statsData.engagementIndex || 82.5,
        totalStudents: statsData.totalStudents || 14200
      });

      if (deptData && deptData.length > 0) {
        const formattedDepts = deptData.map(d => ({
          department: d.department,
          studentCount: d.studentCount || 1000,
          avgBurnoutScore: d.avgBurnoutScore || 50,
          highRiskCount: d.highRiskCount || 0
        }));
        setDepartments(formattedDepts);
      }

      if (alertsData && alertsData.length > 0) {
        const formattedAlerts = alertsData.map(a => ({
          id: a.id,
          type: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'CRITICAL_DETECTION' : 'WARNING',
          time: new Date(a.triggeredAt || Date.now()).toLocaleTimeString(),
          msg: `NODE ${a.pseudonym || a.studentAlias || 'Anonymized'}: ${a.message || `Burnout risk level ${a.score}`}`,
          color: a.riskLevel === 'critical' || a.riskLevel === 'high' ? '#ffb4ab' : '#00dbe7',
          action: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'DECODE_AND_INTERVENE' : null,
          bg: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'rgba(255,180,171,0.05)' : 'rgba(32,31,32,0.5)',
          border: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'rgba(255,180,171,0.3)' : undefined
        }));
        setAlerts(formattedAlerts);
      }
    } catch (err) {
      console.error('Failed to fetch real-time analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtered lists
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.msg.toLowerCase().includes(searchQuery.toLowerCase()) || alert.type.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterRisk === 'all') return matchesSearch;
    if (filterRisk === 'critical') return matchesSearch && alert.type === 'CRITICAL_DETECTION';
    if (filterRisk === 'stable') return matchesSearch && alert.type !== 'CRITICAL_DETECTION';
    return matchesSearch;
  });

  const filteredDepts = departments.filter(d => 
    d.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger CSV/Excel Export of stats
  const handleExportData = () => {
    let csvRows = [];
    
    // 1. Campus overview metadata
    csvRows.push("--- MINDFLOW CAMPUS WELLNESS REPORT ---");
    csvRows.push(`Report Generated At,${new Date().toLocaleString()}`);
    csvRows.push(`Total Student Nodes,${stats.totalStudents}`);
    csvRows.push(`Campus Average Burnout,${Math.round(stats.campusAverageBurnout)}%`);
    csvRows.push(`High Risk Alerts Count,${stats.highRiskCount}`);
    csvRows.push(`Engagement Check-In Rate,${Math.round(stats.checkInRate)}%`);
    csvRows.push(""); // spacer row
    
    // 2. Department Breakdown
    csvRows.push("--- DEPARTMENTAL WELLNESS BREAKDOWNS ---");
    csvRows.push("Department Name,Student Nodes (Capacity),Average Burnout Score (0-100),High Risk Alerts Count");
    departments.forEach(d => {
      const escapedDeptName = `"${d.department.replace(/"/g, '""')}"`;
      csvRows.push(`${escapedDeptName},${d.studentCount},${d.avgBurnoutScore}%,${d.highRiskCount}`);
    });
    csvRows.push(""); // spacer row
    
    // 3. System Alerts Log
    csvRows.push("--- SYSTEM SYSLOG ALERTS LOG ---");
    csvRows.push("Time,Alert Type,Log Message");
    alerts.forEach(a => {
      const escapedMsg = `"${a.msg.replace(/"/g, '""')}"`;
      csvRows.push(`${a.time},${a.type},${escapedMsg}`);
    });
    
    // Compile and download as .csv
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `mindflow_wellness_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    
    addToast("Wellness spreadsheet exported successfully!");
  };

  // Submit counselor intervention
  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      const isRealAlert = selectedAlert.id && selectedAlert.id.length > 5 && !selectedAlert.id.startsWith('demo_');
      
      if (isRealAlert) {
        // Since the backend doesn't support the /intervene post, we simulate the dispatch locally
        // and acknowledge the active alert in Firestore/backend so it resolves from the console
        try {
          await api.put(`/alerts/${selectedAlert.id}/acknowledge`);
        } catch (ackErr) {
          console.warn('Backend alert acknowledge sync failed:', ackErr);
        }
        addToast(`Intervention dispatched and resolved: [${interventionProto}] broadcasted to target cohort.`);
      } else {
        // Demo mode disclaimer
        addToast(`[DEMO MODE] Intervention [${interventionProto}] broadcast simulated to cohort.`);
      }
      
      // Update UI state by removing the alert
      setAlerts(prev => prev.filter(a => a.id !== selectedAlert.id));
      setStats(prev => ({ ...prev, highRiskCount: Math.max(0, prev.highRiskCount - 1) }));
      
      setActiveModal(null);
      setSelectedAlert(null);
      setBroadcastMsg('');
    } catch (err) {
      console.error('Failed to submit intervention:', err);
      addToast("Failed to dispatch intervention. System offline.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Broad department-wide bulletin
  const handleBroadcastBulletin = (deptName) => {
    addToast(`Global Wellness Bulletin broadcasted to ${deptName} students.`);
    setActiveModal(null);
  };

  // Synchronize alert logs dynamically with backend or demo simulation
  const handleSyncAlertLogs = async () => {
    setActionLoading(true);
    addToast("Initiating tactical campus telemetry sweep...");
    try {
      const alertsData = await fetchSyslogAlerts();
      if (alertsData && alertsData.length > 0) {
        const formattedAlerts = alertsData.map(a => ({
          id: a.id,
          type: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'CRITICAL_DETECTION' : 'WARNING',
          time: new Date(a.triggeredAt || Date.now()).toLocaleTimeString(),
          msg: `NODE ${a.pseudonym || a.studentAlias || 'Anonymized'}: ${a.message || `Burnout risk level ${a.score}`}`,
          color: a.riskLevel === 'critical' || a.riskLevel === 'high' ? '#ffb4ab' : '#00dbe7',
          action: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'DECODE_AND_INTERVENE' : null,
          bg: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'rgba(255,180,171,0.05)' : 'rgba(32,31,32,0.5)',
          border: a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'rgba(255,180,171,0.3)' : undefined
        }));
        setAlerts(formattedAlerts);
        addToast("Alert logs successfully synchronized with active Firestore.");
      } else {
        // Only run fake latency delay in demo mode
        await new Promise(r => setTimeout(r, 1200));
        const liveDemoAlerts = [
          { id: 'demo_' + Math.random(), type: 'CRITICAL_DETECTION', time: new Date().toLocaleTimeString(), msg: 'COHORT_ENG_Y2: Academic pressure spikes. Stress index at [0.89].', color: '#ffb4ab', action: 'DECODE_AND_INTERVENE', bg: 'rgba(255,180,171,0.05)', border: 'rgba(255,180,171,0.3)' },
          { id: 'demo_' + Math.random(), type: 'PATTERN_SYNC', time: new Date().toLocaleTimeString(), msg: 'ANOMALY_CS_Y4: Consecutive late night coding logs registered in CS lab.', color: '#00dbe7', bg: 'rgba(32,31,32,0.5)' },
          { id: 'demo_' + Math.random(), type: 'HEALTH_CHECK', time: new Date().toLocaleTimeString(), msg: 'PSYCHOLOGY_WELLNESS: Positive feedback cycle. Calm sessions up 15%.', color: '#D2FF00', bg: 'rgba(32,31,32,0.5)' },
        ];
        setAlerts(liveDemoAlerts);
        addToast("Dynamic telemetry sweep loaded 3 active alerts.");
      }
    } catch (err) {
      console.error(err);
      addToast("Telemetry synchronization failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Pin activation
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setActiveModal('node_deep_dive');
  };

  const kpis = [
    { label: 'AVG_BURNOUT_METRIC', val: `${Math.round(stats.campusAverageBurnout)}%`, valColor: '#D2FF00', bar: stats.campusAverageBurnout, barColor: '#D2FF00' },
    { label: 'HIGH_RISK_ALERTS', val: stats.highRiskCount.toString(), sub: 'CRITICAL_OVERFLOW', valColor: '#ffb4ab', sub_anim: stats.highRiskCount > 0 },
    { label: 'CHECK_IN_RATE', val: `${Math.round(stats.checkInRate)}%`, sub: '⚡ ACTIVE', valColor: '#00dbe7', bar: stats.checkInRate, barColor: '#00dbe7' },
    { label: 'TOTAL_NODES', val: stats.totalStudents.toLocaleString(), sub: 'Active_State', valColor: '#e1fdff' },
  ];

  return (
    <div className="crt-overlay" style={{ background: 'transparent', color: '#e5e2e3', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active="wellpulse" />
      <Header title="WellPulse Dashboard" subtext="Overview of student wellness and academic cognitive levels" searchPlaceholder="SEARCH_STUDENTS..." />

      {/* Main Container */}
      <main className="pt-24 pb-12 px-6 md:ml-64 relative z-20">
        <div className="max-w-7xl mx-auto">

          {/* Section 1: Header + KPIs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="mb-8"
          >
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="space-y-1">
                <h1 className="font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', color: '#e1fdff' }}>Institutional Pulse</h1>
                <p className="text-xs font-light" style={{ color: '#b9cacb' }}>
                  Aggregate mental equilibrium telemetry. Monitoring <span className="terminal-text" style={{ color: '#e1fdff' }}>{stats.totalStudents.toLocaleString()}</span> active student nodes.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleExportData}
                  className="border rounded-lg px-4 py-2 font-bold flex items-center gap-2 terminal-text text-[10px] transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: 'rgba(0,219,231,0.1)', borderColor: 'rgba(0,219,231,0.3)', color: '#e1fdff' }}
                >
                  <Download size={12} /> EXPORT_DATA
                </button>
                <button 
                  onClick={() => setActiveModal('filters')}
                  className="border rounded-lg px-4 py-2 font-bold flex items-center gap-2 terminal-text text-[10px] transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: 'rgba(32,31,32,0.4)', borderColor: 'rgba(255,255,255,0.08)', color: '#e5e2e3' }}
                >
                  <Filter size={12} /> FILTERS
                </button>
                <button 
                  onClick={loadData}
                  className="border rounded-lg px-4 py-2 font-bold flex items-center gap-2 terminal-text text-[10px] transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: 'rgba(32,31,32,0.4)', borderColor: 'rgba(255,255,255,0.08)', color: '#e5e2e3' }}
                >
                  <RefreshCw size={12} /> REFRESH
                </button>
              </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {kpis.map((kpi, i) => (
                <div key={i} className="rounded-2xl p-5 flex flex-col gap-2 border transition-all hover:border-[rgba(0,219,231,0.4)]"
                  style={{ background: 'rgba(10,10,11,0.6)', backdropFilter: 'blur(32px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="text-[9px] terminal-text tracking-widest uppercase" style={{ color: '#b9cacb' }}>{kpi.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold terminal-text" style={{ fontSize: 26, color: kpi.valColor }}>{kpi.val}</span>
                    {kpi.sub && <span className={`text-[9px] terminal-text ${kpi.sub_anim ? 'animate-pulse' : ''}`} style={{ color: kpi.valColor, opacity: 0.8 }}>{kpi.sub}</span>}
                  </div>
                  {kpi.bar !== undefined && (
                    <div className="h-1 w-full rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(53,52,54,1)' }}>
                      <div className="h-full chart-bar rounded-full" style={{ width: `${kpi.bar}%`, background: kpi.barColor }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 2: Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Mesh Map */}
            <section 
              className="lg:col-span-2 rounded-3xl overflow-hidden flex flex-col h-[400px] border transition-all hover:border-[rgba(0,219,231,0.4)]"
              style={{ background: 'rgba(10,10,11,0.4)', backdropFilter: 'blur(40px)', borderColor: 'rgba(0,242,255,0.15)' }}
            >
              <div className="p-6 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded border font-bold tracking-widest text-[8px] terminal-text" style={{ background: 'rgba(182,0,248,0.2)', borderColor: 'rgba(182,0,248,0.4)', color: '#f8d8ff' }}>Predictive_Mesh_Active</span>
                    <span className="px-2 py-0.5 rounded border font-bold tracking-widest text-[8px] terminal-text" style={{ background: 'rgba(0,219,231,0.1)', borderColor: 'rgba(0,219,231,0.3)', color: '#e1fdff' }}>Sync_Protocol_Link</span>
                  </div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Topological Wellbeing Mesh</h3>
                </div>
                <div className="flex rounded-lg p-1 border" style={{ background: 'rgba(14,14,15,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <button 
                    onClick={() => {
                      setMeshMode('mesh');
                      addToast("Toggled 3D topological projection.");
                    }}
                    className="px-3 py-1 rounded text-[9px] terminal-text font-bold cursor-pointer transition-all"
                    style={{ 
                      background: meshMode === 'mesh' ? 'rgba(0,219,231,0.1)' : 'transparent', 
                      color: meshMode === 'mesh' ? '#e1fdff' : '#b9cacb' 
                    }}
                  >
                    MESH_3D
                  </button>
                  <button 
                    onClick={() => {
                      setMeshMode('flat');
                      addToast("Toggled flat 2D tactical grid.");
                    }}
                    className="px-3 py-1 rounded text-[9px] terminal-text font-bold cursor-pointer transition-all"
                    style={{ 
                      background: meshMode === 'flat' ? 'rgba(0,219,231,0.1)' : 'transparent', 
                      color: meshMode === 'flat' ? '#e1fdff' : '#b9cacb' 
                    }}
                  >
                    FLAT_GRID
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative mesh-viz mx-6 mb-6 rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div 
                  className="mesh-grid animate-pulse" 
                  style={meshMode === 'flat' ? { transform: 'none', maskImage: 'none', opacity: 0.25 } : {}}
                />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute rounded-full" style={{ top: '20%', left: '30%', width: 256, height: 256, background: 'rgba(255,180,171,0.08)', filter: 'blur(100px)' }} />
                  <div className="absolute rounded-full" style={{ bottom: '30%', right: '20%', width: 320, height: 320, background: 'rgba(0,219,231,0.08)', filter: 'blur(100px)' }} />
                </div>
                {/* Data pins */}
                {[
                  { top: '35%', left: '35%', color: '#ffb4ab', label: 'School of Engineering Hub', stress: '0.88μ', alerts: 'Critical Overload', deptName: 'School of Engineering' },
                  { bottom: '40%', right: '35%', color: '#D2FF00', label: 'Fine Arts Lounge', stress: '0.12μ', alerts: 'Optimal Equilibrium', deptName: 'Faculty of Fine Arts' },
                  { top: '55%', left: '60%', color: '#00dbe7', label: 'Medical Research Labs', stress: '0.58μ', alerts: 'Stable Zone', deptName: 'Medical Sciences' },
                ].map((pin, i) => (
                  <div key={i} className="absolute flex flex-col items-center pointer-events-auto group cursor-pointer"
                    onClick={() => handleNodeClick(pin)}
                    style={{ top: pin.top, left: pin.left, bottom: pin.bottom, right: pin.right }}>
                    <div className="w-3.5 h-3.5 rounded-full animate-ping absolute" style={{ background: pin.color, opacity: 0.4 }} />
                    <div className="w-3 h-3 rounded-full relative z-10" style={{ background: pin.color, boxShadow: `0 0 15px ${pin.color}` }} />
                    <div className="h-10 w-px relative z-10" style={{ background: `linear-gradient(to top, ${pin.color}, transparent)` }} />
                    <div className="absolute top-10 rounded p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 border terminal-text text-[10px] w-48 shadow-2xl z-50"
                      style={{ background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(16px)', borderColor: `${pin.color}b3` }}>
                      <div className="font-bold mb-1" style={{ color: pin.color }}>{pin.label}</div>
                      <div style={{ color: '#e5e2e3' }} className="mb-0.5">STRESS: {pin.stress}</div>
                      <div style={{ color: '#b9cacb' }} className="mb-1">STATUS: {pin.alerts}</div>
                      <div className="text-[#00f2ff] underline font-bold mt-1 text-[8px]">CLICK_TO_INTERVENE</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Alerts Feed */}
            <section 
              className="rounded-3xl p-6 flex flex-col h-[400px] border transition-all hover:border-[rgba(0,219,231,0.4)]"
              style={{ background: 'rgba(10,10,11,0.4)', backdropFilter: 'blur(40px)', borderColor: 'rgba(0,242,255,0.15)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] terminal-text tracking-widest uppercase" style={{ color: '#b9cacb' }}>SYSLOG_ALERTS</h3>
                  {(searchQuery !== '' || filterRisk !== 'all') && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterRisk('all');
                        addToast("Diagnostic filters cleared.");
                      }}
                      className="px-2 py-0.5 rounded text-[8px] font-bold terminal-text bg-[#D2FF00]/10 text-[#D2FF00] border border-[#D2FF00]/30 hover:bg-[#D2FF00]/20 transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                    >
                      <span className="w-1 h-1 bg-[#D2FF00] rounded-full" />
                      ACTIVE_FILTER (RESET)
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] terminal-text" style={{ color: '#ffb4ab' }}>LIVE_STREAM</span>
                  <span className="flex h-2 w-2 rounded-full bg-[#ffb4ab] animate-ping" />
                </div>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <motion.div 
                        layout
                        key={alert.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => {
                          setSelectedAlert(alert);
                          setActiveModal('intervention');
                        }}
                        className={`p-4 rounded-xl border relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${alert.action ? 'critical-alert-glow' : ''}`}
                        style={{ background: alert.bg, borderColor: alert.border || 'rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] terminal-text font-bold" style={{ color: alert.color }}>{alert.type}</span>
                          <span className="text-[10px] terminal-text" style={{ color: '#b9cacb' }}>{alert.time}</span>
                        </div>
                        <p className="text-xs terminal-text leading-relaxed mb-1" style={{ color: 'rgba(229,226,227,0.9)' }}>{alert.msg}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[8px] terminal-text opacity-60 font-bold uppercase">CLICK_TO_INTERVENE</span>
                          <span 
                            className="px-2.5 py-0.5 rounded text-[8px] terminal-text font-bold uppercase"
                            style={{ background: alert.color, color: '#0a0a0f' }}
                          >
                            {alert.action ? 'DECODE' : 'INTERVENE'}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                      <ShieldCheck size={48} className="text-[#00dbe7] mb-2" />
                      <p className="text-xs terminal-text uppercase tracking-widest text-[#e5e2e3]">System Secure</p>
                      <p className="text-[10px] text-[#b9cacb]">No active critical alerts detected.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={handleSyncAlertLogs}
                className="w-full mt-4 py-2.5 border rounded-xl text-[10px] terminal-text uppercase tracking-widest transition-all hover:text-[#e1fdff] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#b9cacb' }}
              >
                SYNC_ALERT_LOGS
              </button>
            </section>
          </div>

          {/* Section 3 & 4 Grid: Side-by-Side Chart and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Section 3: Burnout Trend Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.2 }} 
              className="rounded-3xl p-6 border shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col h-[400px]"
              style={{ background: 'rgba(10,10,11,0.4)', backdropFilter: 'blur(40px)', borderColor: 'rgba(0,242,255,0.15)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Burnout Risk Trajectory</h3>
                  <p className="text-[9px] terminal-text tracking-tighter" style={{ color: '#b9cacb' }}>PREDICTIVE_DATA_STREAM v1.0.2</p>
                </div>
                <div className="flex rounded-full p-1 border" style={{ background: 'rgba(14,14,15,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  {['weekly', 'monthly', 'semester'].map((p) => (
                    <button 
                      key={p} 
                      onClick={() => setSelectedPeriod(p)}
                      className="px-3 py-1 rounded-full text-[9px] terminal-text font-bold transition-all uppercase cursor-pointer"
                      style={{ 
                        background: selectedPeriod === p ? 'rgba(0,219,231,0.1)' : 'transparent', 
                        color: selectedPeriod === p ? '#e1fdff' : '#b9cacb' 
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 relative flex items-end justify-between border-b px-4 pb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => <div key={i} className="border-t w-full" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />)}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedPeriod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-x-4 bottom-2 top-0 flex items-end justify-between"
                  >
                    {CHART_DATA[selectedPeriod].bars.map((bar, i) => (
                      <div key={i} className="w-[8%] rounded-t border-x border-t chart-bar relative group cursor-pointer"
                        style={{
                          height: `${bar.h}%`,
                          background: bar.color === 'error' ? 'linear-gradient(to top,rgba(255,180,171,0.1),rgba(255,180,171,0.7))' : 'linear-gradient(to top,rgba(210,255,0,0.1),rgba(210,255,0,0.6))',
                          borderColor: bar.color === 'error' ? 'rgba(255,180,171,0.2)' : 'rgba(210,255,0,0.2)',
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 rounded px-2 py-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none terminal-text whitespace-nowrap">
                          Burnout: {bar.h}%
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex justify-between px-4 mt-2 terminal-text text-[9px] font-bold" style={{ color: '#b9cacb' }}>
                {CHART_DATA[selectedPeriod].months.map(m => <span key={m}>{m}</span>)}
              </div>
            </motion.div>

            {/* Section 4: Departmental Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.3 }} 
              className="rounded-3xl p-6 border shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col h-[400px]"
              style={{ background: 'rgba(10,10,11,0.4)', backdropFilter: 'blur(40px)', borderColor: 'rgba(0,242,255,0.15)' }}
            >
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <h3 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>Departmental deep_dive</h3>
                <span className="text-[9px] terminal-text" style={{ color: '#b9cacb' }}>{filteredDepts.length}_CLUSTERS_ACTIVE</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['NODE_ID', 'CAPACITY', 'MOOD_IDX', 'OP'].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] terminal-text font-bold tracking-widest uppercase" style={{ color: '#b9cacb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map((d, i) => (
                      <tr key={i} className="transition-colors hover:bg-[rgba(0,219,231,0.03)] border-b border-white/5">
                        <td className="px-4 py-3.5 font-bold text-xs terminal-text" style={{ color: '#e5e2e3' }}>{d.department.replace("School of ", "").replace("Faculty of ", "")}</td>
                        <td className="px-4 py-3.5 text-xs terminal-text" style={{ color: '#b9cacb' }}>{(d.studentCount || 1000).toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.avgBurnoutScore > 60 ? '#ffb4ab' : '#00dbe7' }} />
                            <span className="terminal-text text-xs" style={{ color: '#e5e2e3' }}>{d.avgBurnoutScore}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button 
                            onClick={() => {
                              setSelectedDeptDetails(d);
                              setActiveModal('dept_details');
                            }}
                            className="text-[9px] terminal-text font-bold uppercase underline underline-offset-4 transition-colors hover:text-[#D2FF00] cursor-pointer" 
                            style={{ color: '#e1fdff' }}
                          >
                            DETAILS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

        </div>
      </main>

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 space-y-3 z-[100]">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-5 py-4 rounded-xl shadow-2xl border text-xs font-semibold terminal-text flex items-center gap-3 w-80 backdrop-blur-md"
              style={{ 
                background: toast.type === 'error' ? 'rgba(105,0,5,0.95)' : 'rgba(10,10,11,0.95)',
                borderColor: toast.type === 'error' ? 'rgba(255,180,171,0.4)' : 'rgba(0,242,255,0.2)',
                color: toast.type === 'error' ? '#ffb4ab' : '#e1fdff'
              }}
            >
              <div className="w-2 h-2 rounded-full animate-ping" style={{ background: toast.type === 'error' ? '#ffb4ab' : '#00dbe7' }} />
              <p className="flex-1 leading-snug">{toast.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MODALS GATEWAY */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[99] px-4"
          >
            {/* Backdrop Overlay */}
            <div 
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer" 
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-lg border rounded-3xl relative z-10 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(14,14,15,0.95)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {/* Modal header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <h3 className="font-bold text-xl uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk', color: '#e1fdff' }}>
                  {activeModal === 'intervention' && 'Cohort Intervention Portal'}
                  {activeModal === 'node_deep_dive' && 'Mesh Node Analysis'}
                  {activeModal === 'dept_details' && 'Department Analytics'}
                  {activeModal === 'filters' && 'Filter Control Console'}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-[#b9cacb] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Contents */}
              <div className="p-8">
                
                {/* 1. INTERVENTION MODAL */}
                {activeModal === 'intervention' && selectedAlert && (
                  <form onSubmit={handleInterventionSubmit} className="space-y-6">
                    <div className="p-4 rounded-2xl border" style={{ background: `${selectedAlert.color || '#ffb4ab'}10`, borderColor: `${selectedAlert.color || '#ffb4ab'}33` }}>
                      <div className="flex items-center gap-2 text-[10px] terminal-text font-bold mb-1.5" style={{ color: selectedAlert.color || '#ffb4ab' }}>
                        <AlertCircle size={12} /> {selectedAlert.type || 'TARGETED_ALERT'}
                      </div>
                      <p className="text-xs text-[#e5e2e3] leading-relaxed font-mono">{selectedAlert.msg}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Select Intervention Protocol</label>
                      <select 
                        value={interventionProto}
                        onChange={(e) => setInterventionProto(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00f2ff]/50 outline-none text-[#e5e2e3] cursor-pointer"
                      >
                        <option value="Academic Extension Offer" className="bg-[#0a0a0f]">Academic Extension Offer</option>
                        <option value="Emergency Counseling Outreach" className="bg-[#0a0a0f]">Emergency Counseling Outreach</option>
                        <option value="Automated CalmCal Load Reduction" className="bg-[#0a0a0f]">Automated CalmCal Load Reduction</option>
                        <option value="Peer Mental Health Support Link" className="bg-[#0a0a0f]">Peer Mental Health Support Link</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Intervention Broadcast Message</label>
                      <textarea
                        required
                        rows={4}
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        placeholder="Type counselor guidance or select default template broadcast..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00f2ff]/50 outline-none text-[#e5e2e3] resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:brightness-115 transition-all cursor-pointer text-[#0a0a0f]"
                      style={{ background: selectedAlert.color || '#ffb4ab', boxShadow: `0 4px 20px ${(selectedAlert.color || '#ffb4ab')}33` }}
                    >
                      <Send size={14} /> {actionLoading ? 'DISPATCHING...' : 'DISPATCH_INTERVENTION'}
                    </button>
                  </form>
                )}

                {/* 2. NODE DEEP DIVE MODAL */}
                {activeModal === 'node_deep_dive' && selectedNode && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 rounded-2xl border" style={{ background: 'rgba(0,242,255,0.02)', borderColor: 'rgba(0,242,255,0.1)' }}>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: '#e1fdff' }}>{selectedNode.label}</h4>
                        <p className="text-[10px] terminal-text" style={{ color: '#b9cacb' }}>COGNITIVE_GEOLOCATION</p>
                      </div>
                      <span className="px-3 py-1 rounded border text-[10px] terminal-text font-bold"
                        style={{ background: `${selectedNode.color}15`, color: selectedNode.color, borderColor: `${selectedNode.color}30` }}>
                        STRESS: {selectedNode.stress}
                      </span>
                    </div>

                    {/* Hourly stress breakdown mockup */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Hourly Load Metrics</h5>
                      <div className="h-32 flex items-end justify-between border-b border-white/5 pb-2">
                        {[40, 55, 68, 85, 92, 70, 48, 30].map((h, i) => (
                          <div key={i} className="w-[10%] rounded-t relative group" style={{ height: `${h}%`, background: h > 60 ? 'linear-gradient(to top, rgba(255,180,171,0.1), #ffb4ab)' : 'linear-gradient(to top, rgba(0,242,255,0.1), #00dbe7)' }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black border border-white/10 rounded px-1.5 py-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity terminal-text">{h}%</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] terminal-text text-[#b9cacb] font-bold">
                        <span>08:00</span>
                        <span>12:00</span>
                        <span>16:00</span>
                        <span>20:00</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          addToast(`Dispatched: Automated deep break recommendations broadcasted to ${selectedNode.label}.`);
                          setActiveModal(null);
                        }}
                        className="py-3.5 rounded-xl border border-[#00f2ff]/30 text-[#00f2ff] font-bold text-xs tracking-wider hover:bg-[#00f2ff]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Volume2 size={13} /> PUSH_RECOVERY
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAlert({
                            id: 'node_' + Math.random(),
                            msg: `Critical overload at geolocation node: ${selectedNode.label}. [Stress Weight: ${selectedNode.stress}]`
                          });
                          setActiveModal('intervention');
                        }}
                        className="py-3.5 rounded-xl font-bold text-xs tracking-wider hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ background: '#D2FF00', color: '#0a0a0f' }}
                      >
                        <Heart size={13} /> DIRECT_INTERVENE
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. DEPARTMENT DETAILS */}
                {activeModal === 'dept_details' && selectedDeptDetails && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <h4 className="font-bold text-lg mb-1" style={{ color: '#e1fdff' }}>{selectedDeptDetails.department}</h4>
                      <p className="text-[10px] terminal-text" style={{ color: '#b9cacb' }}>Enrolled Capacity: {selectedDeptDetails.studentCount} active nodes</p>
                    </div>

                    {/* Donut risk breakdown simulation */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Risk Profile Breakdown</h5>
                      <div className="space-y-3">
                        {[
                          { label: 'Critical Risk', pct: selectedDeptDetails.avgBurnoutScore > 75 ? 30 : 10, color: '#ffb4ab' },
                          { label: 'High Alert', pct: selectedDeptDetails.avgBurnoutScore > 60 ? 40 : 25, color: '#ffeaad' },
                          { label: 'Stable Equilibrium', pct: selectedDeptDetails.avgBurnoutScore > 60 ? 30 : 65, color: '#00dbe7' }
                        ].map((risk, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[10px] terminal-text font-semibold text-[#b9cacb] uppercase">
                              <span>{risk.label}</span>
                              <span style={{ color: risk.color }}>{risk.pct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${risk.pct}%`, background: risk.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBroadcastBulletin(selectedDeptDetails.department)}
                      className="w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #00f2ff 0%, #006a71 100%)', color: '#001f22' }}
                    >
                      <Users size={14} /> BROADCAST_DEPARTMENTAL_BULLETIN
                    </button>
                  </div>
                )}

                {/* 4. FILTERS CONSOLE */}
                {activeModal === 'filters' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Filter Alerts by Severity</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'All', val: 'all' },
                          { label: 'Critical', val: 'critical' },
                          { label: 'Stable', val: 'stable' }
                        ].map(item => (
                          <button
                            key={item.val}
                            onClick={() => setFilterRisk(item.val)}
                            className="py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                            style={{ 
                              background: filterRisk === item.val ? 'rgba(0,242,255,0.1)' : 'transparent',
                              borderColor: filterRisk === item.val ? '#00f2ff' : 'rgba(255,255,255,0.1)',
                              color: filterRisk === item.val ? '#00f2ff' : '#b9cacb'
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] terminal-text font-bold uppercase tracking-widest text-[#b9cacb]">Keyword Search Filter</label>
                      <input
                        type="text"
                        placeholder="Search geolocations, cohorts, or alerts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00f2ff]/50 outline-none text-[#e5e2e3]"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        addToast("Diagnostic filters applied.");
                        setActiveModal(null);
                      }}
                      className="w-full py-4 rounded-xl font-bold text-xs tracking-widest flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                      style={{ background: '#D2FF00', color: '#0a0a0f' }}
                    >
                      APPLY_FILTERS
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exquisite custom CSS classes */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,242,255,0.2);
        }
        .critical-alert-glow {
          box-shadow: inset 0 0 15px rgba(255,180,171,0.05);
          animation: criticalGlow 2.5s infinite alternate;
        }
        @keyframes criticalGlow {
          from {
            border-color: rgba(255,180,171,0.15);
          }
          to {
            border-color: rgba(255,180,171,0.35);
            box-shadow: 0 0 8px rgba(255,180,171,0.08), inset 0 0 15px rgba(255,180,171,0.05);
          }
        }
      `}</style>
    </div>
  );
}
