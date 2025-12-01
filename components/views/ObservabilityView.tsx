import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { storage } from '../../services/storage';
import { Search, Filter, Download, Activity, Clock, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const traceData = [
  { name: '10:00', latency: 120, errors: 2 },
  { name: '10:05', latency: 132, errors: 0 },
  { name: '10:10', latency: 101, errors: 1 },
  { name: '10:15', latency: 450, errors: 12 }, // Spikes
  { name: '10:20', latency: 140, errors: 3 },
  { name: '10:25', latency: 125, errors: 0 },
  { name: '10:30', latency: 130, errors: 1 },
];

export const ObservabilityView: React.FC = () => {
  const logs = storage.getLogs();
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(filter.toLowerCase()) || 
    l.source.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Observability</h2>
          <p className="text-slate-400 text-sm">Metrics, Logs, and Traces correlation</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-2 text-xs font-medium bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center gap-2">
             <Clock size={14} /> Last 1 Hour
           </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> API Latency (p95)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">Live</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traceData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-error" /> Error Rate
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.2}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Logs Explorer */}
      <Card className="flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">Log Explorer</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-300 focus:outline-none focus:border-primary w-64"
              />
            </div>
            <button className="p-1.5 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
              <Filter size={14} />
            </button>
            <button className="p-1.5 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Trace ID</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 font-mono text-xs transition-colors cursor-pointer group">
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`
                      ${log.level === 'error' || log.level === 'fatal' ? 'text-error' : 
                        log.level === 'warn' ? 'text-warning' : 
                        log.level === 'debug' ? 'text-secondary' : 'text-success'}
                    `}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-primary">{log.source}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-600 group-hover:text-accent transition-colors">
                    {log.traceId || '-'}
                  </td>
                  <td className="px-4 py-2 text-slate-300">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
