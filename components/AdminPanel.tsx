
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monetization' | 'system'>('dashboard');
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState({ gross: 0, houseNet: 0 });
  const { streams } = useData();

  const fetchSysInfo = async () => {
      try {
          const res = await fetch(`/api/system/info`);
          if (res.ok) setSysInfo(await res.json());
          
          const rev = await fetch(`/api/admin/stats/revenue`);
          if (rev.ok) setRevenueStats(await rev.json());
      } catch (e) {}
  };

  useEffect(() => {
      fetchSysInfo();
      const interval = setInterval(fetchSysInfo, 10000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-white/5 p-8 flex flex-col z-20">
          <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl">
                  <i className="fa-solid fa-terminal"></i>
              </div>
              <h1 className="text-white font-black text-xl tracking-tighter uppercase">Root<span className="text-indigo-500">Node</span></h1>
          </div>
          <nav className="space-y-3 flex-1">
              {['dashboard', 'monetization', 'system'].map(id => (
                  <button key={id} onClick={() => setActiveTab(id as any)} className={`w-full text-left px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                      {id}
                  </button>
              ))}
          </nav>
          <button onClick={onExit} className="mt-8 py-4 text-rose-500 font-black text-[10px] uppercase border border-rose-500/20 rounded-2xl">Log Out</button>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-screen overflow-y-auto p-12 no-scrollbar">
          <header className="mb-12 flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-white capitalize">{activeTab}</h2>
                <div className="flex items-center gap-3 mt-3">
                    <div className={`w-2 h-2 rounded-full ${sysInfo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {sysInfo ? `Node Active @ ${sysInfo.domain || 'kawdulive.qzz.io'} (${sysInfo.serverIp || '139.99.72.98'}):${sysInfo.port}` : 'Backend Unreachable'}
                    </span>
                </div>
              </div>
          </header>

          {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl">
                      <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Live Streams</p>
                      <h4 className="text-4xl font-black text-white">{streams.length}</h4>
                  </div>
                  <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl">
                      <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Gross Volume</p>
                      <h4 className="text-4xl font-black text-white">💎 {revenueStats.gross.toLocaleString()}</h4>
                  </div>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl shadow-xl">
                      <p className="text-indigo-400 text-[10px] font-black uppercase mb-2">House Net</p>
                      <h4 className="text-4xl font-black text-white">💎 {revenueStats.houseNet.toLocaleString()}</h4>
                  </div>
              </div>
          )}

          {activeTab === 'system' && sysInfo && (
              <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <i className="fa-solid fa-server text-indigo-400"></i>
                        <span>Dedicated Node Architecture</span>
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                        ONLINE • {sysInfo.domain || 'kawdulive.qzz.io'}
                      </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-sm">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">Server Domain & IP</p>
                          <p className="text-emerald-400 font-bold text-base">{sysInfo.domain || 'kawdulive.qzz.io'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">IP: {sysInfo.serverIp || '139.99.72.98'}</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">Web App Service</p>
                          <p className="text-white font-bold text-base">Port {sysInfo.port || 3000}</p>
                          <p className="text-[10px] text-slate-500 font-sans">HTTP / HTTPS proxy</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">Admin Portal Service</p>
                          <p className="text-indigo-400 font-bold text-base">Port {sysInfo.adminPort || 3001}</p>
                          <p className="text-[10px] text-slate-500 font-sans">Dedicated standalone console</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">CoTURN WebRTC Relay</p>
                          <p className="text-cyan-400 font-bold text-sm">139.99.72.98:3478</p>
                          <p className="text-[10px] text-slate-500 font-sans">UDP/TCP STUN & TURN Relay</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">Database Host</p>
                          <p className="text-amber-400 font-bold text-sm">139.99.72.98:3306</p>
                          <p className="text-[10px] text-slate-500 font-sans">MySQL / Memory Fallback</p>
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                          <p className="text-slate-500 text-[10px] font-black uppercase">Runtime & Uptime</p>
                          <p className="text-white font-bold text-sm">Node {sysInfo.nodeVersion}</p>
                          <p className="text-[10px] text-slate-400 font-sans">{Math.floor(sysInfo.uptime / 60)} mins active ({sysInfo.platform})</p>
                      </div>
                  </div>
              </div>
          )}
      </main>
    </div>
  );
};

export default AdminPanel;
