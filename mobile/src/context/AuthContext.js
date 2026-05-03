import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth as authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('gm_token');
        if (t) {
          setToken(t);
          try {
            const { user } = await authApi.me();
            setUser(user);
          } catch {
            await AsyncStorage.removeItem('gm_token');
            setToken(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login({ email, password });
    await AsyncStorage.setItem('gm_token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const { token, user } = await authApi.register({ name, email, password });
    await AsyncStorage.setItem('gm_token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('gm_token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
