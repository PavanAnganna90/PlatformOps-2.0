import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check environment for Cloud Config
  // Modified to check if Supabase is actually configured (via env OR defaults)
  const hasCloudConfig = isSupabaseConfigured();
  const [isDemoMode, setIsDemoMode] = useState(!hasCloudConfig);

  useEffect(() => {
    checkUser();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      checkUser();
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      if (!isDemoMode) {
        const u = await authService.getCurrentUser();
        setUser(u);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    await authService.signInWithEmail(email);
  };

  const loginWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    if (!hasCloudConfig) {
      setIsDemoMode(true); // Fallback to demo if no config
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    // Auto-login mock user for instant gratification
    setUser({
      id: 'demo',
      name: 'Demo Engineer', 
      email: 'demo@opssight.local',
      role: 'admin',
      avatarUrl: '',
      preferences: { theme: 'dark', refreshRate: 1000 }
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, logout, isDemoMode, enableDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};