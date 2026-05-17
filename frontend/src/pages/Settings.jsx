import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { storage, DEMO_MODE } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AccountSettings() {
  const { user, logout, updateUserProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.photoURL || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    semester: user?.semester || '',
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setToast({ message: 'SYNCHRONIZING_PROFILE...', type: 'info' });
      let finalPhotoURL = avatar;

      if (!DEMO_MODE && avatarFile) {
        const refInstance = storageRef(storage, `avatars/${user?.uid || Date.now()}`);
        await uploadBytes(refInstance, avatarFile);
        finalPhotoURL = await getDownloadURL(refInstance);
      }

      await updateUserProfile({
        displayName: formData.displayName,
        photoURL: finalPhotoURL,
        semester: formData.semester
      });
      setIsEditing(false);
      setToast({ message: 'Profile protocol sync completed successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      console.error('Failed to update profile', error);
      setToast({ message: 'Neural link unstable: Failed to update profile.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleRemovePhoto = async () => {
    setAvatar(null);
    setAvatarFile(null);
    try {
      await updateUserProfile({ photoURL: '' });
      setToast({ message: 'Profile telemetry photo purged.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to remove photo', error);
      setToast({ message: 'Failed to clear photo.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="crt-overlay" style={{ background:'transparent', color:'#e5e2e3', minHeight:'100vh', fontFamily:'Inter, sans-serif' }}>
      <Sidebar active="settings" />
      <Header title="Account Settings" subtext="USER_PROFILE: ACTIVE" />

      <main className="pt-28 pb-12 px-6 md:ml-64 relative z-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard style={{ padding: 40 }}>
                <div className="flex flex-col items-center gap-4 mb-10">
                  <div className="relative w-32 h-32 group">
                    <div className="w-full h-full rounded-2xl flex items-center justify-center font-bold text-4xl border shadow-2xl overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(0,219,231,0.2)]"
                      style={{ background: 'rgba(0,219,231,0.15)', color: '#e1fdff', borderColor: 'rgba(0,219,231,0.3)' }}>
                      {avatar && avatar.trim() !== '' ? (
                        <img 
                          src={avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            setAvatar(null);
                          }}
                        />
                      ) : (
                        (formData.displayName || user?.email || 'A')[0].toUpperCase()
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl border-2 border-dashed border-[#D2FF00]/40">
                      <span className="material-symbols-outlined text-[#D2FF00] text-3xl">add_a_photo</span>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] terminal-text font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Change Photo
                    </button>
                    {(avatar || user?.photoURL) && (
                      <button 
                        onClick={handleRemovePhoto}
                        className="px-4 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] terminal-text font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] terminal-text font-bold text-[#b9cacb] uppercase tracking-widest">Display Name</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#D2FF00]/50 outline-none transition-all"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    readOnly={!isEditing}
                    style={{ cursor: isEditing ? 'text' : 'default', opacity: isEditing ? 1 : 0.7 }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] terminal-text font-bold text-[#b9cacb] uppercase tracking-widest">Email Address</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm opacity-50 cursor-not-allowed"
                    value={formData.email}
                    readOnly
                  />
                  <p className="text-[9px] opacity-30 italic">Email is managed by your institution and cannot be modified.</p>
                </div>

                {user?.role === 'student' && (
                  <div className="space-y-2">
                    <label className="text-[10px] terminal-text font-bold text-[#b9cacb] uppercase tracking-widest">Academic Semester</label>
                    {isEditing ? (
                      <select 
                        className="w-full bg-[#0e0e0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#e5e2e3] focus:border-[#D2FF00]/50 outline-none transition-all"
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      >
                        <option value="" style={{ background: '#0e0e0f' }}>Select...</option>
                        {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map(sem => (
                          <option key={sem} value={sem} style={{ background: '#0e0e0f' }}>{sem}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm opacity-70 cursor-default"
                        value={formData.semester || 'Not set'}
                        readOnly
                      />
                    )}
                  </div>
                )}

                <div className="pt-10 border-t border-white/5 flex gap-4">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={handleSave}
                        className="flex-1 px-8 py-3 rounded-xl bg-[#D2FF00] text-[#020202] text-xs font-bold tracking-widest hover:scale-105 transition-transform"
                      >
                        SAVE_PROTOCOL
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-8 py-3 rounded-xl border border-white/10 text-xs font-bold tracking-widest hover:bg-white/5 transition-all"
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full px-8 py-3 rounded-xl border border-[#00DBE7]/30 text-[#00DBE7] text-xs font-bold tracking-widest hover:bg-[#00DBE7]/10 transition-all"
                    >
                      EDIT_PROFILE
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>

            <div className="mt-8 text-center">
               <button 
                onClick={() => logout()}
                className="text-red-400/50 hover:text-red-400 text-[10px] terminal-text font-bold uppercase tracking-widest transition-colors"
              >
                Sign Out from all sessions
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{ 
              position: 'fixed', bottom: 32, right: 32, zIndex: 1000, 
              background: 'rgba(14, 14, 15, 0.95)', backdropFilter: 'blur(20px)',
              border: toast.type === 'success' ? '1px solid rgba(0, 219, 231, 0.3)' : toast.type === 'error' ? '1px solid rgba(255, 180, 171, 0.3)' : '1px solid rgba(0, 219, 231, 0.1)',
              boxShadow: toast.type === 'success' ? '0 10px 30px rgba(0, 219, 231, 0.2)' : toast.type === 'error' ? '0 10px 30px rgba(255, 180, 171, 0.2)' : '0 10px 30px rgba(0, 219, 231, 0.05)',
              borderRadius: '1.25rem', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12
            }}
          >
            <span className="material-symbols-outlined animate-pulse" style={{ color: toast.type === 'success' ? '#00f2ff' : toast.type === 'error' ? '#ffb4ab' : '#00f2ff' }}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'warning' : 'sync'}
            </span>
            <span className="text-xs font-bold terminal-text" style={{ color: '#e5e2e3' }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
