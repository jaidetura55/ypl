import React, { useState, useEffect, useRef } from 'react';

export interface ModerationLog {
  id: string;
  timestamp: string;
  roomId: string;
  streamTitle?: string;
  hostName: string;
  userName?: string | null;
  source: 'visual_sentinel' | 'chat_wordlist';
  violationType: string;
  prohibitedItemOrWord: string;
  details: string;
  confidence: number;
  severity: 'critical' | 'high' | 'warning' | 'info';
  actionTaken: string;
  status: string;
}

export default function ModerationActivityTab() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'visual_sentinel' | 'chat_wordlist'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'warning'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const autoRefreshTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/moderation/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch {
      // Fallback: check localStorage
      const local = localStorage.getItem('youngpapi_moderation_logs');
      if (local) {
        try {
          setLogs(JSON.parse(local));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchLogs();
      }, 3000);
    }

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all moderation activity logs?')) return;
    try {
      await fetch('/api/admin/moderation/logs', { method: 'DELETE' });
      setLogs([]);
      localStorage.removeItem('youngpapi_moderation_logs');
      showToast('Moderation activity logs cleared.');
    } catch {
      setLogs([]);
      showToast('Logs cleared locally.');
    }
  };

  const handleSimulateViolation = async (
    type: 'smoking' | 'vaping' | 'knife' | 'drugs' | 'middle_finger' | 'bad_word'
  ) => {
    const sampleRooms = [
      { id: 'room_live_7829', title: 'Night Lounge Chill & Acoustic Vibes', host: 'Maya Lin' },
      { id: 'room_pk_5502', title: 'Mega PK Battle Championship', host: 'Alex Rivers' },
      { id: 'room_stream_9912', title: 'K-Pop Dance & Chat', host: 'Sarah Blade' },
      { id: 'stream-8821', title: 'Late Night Talk Show', host: 'Leo Vance' }
    ];
    const targetRoom = sampleRooms[Math.floor(Math.random() * sampleRooms.length)];

    let payload: Partial<ModerationLog> = {};

    if (type === 'smoking') {
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: null,
        source: 'visual_sentinel',
        violationType: 'smoking',
        prohibitedItemOrWord: 'Smoking & Tobacco Cigarette',
        details: 'Cigarette stick ignited and held to lips on live camera feed',
        confidence: Math.floor(Math.random() * 8) + 91,
        severity: 'high',
        actionTaken: 'auto_blurred',
        status: 'ENFORCED'
      };
    } else if (type === 'vaping') {
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: null,
        source: 'visual_sentinel',
        violationType: 'vaping',
        prohibitedItemOrWord: 'Vaping & E-Cigarette Device',
        details: 'Vapor mod emission and dense vapor clouds detected on live stream',
        confidence: Math.floor(Math.random() * 10) + 85,
        severity: 'warning',
        actionTaken: 'warning_shown',
        status: 'WARNING_ISSUED'
      };
    } else if (type === 'knife') {
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: null,
        source: 'visual_sentinel',
        violationType: 'knife',
        prohibitedItemOrWord: 'Holding Sharp Knife / Tactical Blade',
        details: 'High-contrast sharp metallic blade brandished toward camera lens',
        confidence: 97,
        severity: 'critical',
        actionTaken: 'stream_terminated',
        status: 'STREAM_TERMINATED_BANNED'
      };
    } else if (type === 'drugs') {
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: null,
        source: 'visual_sentinel',
        violationType: 'drugs',
        prohibitedItemOrWord: 'Drug Consumption / Narcotics',
        details: 'Suspicious pill ingestion and illegal narcotic paraphernalia detected',
        confidence: 95,
        severity: 'critical',
        actionTaken: 'stream_terminated',
        status: 'STREAM_TERMINATED_BANNED'
      };
    } else if (type === 'middle_finger') {
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: null,
        source: 'visual_sentinel',
        violationType: 'middle_finger',
        prohibitedItemOrWord: 'Offensive Gesture (Middle Finger / Fuck)',
        details: '3D skeletal hand posture detected extended middle finger towards camera',
        confidence: 96,
        severity: 'high',
        actionTaken: 'auto_blurred',
        status: 'ENFORCED'
      };
    } else {
      // Bad word
      const words = ['"fuck"', '"babi"', '"anjing"', '"kontol"', '"tangina"', '"du ma"'];
      const chosen = words[Math.floor(Math.random() * words.length)];
      payload = {
        roomId: targetRoom.id,
        streamTitle: targetRoom.title,
        hostName: targetRoom.host,
        userName: 'Viewer_' + Math.floor(100 + Math.random() * 900),
        source: 'chat_wordlist',
        violationType: 'bad_word',
        prohibitedItemOrWord: chosen,
        details: `Prohibited multi-language term ${chosen} intercepted in live room chat`,
        confidence: 100,
        severity: 'warning',
        actionTaken: 'censored',
        status: 'CENSORED'
      };
    }

    try {
      const res = await fetch('/api/admin/moderation/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(prev => [data.log, ...prev]);
        showToast(`Simulated violation logged: ${payload.prohibitedItemOrWord}`);
      }
    } catch {
      showToast('Network error logging simulation.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `moderation_activity_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported moderation logs to JSON');
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Room ID', 'Stream Title', 'Host Name', 'User', 'Source', 'Prohibited Item / Word', 'Severity', 'Confidence', 'Action Taken', 'Status'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      l.roomId,
      `"${(l.streamTitle || '').replace(/"/g, '""')}"`,
      `"${l.hostName.replace(/"/g, '""')}"`,
      `"${(l.userName || 'N/A').replace(/"/g, '""')}"`,
      l.source,
      `"${l.prohibitedItemOrWord.replace(/"/g, '""')}"`,
      l.severity,
      `${l.confidence}%`,
      l.actionTaken,
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `moderation_activity_logs_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported moderation logs to CSV');
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = log.roomId.toLowerCase().includes(q);
      const matchHost = log.hostName.toLowerCase().includes(q);
      const matchUser = (log.userName || '').toLowerCase().includes(q);
      const matchItem = log.prohibitedItemOrWord.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchRoom && !matchHost && !matchUser && !matchItem && !matchDetails) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalViolations = logs.length;
  const visualViolations = logs.filter(l => l.source === 'visual_sentinel').length;
  const chatViolations = logs.filter(l => l.source === 'chat_wordlist').length;
  const criticalTerminations = logs.filter(l => l.severity === 'critical' || l.actionTaken === 'stream_terminated').length;

  const formatTimeAgo = (isoStr: string) => {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <i className="fa-solid fa-circle-check text-emerald-400"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER & TITLE */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <i className="fa-solid fa-list-check text-rose-400 text-lg"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Moderation Activity</h1>
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE AUDIT STREAM</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time incident log of prohibited items detected on camera and filtered chat profanities across live rooms.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <i className={`fa-solid fa-rotate ${autoRefresh ? 'animate-spin' : ''}`}></i>
            <span>{autoRefresh ? 'Auto-Refresh (3s)' : 'Paused'}</span>
          </button>

          {/* Refresh Manual Button */}
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Refresh now"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-file-csv text-emerald-400"></i>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-file-code text-cyan-400"></i>
            <span>JSON</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-trash-can"></i>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Violations</p>
            <p className="text-2xl font-black text-white mt-1">{totalViolations}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Recorded in session</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i className="fa-solid fa-shield-halved text-xl"></i>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visual Sentinel</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{visualViolations}</p>
            <p className="text-[11px] text-rose-300/70 mt-0.5">Smoking, Knife, Gesture, etc.</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <i className="fa-solid fa-video text-xl"></i>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat Wordlist</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{chatViolations}</p>
            <p className="text-[11px] text-amber-300/70 mt-0.5">Censored / Blocked words</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <i className="fa-solid fa-comment-slash text-xl"></i>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Bans</p>
            <p className="text-2xl font-black text-red-500 mt-1">{criticalTerminations}</p>
            <p className="text-[11px] text-red-400/70 mt-0.5">Stream ended & banned</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <i className="fa-solid fa-gavel text-xl"></i>
          </div>
        </div>
      </div>

      {/* QUICK INJECTION SIMULATION DOCK */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-4 rounded-2xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-flask-vial text-indigo-400"></i>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Test Violation Simulator:</h2>
              <p className="text-[11px] text-slate-400">Simulate incoming live stream violations to test the real-time logging pipeline</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => handleSimulateViolation('smoking')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>🚬</span>
              <span>Smoking</span>
            </button>
            <button
              onClick={() => handleSimulateViolation('vaping')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>💨</span>
              <span>Vaping</span>
            </button>
            <button
              onClick={() => handleSimulateViolation('knife')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>🔪</span>
              <span>Knife</span>
            </button>
            <button
              onClick={() => handleSimulateViolation('drugs')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>💊</span>
              <span>Drugs</span>
            </button>
            <button
              onClick={() => handleSimulateViolation('middle_finger')}
              className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>🖕</span>
              <span>Fuck Gesture</span>
            </button>
            <button
              onClick={() => handleSimulateViolation('bad_word')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>💬</span>
              <span>Bad Word</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Room ID, host, word, or item..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Channel / Source Filter */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Sources ({logs.length})
            </button>
            <button
              onClick={() => setSourceFilter('visual_sentinel')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === 'visual_sentinel' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Camera ({visualViolations})
            </button>
            <button
              onClick={() => setSourceFilter('chat_wordlist')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === 'chat_wordlist' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat Wordlist ({chatViolations})
            </button>
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e: any) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (Terminated)</option>
            <option value="high">High (Auto-Blurred)</option>
            <option value="warning">Warning (Censored / Warn)</option>
          </select>
        </div>
      </div>

      {/* REAL-TIME LOGS TABLE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700/80 text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Room ID</th>
                <th className="py-3 px-4">Host / Broadcaster</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Prohibited Item or Word</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <i className="fa-solid fa-spinner animate-spin mr-2"></i> Loading moderation logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <i className="fa-solid fa-shield-check text-3xl text-slate-600 mb-2 block"></i>
                    No moderation violation incidents matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isVisual = log.source === 'visual_sentinel';
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-300 font-semibold">{formattedTime}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="text-slate-400">{formatTimeAgo(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Room ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-lg text-[11px]">
                            {log.roomId}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(log.roomId);
                              showToast(`Copied ${log.roomId}`);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Room ID"
                          >
                            <i className="fa-solid fa-copy text-[10px]"></i>
                          </button>
                        </div>
                        {log.streamTitle && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5">
                            {log.streamTitle}
                          </div>
                        )}
                      </td>

                      {/* Host / Broadcaster */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.hostName}</div>
                        {log.userName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            User: <span className="text-amber-400 font-mono">@{log.userName}</span>
                          </div>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isVisual ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                            <i className="fa-solid fa-video text-[10px]"></i>
                            <span>Camera Sentinel</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                            <i className="fa-solid fa-comment-dots text-[10px]"></i>
                            <span>Chat Wordlist</span>
                          </span>
                        )}
                      </td>

                      {/* Prohibited Item or Word */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {log.violationType === 'smoking' && <span className="text-base">🚬</span>}
                          {log.violationType === 'vaping' && <span className="text-base">💨</span>}
                          {log.violationType === 'knife' && <span className="text-base">🔪</span>}
                          {log.violationType === 'drugs' && <span className="text-base">💊</span>}
                          {log.violationType === 'middle_finger' && <span className="text-base">🖕</span>}
                          {log.violationType === 'bad_word' && <span className="text-base">💬</span>}

                          <div>
                            <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                              {log.prohibitedItemOrWord}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                              {log.details}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.severity === 'critical' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 font-bold text-[10px] uppercase">
                            Critical
                          </span>
                        )}
                        {log.severity === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 font-bold text-[10px] uppercase">
                            High
                          </span>
                        )}
                        {log.severity === 'warning' && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-600/20 border border-yellow-500/40 text-yellow-400 font-bold text-[10px] uppercase">
                            Warning
                          </span>
                        )}
                        {log.severity === 'info' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold text-[10px] uppercase">
                            Info
                          </span>
                        )}
                      </td>

                      {/* Action Taken */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.actionTaken === 'auto_blurred' && (
                          <span className="text-rose-300 font-medium flex items-center space-x-1">
                            <i className="fa-solid fa-eye-slash text-[10px]"></i>
                            <span>Auto-Blurred</span>
                          </span>
                        )}
                        {log.actionTaken === 'stream_terminated' && (
                          <span className="text-red-400 font-bold flex items-center space-x-1">
                            <i className="fa-solid fa-ban text-[10px]"></i>
                            <span>Terminated & Ban</span>
                          </span>
                        )}
                        {log.actionTaken === 'censored' && (
                          <span className="text-amber-300 font-medium flex items-center space-x-1">
                            <i className="fa-solid fa-asterisk text-[9px]"></i>
                            <span>Censored (***)</span>
                          </span>
                        )}
                        {log.actionTaken === 'message_blocked' && (
                          <span className="text-amber-400 font-bold flex items-center space-x-1">
                            <i className="fa-solid fa-hand text-[10px]"></i>
                            <span>Message Blocked</span>
                          </span>
                        )}
                        {log.actionTaken === 'warning_shown' && (
                          <span className="text-yellow-300 font-medium flex items-center space-x-1">
                            <i className="fa-solid fa-bell text-[10px]"></i>
                            <span>Warning Issued</span>
                          </span>
                        )}
                      </td>

                      {/* Detail Inspector Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORENSIC DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <i className="fa-solid fa-fingerprint"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Incident Forensic Dossier</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Incident Time</span>
                  <p className="font-mono text-slate-200 mt-0.5">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Room ID</span>
                  <p className="font-mono text-cyan-400 font-bold mt-0.5">{selectedLog.roomId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Host / Channel</span>
                  <p className="text-white font-semibold mt-0.5">{selectedLog.hostName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">AI Confidence</span>
                  <p className="text-emerald-400 font-bold mt-0.5">{selectedLog.confidence}% Match</p>
                </div>
              </div>

              {/* Specific Trigger */}
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Prohibited Item / Term:</span>
                <p className="text-sm font-bold text-white mt-1 flex items-center space-x-2">
                  <span className="text-rose-400 font-mono">{selectedLog.prohibitedItemOrWord}</span>
                </p>
                <p className="text-slate-300 mt-1.5 leading-relaxed">{selectedLog.details}</p>
              </div>

              {/* Action Taken */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Enforcement Action:</span>
                  <p className="font-semibold text-white capitalize mt-0.5">{selectedLog.actionTaken.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Resolution Status:</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">{selectedLog.status}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/60 p-3.5 border-t border-slate-700 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
