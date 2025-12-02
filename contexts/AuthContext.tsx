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
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('opssight_theme') as 'dark' | 'light' || 'dark';
    }
    return 'dark';
  });
  
  // Check environment for Cloud Config
  const hasCloudConfig = isSupabaseConfigured();
  const [isDemoMode, setIsDemoMode] = useState(!hasCloudConfig);

  // Apply Theme Side Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('opssight_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await checkUser();
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for Auth changes safely
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[Auth] AuthStateChange: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session?.user && mounted) {
            await checkUser(); 
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      if (!isDemoMode && hasCloudConfig) {
        const u = await authService.getCurrentUser();
        if (u) {
          setUser(u);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("[Auth] Check failed:", error);
      setUser(null);
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
      setIsDemoMode(true);
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
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
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, logout, isDemoMode, enableDemoMode, theme, toggleTheme }}>
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