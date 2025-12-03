import React from 'react';
import { LayoutDashboard, Server, Activity, Terminal, Settings, Box, Cloud, Shield, GitBranch, Zap, LogOut, ChevronRight, FolderGit2, Rocket, CloudDrizzle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'deployments', label: 'Deployments', icon: Rocket },
    { id: 'cloud', label: 'Cloud Visibility', icon: CloudDrizzle },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'gitops', label: 'GitOps', icon: FolderGit2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'logs', label: 'Logs & Audit', icon: Terminal },
    { id: 'terraform', label: 'Terraform', icon: Cloud },
  ];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 bg-slate-50 dark:bg-[#050505] border-r border-slate-200 dark:border-white/5 flex flex-col z-20 px-4 py-6 transition-colors duration-300">
      {/* Logo Area */}
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent dark:from-white dark:to-slate-400 flex items-center justify-center shadow-lg dark:shadow-glow text-white dark:text-[#050505]">
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">OpsSight<span className="text-primary text-xs align-top ml-1">PRO</span></h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">Visibility Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Main Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                ${isActive 
                  ? 'bg-white dark:bg-[#15151e] text-slate-900 dark:text-white shadow-sm dark:shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
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
        <div className="p-1 rounded-3xl bg-gradient-to-br from-slate-200/50 to-transparent dark:from-white/10 border border-slate-200 dark:border-white/5">
          <div className="bg-white dark:bg-[#0F1115] rounded-[20px] p-4 relative overflow-hidden group cursor-pointer shadow-sm">
             <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors"></div>
             <div className="flex items-center gap-3 mb-2 relative z-10">
               <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                 <Zap size={18} fill="currentColor" />
               </div>
               <span className="font-bold text-slate-900 dark:text-white text-sm">Upgrade Plan</span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 relative z-10">Unlock AI forecasting & unlimited history.</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};