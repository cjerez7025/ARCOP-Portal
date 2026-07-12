// ============================================================
// src/context/AuthContext.jsx
// Contexto global de autenticación Firebase Auth.
// Provee: user, loading, login, logout
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setUserRole(tokenResult.claims.role || null);
        } catch {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, [auth]);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}