import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const authService = {
  
  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Try to fetch profile details
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
    
    // Dynamically redirect back to the current domain/port
    // ensure no trailing slash, though origin usually doesn't have one
    const redirectTo = window.location.origin;

    console.log(`[Auth] Sending Magic Link with redirect URL: ${redirectTo}`);

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (error) throw error;
    return true;
  },

  async signInWithGoogle() {
    if (!supabase) throw new Error("Supabase not configured");
    
    const redirectTo = window.location.origin;
    console.log(`[Auth] Initiating Google OAuth with redirect URL: ${redirectTo}`);

    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo
      }
    });
    if (error) throw error;
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('opssight_session');
  }
};