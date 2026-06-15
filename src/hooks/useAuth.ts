import { useState, useCallback } from 'react';
import {
  isPasswordSet,
  isLoggedIn,
  checkPassword,
  setPassword as authSetPassword,
  login as authLogin,
  logout as authLogout,
} from '../lib/auth';

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isLoggedIn());
  const [passwordSet, setPasswordSetState] = useState<boolean>(() => isPasswordSet());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const ok = await checkPassword(password);
      if (ok) {
        authLogin();
        setLoggedIn(true);
        return true;
      } else {
        setError('Contraseña incorrecta');
        return false;
      }
    } catch {
      setError('Error al verificar la contraseña');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setupPassword = useCallback(async (password: string, confirm: string): Promise<boolean> => {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await authSetPassword(password);
      authLogin();
      setPasswordSetState(true);
      setLoggedIn(true);
      return true;
    } catch {
      setError('Error al configurar la contraseña');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (current: string, newPass: string, confirm: string): Promise<boolean> => {
    if (newPass !== confirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (newPass.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await checkPassword(current);
      if (!ok) {
        setError('Contraseña actual incorrecta');
        return false;
      }
      await authSetPassword(newPass);
      return true;
    } catch {
      setError('Error al cambiar la contraseña');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setLoggedIn(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loggedIn,
    passwordSet,
    error,
    loading,
    login,
    setupPassword,
    changePassword,
    logout,
    clearError,
  };
}
