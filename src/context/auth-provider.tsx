"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Define a hardcoded master token for the prototype
const MASTER_TOKEN = "TURNOMAESTRO2024";
const TOKEN_KEY = "app-auth-token";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => void;
  logout: () => void;
  generateToken: () => string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for the token in localStorage on initial load
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && storedToken === MASTER_TOKEN) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token: string) => {
    setError(null);
    if (token === MASTER_TOKEN) {
      localStorage.setItem(TOKEN_KEY, token);
      setIsAuthenticated(true);
    } else {
      setError("El token de acceso es incorrecto.");
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
  }, []);
  
  const generateToken = useCallback(() => {
    // In a real app, this would generate a unique, secure token.
    // For this prototype, we just return the master token.
    return MASTER_TOKEN;
  }, []);


  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    generateToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
