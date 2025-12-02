import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GeminiAssistant } from './components/GeminiAssistant';
import { DashboardView } from './components/views/DashboardView';
import { InfrastructureView } from './components/views/InfrastructureView';
import { ObservabilityView } from './components/views/ObservabilityView';
import { CicdView } from './components/views/CicdView';
import { SecurityView } from './components/views/SecurityView';
import { TerraformView } from './components/views/TerraformView';
import { LoginView } from './components/views/LoginView';
import { Bell, Search, Settings, ChevronDown, Loader2, Sun, Moon } from 'lucide-react';
import { simulation } from './services/simulation';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading, isDemoMode, theme, toggleTheme } = useAuth();

  useEffect(() => {
    // Only run simulation if we are in demo mode
    if (isDemoMode) {
      simulation.start();
    } else {
      simulation.stop();
    }
    return () => simulation.stop();
  }, [isDemoMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'infrastructure': return <InfrastructureView />;
      case 'observability': return <ObservabilityView />;
      case 'cicd': return <CicdView />;
      case 'security': return <SecurityView />;
      case 'terraform': return <TerraformView />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-300">
      {/* Floating Orbs Background Effect (Dark Mode only) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]"></div>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 ml-72 h-screen flex flex-col relative z-10">
        
        {/* Modern Header */}
        <header className="h-24 flex justify-between items-center px-8 shrink-0">
          {/* Search Pill */}
          <div className="relative group w-96">
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 rounded-full flex items-center px-4 py-2.5 shadow-sm dark:shadow-lg">
               <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-3" />
               <input 
                 type="text" 
                 placeholder="Search assets, logs, or traces..." 
                 className="bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white w-full placeholder:text-slate-400 dark:placeholder:text-slate-600"
               />
               <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 font-mono">⌘K</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-[10px] font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent px-2 py-1 rounded text-slate-500">
              {isDemoMode ? 'SIMULATION MODE' : 'PRODUCTION'}
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User Profile Pill */}
            <div className="pl-6 border-l border-slate-200 dark:border-white/5">
              <button className="flex items-center gap-3 p-1 pr-4 rounded-full bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/5 hover:border-primary/20 dark:hover:border-white/10 transition-colors shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent p-[1px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#050505] flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                        {user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</span>
                   <span className="text-[10px] text-primary font-medium uppercase">{user.role}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderContent()}
          </div>
        </div>

        <GeminiAssistant />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;