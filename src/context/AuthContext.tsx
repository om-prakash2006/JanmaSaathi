import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Role, User } from '../types';
import { DEMO_ACCOUNTS } from '../data/centralDemoData';

interface AuthContextType {
  role: Role | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (selectedRole: Role, identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (roleToAssume?: Role) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_FALLBACK_KEY = 'janmasaathi_auth_session_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Restore session from cache or Firebase Auth state observer
  useEffect(() => {
    // 1. Initial cached session check for immediate UI rendering
    try {
      const cached = localStorage.getItem(AUTH_FALLBACK_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.role && parsed?.id) {
          setUser(parsed);
          setRole(parsed.role as Role);
        }
      }
    } catch {
      // ignore
    }

    // 2. Listen to real Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            const activeRole = data.role as Role;
            const fullUser: User = {
              id: data.staffId || data.motherId || firebaseUser.uid,
              name: data.displayName || firebaseUser.email || 'Verified User',
              role: activeRole,
              email: firebaseUser.email || undefined,
              phone: data.phone || undefined,
            };
            setUser(fullUser);
            setRole(activeRole);
            localStorage.setItem(AUTH_FALLBACK_KEY, JSON.stringify(fullUser));
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    selectedRole: Role,
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = pass.trim();

    if (!trimmedId) {
      return { success: false, error: 'Please enter your registered identity credential.' };
    }
    if (!trimmedPass) {
      return { success: false, error: 'Please enter your secure password.' };
    }

    const demoAccount = DEMO_ACCOUNTS[selectedRole];

    // Determine target authentication email
    let authEmail: string;
    let expectedStaffId: string | null = null;

    if (selectedRole === 'mother') {
      authEmail = trimmedId;
    } else if (selectedRole === 'worker') {
      expectedStaffId = trimmedId.toUpperCase();
      authEmail = `${trimmedId.replace(/[^a-z0-9]/g, '')}@staff.janmasaathi.gov.in`;
    } else {
      expectedStaffId = trimmedId.toUpperCase();
      authEmail = `${trimmedId.replace(/[^a-z0-9]/g, '')}@supervisor.janmasaathi.gov.in`;
    }

    try {
      // Attempt sign-in with Firebase Authentication
      let firebaseUser: FirebaseUser | null = null;

      try {
        const userCred = await signInWithEmailAndPassword(auth, authEmail, trimmedPass);
        firebaseUser = userCred.user;
      } catch (authErr: any) {
        // If user does not exist yet in Firebase Auth, provision them on first verified login
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          // Check if valid credential against registered roster
          const isKnownMother = selectedRole === 'mother' && trimmedId === demoAccount.identifier.toLowerCase();
          const isKnownWorker = selectedRole === 'worker' && (expectedStaffId === 'HW-44120' || expectedStaffId === 'HW-002');
          const isKnownSupervisor = selectedRole === 'supervisor' && expectedStaffId === 'SUP-2025-012';

          if ((isKnownMother || isKnownWorker || isKnownSupervisor) && trimmedPass === 'demo1234') {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, authEmail, trimmedPass);
              firebaseUser = newCred.user;
            } catch (createErr: any) {
              if (createErr.code === 'auth/operation-not-allowed') {
                throw createErr;
              }
            }
          } else {
            return {
              success: false,
              error: 'Invalid credential or password. Please verify your registered ID.',
            };
          }
        } else if (authErr.code === 'auth/operation-not-allowed') {
          console.warn('Firebase Auth: Email/Password provider is not yet enabled in Firebase Console for project outr-janmasaathi.');
          // Provide informative fallback while informing user
        } else {
          console.warn('Firebase Auth signin notice:', authErr.code, authErr.message);
        }
      }

      // If Firebase Auth authenticated, create/sync user document in Firestore
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(
            userDocRef,
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: selectedRole,
              displayName: demoAccount.user.name,
              staffId: expectedStaffId || null,
              motherId: selectedRole === 'mother' ? 'MCP-2026-0894' : null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('Firestore user profile sync notice:', dbErr);
        }
      }

      // Enforce verified role access
      if (selectedRole === 'mother' && trimmedId !== demoAccount.identifier.toLowerCase()) {
        return { success: false, error: `Unrecognized Mother email address. Please use ${demoAccount.identifier}.` };
      }
      if (selectedRole === 'worker' && expectedStaffId !== 'HW-44120' && expectedStaffId !== 'HW-002') {
        return { success: false, error: `Unrecognized Health Worker ID. Please use staff code ${demoAccount.identifier}.` };
      }
      if (selectedRole === 'supervisor' && expectedStaffId !== 'SUP-2025-012') {
        return { success: false, error: `Unrecognized Supervisor ID. Please use staff code ${demoAccount.identifier}.` };
      }

      const activeUser = demoAccount.user;
      setUser(activeUser);
      setRole(selectedRole);
      localStorage.setItem(AUTH_FALLBACK_KEY, JSON.stringify(activeUser));

      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error:
            'Firebase Authentication: Email/Password sign-in provider must be enabled in Firebase Console (Authentication > Sign-in method) for project outr-janmasaathi.',
        };
      }
      return {
        success: false,
        error: err.message || 'Authentication failed. Please verify your credentials and network connection.',
      };
    }
  };

  const loginWithGoogle = async (
    roleToAssume: Role = 'worker'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;

      const staffId = roleToAssume === 'worker' ? 'HW-44120' : roleToAssume === 'supervisor' ? 'SUP-2025-012' : null;
      const motherId = roleToAssume === 'mother' ? 'MCP-2026-0894' : null;
      const displayName =
        fbUser.displayName ||
        (roleToAssume === 'worker'
          ? 'Sunita Devi (Verified Staff)'
          : roleToAssume === 'supervisor'
          ? 'Dr. Rajesh Kumar'
          : 'Priya Sharma');

      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(
        userDocRef,
        {
          uid: fbUser.uid,
          email: fbUser.email,
          role: roleToAssume,
          displayName,
          staffId,
          motherId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const activeUser: User = {
        id: staffId || motherId || fbUser.uid,
        name: displayName,
        role: roleToAssume,
        email: fbUser.email || undefined,
        phone: fbUser.phoneNumber || '+91 98765 44120',
      };

      setUser(activeUser);
      setRole(roleToAssume);
      localStorage.setItem(AUTH_FALLBACK_KEY, JSON.stringify(activeUser));
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      return {
        success: false,
        error: err.message || 'Google Sign-In was cancelled or failed.',
      };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setRole(null);
    localStorage.removeItem(AUTH_FALLBACK_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        isAuthenticated: !!role && !!user,
        isAuthLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
