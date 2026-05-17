import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import CalmCal from './pages/CalmCal';
import WellPulse from './pages/WellPulse';
import Resources from './pages/Resources';
import Community from './pages/Community';
import Alerts from './pages/Alerts';
import Departments from './pages/Departments';
import Settings from './pages/Settings';
import Support from './pages/Support';
import SmoothScroll from './components/SmoothScroll';
import CustomCursor from './components/CustomCursor';

function ProtectedRoute({ children, onlyRole = null, allowOnboardingPending = false }) {
  const { user, loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (onlyRole === 'counselor' && role !== 'counselor')
    return <Navigate to="/dashboard" replace />;
  if (onlyRole === 'student' && role !== 'student')
    return <Navigate to="/wellpulse" replace />;

  // If student is NOT onboarded, force them to onboarding
  if (role === 'student' && !user.onboarded && !allowOnboardingPending) {
    return <Navigate to="/onboarding" replace />;
  }

  // If student IS onboarded, prevent them from going back to onboarding
  if (role === 'student' && user.onboarded && allowOnboardingPending) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b14' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid rgba(108,99,255,0.2)',
          borderTopColor: '#6c63ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Loading MindFlow…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(3px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(3px)' }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, filter', gridArea: '1 / 1 / 2 / 2', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { user, role } = useAuth();
  // Only Auth and Onboarding use the old global nav/bg system
  const showNav = ['/onboarding', '/checkin'].includes(location.pathname);

  return (
    <SmoothScroll>
      {/* Global Background (Video + Precise Glows) */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #080a0f 0%, #030305 100%)',
          overflow: 'hidden'
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-screen transition-opacity duration-1000"
          onError={(e) => {
            e.target.style.opacity = 0;
            console.warn("Background video failed to load, falling back to static gradient.");
          }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />

        {/* Artistic Glow Layers */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main Cyan Core Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,219,231,0.5) 0%, transparent 70%)',
              filter: 'blur(120px)',
              mixBlendMode: 'screen'
            }} />

          {/* Top Left Cyan Glow */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,219,231,0.15) 0%, transparent 70%)',
              filter: 'blur(100px)',
              mixBlendMode: 'screen'
            }} />

          {/* Subtle Lime Peripheral Glow */}
          <div className="absolute top-[15%] right-[10%] w-[900px] h-[900px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(210,255,0,0.2) 0%, transparent 70%)',
              filter: 'blur(140px)'
            }} />

          {/* CRISP Circular Border (The Hero's Ring) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full border border-white/10"
            style={{
              boxShadow: '0 0 100px rgba(0,219,231,0.2), inset 0 0 100px rgba(0,219,231,0.2)',
              background: 'rgba(3,3,5,0.02)'
            }} />
        </div>

        {/* Deep Vignette Overlay (Lightened) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(3,3,5,0.6) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-[#030305]/20" />
      </div>

      <CustomCursor />
      {/* Cinematic vignette — dark edges, bright centre like a film lens */}
      <div className="vignette" />
      {showNav && <Nav />}
      <div style={{ display: 'grid' }}>
        <AnimatePresence>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/auth" element={
              user
                ? <Navigate to={role === 'counselor' ? '/wellpulse' : (user.onboarded ? '/dashboard' : '/onboarding')} replace />
                : <PageTransition><Auth /></PageTransition>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute allowOnboardingPending={true}><PageTransition><Onboarding /></PageTransition></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute onlyRole="student"><PageTransition><Dashboard /></PageTransition></ProtectedRoute>
            } />
            <Route path="/checkin" element={
              <ProtectedRoute onlyRole="student"><PageTransition><CheckIn /></PageTransition></ProtectedRoute>
            } />
            <Route path="/calmcal" element={
              <ProtectedRoute onlyRole="student"><PageTransition><CalmCal /></PageTransition></ProtectedRoute>
            } />
            <Route path="/wellpulse" element={
              <ProtectedRoute onlyRole="counselor"><PageTransition><WellPulse /></PageTransition></ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute onlyRole="student"><PageTransition><Resources /></PageTransition></ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute onlyRole="student"><PageTransition><Community /></PageTransition></ProtectedRoute>
            } />
            <Route path="/alerts" element={
              <ProtectedRoute onlyRole="counselor"><PageTransition><Alerts /></PageTransition></ProtectedRoute>
            } />
            <Route path="/departments" element={
              <ProtectedRoute onlyRole="counselor"><PageTransition><Departments /></PageTransition></ProtectedRoute>
            } />
            <Route path="/account-settings" element={
              <ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute><PageTransition><Support /></PageTransition></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
