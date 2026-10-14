import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function ensureUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  return runTransaction(db, async transaction => {
    const userSnapshot = await transaction.get(userRef);
    if (userSnapshot.exists()) return userSnapshot.data() as UserProfile;

    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      photoURL: firebaseUser.photoURL || '',
      role: 'buyer',
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(userRef, newProfile);
    return newProfile;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const storedEmail = localStorage.getItem('emailForSignIn');
    const email = storedEmail || window.prompt('Confirm the email address used for sign-in');
    if (!email) {
      toast.error('Email link sign-in was cancelled because no email was provided.');
      return;
    }
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        localStorage.removeItem('emailForSignIn');
        window.history.replaceState({}, document.title, '/');
      })
      .catch(error => {
        console.error('Email link sign-in failed:', error);
        toast.error('This sign-in link is invalid or has expired.');
      });
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, firebaseUser => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(firebaseUser);
      setProfile(null);
      setLoading(Boolean(firebaseUser));
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeProfile = onSnapshot(userRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setProfile({
            ...data,
            uid: firebaseUser.uid,
            email: firebaseUser.email || data.email || '',
            displayName: data.displayName || firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || data.photoURL || '',
          });
          setLoading(false);
          return;
        }

        void ensureUserProfile(firebaseUser)
          .then(setProfile)
          .catch(error => {
            console.error('Could not create account profile:', error);
            toast.error('Your profile could not be initialized. Please try again.');
          })
          .finally(() => setLoading(false));
      }, error => {
        console.error('Could not load account profile:', error);
        setLoading(false);
        toast.error('Your account profile could not be loaded.');
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const register = async (email: string, password: string, displayName: string) => {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    const name = displayName.trim();
    if (name) await updateProfile(credentials.user, { displayName: name });
    await ensureUserProfile(credentials.user);
    await sendEmailVerification(credentials.user);
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendOtp = async (email: string) => {
    const actionCodeSettings: ActionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('emailForSignIn', email);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    await updatePassword(auth.currentUser, newPassword);
  };

  const verifyEmail = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    await sendEmailVerification(auth.currentUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      register,
      loginWithEmailPassword,
      logout,
      sendOtp,
      resetPassword,
      updateUserPassword,
      verifyEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
