import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { DEMO_MODE, auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth';

const AuthContext = createContext(null);

// Mock user for demo mode
const MOCK_USER = {
  uid: 'demo-user-001',
  displayName: 'Alex Johnson',
  email: 'alex@university.edu',
  photoURL: null,
  role: 'student',
};

const MOCK_COUNSELOR = {
  uid: 'demo-counselor-001',
  displayName: 'Dr. Sarah Chen',
  email: 'sarah.chen@university.edu',
  photoURL: null,
  role: 'counselor',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('student'); // 'student' | 'counselor'

  // Role is exclusively fetched from Firestore via the backend
  // to prevent email-based privilege escalation.

  useEffect(() => {
    if (DEMO_MODE) {
      const saved = localStorage.getItem('mf_demo_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasOnboarded = localStorage.getItem('mf_onboarding') === 'true';
        setUser({ ...parsed, onboarded: parsed.role === 'counselor' ? true : hasOnboarded });
        setRole(parsed.role || 'student');
      }
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

        try {
          // Check Firestore directly — bypasses Express backend
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // Profile exists → user is onboarded
            const profile = userDocSnap.data();
            localStorage.setItem('mf_onboarding', 'true');
            setUser({ 
              ...firebaseUser, 
              ...profile, 
              onboarded: true 
            });
            setRole(profile.role || 'student');
          } else {
            // No profile → new user → send to onboarding
            setUser({ 
              ...firebaseUser, 
              role: 'student', 
              onboarded: false 
            });
            setRole('student');
          }
        } catch (err) {
          console.error('Firestore check failed:', err);
          const hasOnboarded = localStorage.getItem('mf_onboarding') === 'true';
          setUser({ ...firebaseUser, role: 'student', onboarded: hasOnboarded });
          setRole('student');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInDemo = (asCounselor = false) => {
    const mockUser = asCounselor ? MOCK_COUNSELOR : MOCK_USER;
    const hasOnboarded = localStorage.getItem('mf_onboarding') === 'true';
    const userWithOnboard = { ...mockUser, onboarded: asCounselor ? true : hasOnboarded };
    localStorage.setItem('mf_demo_user', JSON.stringify(userWithOnboard));
    setUser(userWithOnboard);
    setRole(mockUser.role);
  };

  const logout = async () => {
    localStorage.removeItem('mf_onboarding');
    localStorage.removeItem('google_signup_pending');
    if (DEMO_MODE) {
      localStorage.removeItem('mf_demo_user');
      localStorage.removeItem('mf_last_checkin');
      localStorage.removeItem('mf_history');
      setUser(null);
      setRole('student');
      return;
    }
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
    if (DEMO_MODE) {
      const isCounselor = email.includes('counselor');
      signInDemo(isCounselor);
      const hasOnboarded = localStorage.getItem('mf_onboarding') === 'true';
      return { isNewUser: !isCounselor && !hasOnboarded, role: isCounselor ? 'counselor' : 'student' };
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const { data: profile } = await api.get('/users/me');
      
      if (profile.role !== 'counselor') {
        localStorage.setItem('mf_onboarding', 'true');
      }
      
      setUser({ 
        ...cred.user, 
        ...profile, 
        onboarded: true
      });
      setRole(profile.role || 'student');
      return { isNewUser: false, role: profile.role || 'student' };
    } catch (err) {
      console.error('No profile found, treating as new user:', err);
      setUser({ ...cred.user, role: 'student', onboarded: false });
      setRole('student');
      return { isNewUser: true, role: 'student' };
    }
  };

  const signup = async (email, password, name, chosenRole = 'student') => {
    if (DEMO_MODE) {
      signInDemo(chosenRole === 'counselor');
      return { isNewUser: chosenRole === 'student' };
    }
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
    if (DEMO_MODE) {
      signInDemo(false);
      return;
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  };

  const updateUserProfile = async (updates) => {
    if (DEMO_MODE) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('mf_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }
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
    <AuthContext.Provider value={{ user, loading, role, signInDemo, logout, login, signup, loginWithGoogle, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
