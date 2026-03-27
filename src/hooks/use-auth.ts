/**
 * ============================================
 * HOOK DE AUTENTICACIÓN UNIFICADO
 * ============================================
 * 
 * Detecta automáticamente si estamos en modo demo o Firebase
 * y proporciona la autenticación correspondiente.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, isDemoMode } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

// Usuario demo
const demoUser = {
  uid: 'demo-user-001',
  email: 'demo@academic-tracker.com',
  displayName: 'Usuario Demo',
  photoURL: ''
};

export function useAuth() {
  const [firebaseUser, firebaseLoading, firebaseError] = isDemoMode 
    ? [null, false, null] 
    : useAuthState(auth);
  
  const [demoUserState, setDemoUserState] = useState(() => {
    if (isDemoMode) {
      // En modo demo, verificar si hay un usuario guardado
      if (typeof window !== 'undefined') {
        const savedDemoUser = localStorage.getItem('demo_user');
        return savedDemoUser ? JSON.parse(savedDemoUser) : demoUser;
      }
      return demoUser;
    }
    return null;
  });

  const [demoLoading, setDemoLoading] = useState(isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      // Simular carga inicial
      const timer = setTimeout(() => {
        setDemoLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // En modo demo, siempre hay un usuario autenticado
  const user = isDemoMode ? demoUserState : firebaseUser;
  const loading = isDemoMode ? demoLoading : firebaseLoading;
  const error = isDemoMode ? null : firebaseError;

  const signOut = async () => {
    if (isDemoMode) {
      // En modo demo, solo limpiar localStorage
      localStorage.removeItem('demo_user');
      setDemoUserState(null);
    } else if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const signInDemo = (email: string, password: string) => {
    if (isDemoMode) {
      // En modo demo, aceptar cualquier credencial
      const user = {
        uid: 'demo-user-' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        photoURL: ''
      };
      localStorage.setItem('demo_user', JSON.stringify(user));
      setDemoUserState(user);
      return true;
    }
    return false;
  };

  return { user, loading, error, signOut, signInDemo, isDemoMode };
}
