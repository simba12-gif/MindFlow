import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { isFirebaseConfigured, auth, googleProvider } from '../lib/firebase';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('student'); // 'student' | 'counselor'

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          try {
            const { data: profile } = await api.get('/users/me');
            setUser({ ...result.user, ...profile, onboarded: true });
            setRole(profile.role || 'student');
          } catch (err) {
            const chosenRole = localStorage.getItem('mf_signup_role') || 'student';
            localStorage.removeItem('mf_signup_role');
            
            if (chosenRole === 'counselor') {
              await api.post('/users/onboard', { role: 'counselor' });
              setUser({ ...result.user, role: 'counselor', onboarded: true });
              setRole('counselor');
            } else {
              setUser({ ...result.user, role: 'student', onboarded: false });
              setRole('student');
            }
          }
        }
      } catch (err) {
        console.error('Redirect login error:', err);
      }
    };
    checkRedirect();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If a Google signup is in progress, delay setting the user in state
        // so that the Auth page has time to display the auto-fill details before redirection
        if (localStorage.getItem('google_signup_pending') === 'true') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          localStorage.removeItem('google_signup_pending');
        }

        const isCounselorEmail = firebaseUser.email && firebaseUser.email.toLowerCase().includes('counselor');
        try {
          // Fetch profile from our backend via Express API (robust and bypasses client permission rules)
          const { data: profile } = await api.get('/users/me');

          localStorage.setItem('mf_onboarding', 'true');
          setUser({ 
            ...firebaseUser, 
            ...profile, 
            role: isCounselorEmail ? 'counselor' : (profile.role || 'student'),
            onboarded: true 
          });
          setRole(isCounselorEmail ? 'counselor' : (profile.role || 'student'));
        } catch (err) {
          console.error('Profile fetch failed:', err.message);
          
          const is404 = err.response && err.response.status === 404;
          const hasOnboarded = localStorage.getItem('mf_onboarding') === 'true' || isCounselorEmail;

          // Avoid overwriting/downgrading active local states if signup/onboarding flow is currently in progress
          setUser(prev => {
            if (isCounselorEmail) {
              return {
                ...firebaseUser,
                role: 'counselor',
                onboarded: true
              };
            }
            if (prev && prev.uid === firebaseUser.uid) {
              return {
                ...firebaseUser,
                ...prev
              };
            }
            return { 
              ...firebaseUser, 
              role: isCounselorEmail ? 'counselor' : 'student', 
              onboarded: is404 && !isCounselorEmail ? false : hasOnboarded 
            };
          });

          setRole(prev => {
            if (isCounselorEmail) return 'counselor';
            if (prev && prev !== 'student') {
              return prev;
            }
            return 'student';
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    localStorage.removeItem('mf_onboarding');
    localStorage.removeItem('google_signup_pending');
    localStorage.removeItem('mf_last_checkin');
    localStorage.removeItem('mf_history');
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase signOut failed, forcing local session clear:', err);
    } finally {
      setUser(null);
      setRole('student');
    }
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isCounselorEmail = email && email.toLowerCase().includes('counselor');
    try {
      const { data: profile } = await api.get('/users/me');
      
      if (profile.role !== 'counselor' && !isCounselorEmail) {
        localStorage.setItem('mf_onboarding', 'true');
      }
      
      setUser({ 
        ...cred.user, 
        ...profile, 
        role: isCounselorEmail ? 'counselor' : (profile.role || 'student'),
        onboarded: true
      });
      setRole(isCounselorEmail ? 'counselor' : (profile.role || 'student'));
      return { isNewUser: false, role: isCounselorEmail ? 'counselor' : (profile.role || 'student') };
    } catch (err) {
      console.error('No profile found, treating as new user:', err);
      
      setUser({ 
        ...cred.user, 
        role: isCounselorEmail ? 'counselor' : 'student', 
        onboarded: isCounselorEmail ? true : false 
      });
      setRole(isCounselorEmail ? 'counselor' : 'student');
      return { 
        isNewUser: !isCounselorEmail, 
        role: isCounselorEmail ? 'counselor' : 'student' 
      };
    }
  };

  const signup = async (email, password, name, chosenRole = 'student') => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
    
    if (chosenRole === 'counselor') {
      await api.post('/users/onboard', { role: 'counselor' });
      setUser({ ...newUser, role: 'counselor', onboarded: true });
      setRole('counselor');
      return { isNewUser: false };
    } else {
      setUser({ ...newUser, role: 'student', onboarded: false });
      setRole('student');
      return { isNewUser: true };
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  };

  const updateUserProfile = async (updates) => {
    // Update Firebase standard auth
    const standardUpdates = {};
    if ('displayName' in updates) standardUpdates.displayName = updates.displayName;
    if ('photoURL' in updates) standardUpdates.photoURL = updates.photoURL;
    
    if (Object.keys(standardUpdates).length > 0) {
      await updateProfile(auth.currentUser, standardUpdates);
    }
    
    // Update Custom Metadata via backend PUT
    const firestoreUpdates = { ...updates };
    delete firestoreUpdates.photoURL;
    
    if (Object.keys(firestoreUpdates).length > 0) {
      try {
        await api.put('/users/me', firestoreUpdates);
      } catch (err) {
        console.warn('Failed to update Firestore profile, syncing locally:', err.message);
      }
    }
    
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      role, 
      logout, 
      login, 
      signup, 
      loginWithGoogle, 
      updateUserProfile,
      firebaseConfigMissing: !isFirebaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
