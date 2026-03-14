import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi, getMeApi } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('primetrade_token');
    if (token) {
      getMeApi()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => {
          localStorage.removeItem('primetrade_token');
          localStorage.removeItem('primetrade_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    const { token, user: u } = data.data;
    localStorage.setItem('primetrade_token', token);
    localStorage.setItem('primetrade_user', JSON.stringify(u));
    setUser(u);
    navigate('/dashboard', { replace: true });
    return u;
  };

  const register = async (name, email, password) => {
    const { data } = await registerApi(name, email, password);
    const { token, user: u } = data.data;
    localStorage.setItem('primetrade_token', token);
    localStorage.setItem('primetrade_user', JSON.stringify(u));
    setUser(u);
    navigate('/dashboard', { replace: true });
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('primetrade_token');
    localStorage.removeItem('primetrade_user');
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
