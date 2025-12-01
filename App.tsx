import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GeminiAssistant } from './components/GeminiAssistant';
import { DashboardView } from './components/views/DashboardView';
import { InfrastructureView } from './components/views/InfrastructureView';
import { ObservabilityView } from './components/views/ObservabilityView';
import { CicdView } from './components/views/CicdView';
import { SecurityView } from './components/views/SecurityView';
import { TerraformView } from './components/views/TerraformView';
import { Bell, Search, Command, Zap } from 'lucide-react';
import { simulation } from './services/simulation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Start the simulation engine automatically for "Plug and Play" experience
    simulation.start();
    
    // Cleanup on unmount
    return () => simulation.stop();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'observability':
        return <ObservabilityView />;
      case 'cicd':
        return <CicdView />;
      case 'security':
        return <SecurityView />;
      case 'terraform':
        return <TerraformView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
               <Command className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-slate-300">Module Under Construction</h3>
            <p className="max-w-md text-center text-sm">The <span className="text-primary font-mono">{activeTab}</span> module is currently being built. Check back for updates or ask OpsSight AI for a simulation.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-sm font-medium text-slate-500">Platform</span>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-medium text-slate-200 capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources (Cmd+K)" 
                className="bg-slate-900 border border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all w-64 placeholder:text-slate-600"
              />
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-slate-950"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            
            <button className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded-full transition-colors pr-3 border border-transparent hover:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="font-bold text-xs">JD</span>
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-xs font-medium text-slate-200 leading-none mb-1">Jane Doe</span>
                <span className="text-[10px] text-slate-500 leading-none">Platform Eng.</span>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {renderContent()}
          </div>
        </div>

        {/* AI Assistant - Always visible */}
        <GeminiAssistant />
      </main>
    </div>
  );
};

export default App;