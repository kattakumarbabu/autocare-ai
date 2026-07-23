import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => tokenStorage.getUser());
  const [token,   setToken]   = useState(() => tokenStorage.getToken());
  const [loading, setLoading] = useState(true);

  // On mount — verify token is still valid by fetching /api/auth/me
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }

      try {
        const { data } = await axiosInstance.get('/auth/me');
        setUser(data.data.user);
        tokenStorage.setUser(data.data.user);
      } catch {
        // Token invalid / expired
        tokenStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = data.data;
    tokenStorage.setToken(newToken);
    tokenStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await axiosInstance.post('/auth/register', { name, email, password });
    const { token: newToken, user: newUser } = data.data;
    tokenStorage.setToken(newToken);
    tokenStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch { /* ignore */ }
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
