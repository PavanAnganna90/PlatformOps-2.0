import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const authService = {
  
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!supabase) return null;

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        if (error) console.debug("[Auth] getUser error:", error.message);
        return null;
      }
      
      // Try to fetch profile details, but don't fail if table is missing
      let profile = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      } catch (err) {
        console.warn("[Auth] Profile fetch failed (ignoring):", err);
      }
        
      return {
        id: user.id,
        name: profile?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatarUrl: profile?.avatar_url || '',
        role: profile?.role || 'viewer',
        preferences: { theme: 'dark', refreshRate: 5000 }
      };
    } catch (e) {
      console.error("[Auth] Unexpected error in getCurrentUser:", e);
      return null;
    }
  },

  async signInWithEmail(email: string) {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Dynamically redirect back to the current domain/port
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