import React from 'react';
import { Card } from '../ui/Card';
import { storage } from '../../services/storage';
import { Shield, AlertOctagon, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const vulns = storage.getVulnerabilities();
  
  const criticalCount = vulns.filter(v => v.severity === 'critical').length;
  const highCount = vulns.filter(v => v.severity === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Security & Compliance</h2>
          <p className="text-slate-400 text-sm">Vulnerability Scanning and Policy Checks</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm font-medium rounded-lg flex items-center gap-2">
          <Shield size={16} /> Scan Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-error/10 to-transparent border-error/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertOctagon className="text-error w-5 h-5" />
            <h3 className="text-error font-semibold">Critical Issues</h3>
          </div>
          <p className="text-3xl font-bold text-white">{criticalCount}</p>
          <p className="text-xs text-slate-400 mt-1">Requires immediate remediation</p>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-transparent border-warning/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-warning w-5 h-5" />
            <h3 className="text-warning font-semibold">High Severity</h3>
          </div>
          <p className="text-3xl font-bold text-white">{highCount}</p>
          <p className="text-xs text-slate-400 mt-1">Patch within 7 days</p>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-success w-5 h-5" />
            <h3 className="text-success font-semibold">Compliance Score</h3>
          </div>
          <p className="text-3xl font-bold text-white">A-</p>
          <p className="text-xs text-slate-400 mt-1">CIS Benchmark: 92% Passing</p>
        </Card>
      </div>

      <h3 className="text-lg font-semibold text-white mt-4">Vulnerability Feed</h3>
      <div className="space-y-3">
        {vulns.map((v) => (
          <Card key={v.id} variant="outline" className="hover:bg-slate-800/20">
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-lg ${
                v.severity === 'critical' ? 'bg-error/10 text-error' :
                v.severity === 'high' ? 'bg-warning/10 text-warning' :
                'bg-primary/10 text-primary'
              }`}>
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                      {v.package} 
                      <span className="text-xs font-normal text-slate-500 font-mono border border-slate-700 px-1 rounded">
                        {v.cve}
                      </span>
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">{v.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${
                      v.severity === 'critical' ? 'border-error text-error bg-error/5' :
                      v.severity === 'high' ? 'border-warning text-warning bg-warning/5' :
                      'border-primary text-primary bg-primary/5'
                    }`}>
                      {v.severity}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-800">
                  <span>Detected: {new Date(v.detectedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4">
                     {v.fixVersion && (
                       <span className="text-success">Fix Available: v{v.fixVersion}</span>
                     )}
                     <button className="flex items-center gap-1 hover:text-white transition-colors">
                       Details <ExternalLink size={10} />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
