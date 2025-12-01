
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Box, Mail, Chrome, ArrowRight, ShieldCheck, Terminal, Cpu, PlayCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginView: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, enableDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch (err) {
      alert("Login failed. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left Side: Pitch */}
        <div className="space-y-8 hidden md:block">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-slate-400 flex items-center justify-center shadow-glow mb-8">
             <Box className="text-[#050505] w-8 h-8" />
           </div>
           <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
             Visibility for your <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Modern Infrastructure.</span>
           </h1>
           <p className="text-lg text-slate-400 max-w-md">
             Monitor Kubernetes, Terraform, and Pipelines in one unified Command Center. 
             AI-powered insights included.
           </p>
           
           <div className="grid grid-cols-2 gap-4 mt-8">
             <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <Terminal className="text-emerald-400 mb-2" />
                <h3 className="font-semibold text-white">Live Telemetry</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time logs & metrics</p>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <Cpu className="text-accent mb-2" />
                <h3 className="font-semibold text-white">AI Analysis</h3>
                <p className="text-xs text-slate-500 mt-1">Gemini-powered debugging</p>
             </div>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <Card className="w-full max-w-md mx-auto bg-[#0F1115]/80 backdrop-blur-xl border-white/10 shadow-2xl relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome to OpsSight</h2>
            <p className="text-sm text-slate-400 mt-2">Sign in to access your production dashboard</p>
          </div>

          {sent ? (
             <div className="text-center py-8">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Mail className="text-emerald-500 w-8 h-8" />
               </div>
               <h3 className="text-white font-semibold">Check your email</h3>
               <p className="text-slate-400 text-sm mt-2">We sent a magic link to {email}</p>
               <button onClick={() => setSent(false)} className="mt-6 text-primary text-sm hover:underline">Try another email</button>
             </div>
          ) : (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050505] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : 'Sign in with Email'} <ArrowRight size={16} />
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0F1115] px-2 text-slate-500">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => loginWithGoogle()}
                  className="py-2.5 px-4 bg-[#050505] border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Chrome size={18} /> Google
                </button>
                <button 
                   disabled
                   className="py-2.5 px-4 bg-[#050505] border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                   title="Coming Soon"
                >
                  <span className="font-mono font-bold"></span> Apple
                </button>
              </div>

              <div className="pt-6 border-t border-slate-800/50">
                <button 
                  onClick={enableDemoMode}
                  className="w-full py-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary hover:bg-primary/20 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <PlayCircle size={18} className="group-hover:scale-110 transition-transform"/> 
                  Launch Home Lab Demo
                </button>
                <p className="text-center text-[10px] text-slate-500 mt-2">
                  No account required. Runs in browser memory.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
