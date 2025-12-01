import React from 'react';
import { LayoutDashboard, Server, Activity, Terminal, Settings, Box, Cloud, Shield, GitBranch } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'logs', label: 'Live Logs', icon: Terminal },
    { id: 'terraform', label: 'Terraform', icon: Cloud },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-slate-800 bg-slate-950 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Activity className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            OpsSight
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">PLATFORM ENG</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-white border border-primary/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
         <div className="px-4 py-2 bg-slate-900 rounded border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-slate-300">System Online</span>
            </div>
         </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
};
