import React from 'react';
import { LayoutDashboard, Server, Activity, Terminal, Settings, Box, Cloud, Shield, GitBranch, Zap, LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'logs', label: 'Logs & Audit', icon: Terminal },
    { id: 'terraform', label: 'Terraform', icon: Cloud },
  ];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 bg-[#050505] flex flex-col z-20 px-4 py-6">
      {/* Logo Area */}
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-400 flex items-center justify-center shadow-glow">
          <Box className="text-[#050505] w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">OpsSight<span className="text-primary text-xs align-top ml-1">PRO</span></h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Visibility Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                ${isActive 
                  ? 'bg-[#15151e] text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
              </div>
              
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(99,102,241,0.6)]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-4">
        <div className="p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/5">
          <div className="bg-[#0F1115] rounded-[20px] p-4 relative overflow-hidden group cursor-pointer">
             <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/30 transition-colors"></div>
             <div className="flex items-center gap-3 mb-2 relative z-10">
               <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                 <Zap size={18} fill="currentColor" />
               </div>
               <span className="font-bold text-white text-sm">Upgrade Plan</span>
             </div>
             <p className="text-[10px] text-slate-400 relative z-10">Unlock AI forecasting & unlimited history.</p>
          </div>
        </div>

        <button className="w-full flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};