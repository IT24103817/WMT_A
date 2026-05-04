/**
 * AuthContext — global login state for the mobile app.
 * ====================================================
 * Module owner: Group (Auth)
 *
 * What it provides:
 *   - user / token   (current logged-in user + JWT)
 *   - loading        (true on cold start while we hydrate from AsyncStorage)
 *   - login()        wraps POST /api/auth/login + persists token
 *   - register()     wraps POST /api/auth/register + persists token
 *   - logout()       clears AsyncStorage + state
 *
 * Why AsyncStorage?
 *   So the user stays logged in across app reloads. On launch we read the
 *   stored token, call /api/auth/me to refresh the user, and either
 *   restore the session or wipe it (if the token expired).
 *
 * Used by:
 *   - RootNavigator (decides Auth stack vs CustomerTabs/AdminTabs)
 *   - every protected screen via useAuth()
 *   - axios interceptor in api/client.js (which also reads the token)
 */

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
