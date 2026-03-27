/**
 * ============================================
 * HOOK DE ADMINISTRADOR - MODO DEMO
 * ============================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

// En modo demo, el usuario siempre es administrador
export function useAdmin() {
  const { user, isDemoMode } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // En modo demo, siempre es admin
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // En modo Firebase, verificar en la base de datos
    if (!user || !user.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Aquí iría la lógica real de Firebase
    // Por ahora, asumimos que no es admin en modo Firebase sin configuración
    setIsAdmin(false);
    setLoading(false);
  }, [user, isDemoMode]);

  return { isAdmin, loading };
}
