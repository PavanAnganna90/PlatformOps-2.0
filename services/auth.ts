import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const authService = {
  
  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Try to fetch profile details, handle error gracefully if profile table doesn't exist yet
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      return {
        id: user.id,
        name: profile?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatarUrl: profile?.avatar_url || '',
        role: profile?.role || 'viewer',
        preferences: { theme: 'dark', refreshRate: 5000 }
      };
    }
    
    return null; 
  },

  async signInWithEmail(email: string) {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return true;
  },

  async signInWithGoogle() {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('opssight_session');
  }
};