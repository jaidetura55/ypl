import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { COUNTRIES } from '../constants';
import { Stream, User } from '../types';
import PaymentGatewayTab from './admin/PaymentGatewayTab';
import PaymentsTab from './admin/PaymentsTab';
import BadWordlistTab from './admin/BadWordlistTab';
import ProhibitedContentTab from './admin/ProhibitedContentTab';
import ModerationActivityTab from './admin/ModerationActivityTab';
import LiveStreamsTab from './admin/LiveStreamsTab';
import GiftsTab from './admin/GiftsTab';

interface AdminDashboardViewProps {
  onExit: () => void;
}

export default function AdminDashboardView({ onExit }: AdminDashboardViewProps) {
  const { streams, users, endStream, updateUser, currentUser } = useData();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('youngpapi_admin_session') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'streams' | 'users' | 'gifts' | 'payment_gateway' | 'payments' | 'wordlist' | 'prohibited' | 'moderation_activity' | 'applications' | 'system'>('overview');

  // Admin Data State
  const [serverStats, setServerStats] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Applications from localStorage
  const [hostApplications, setHostApplications] = useState<any[]>([]);
  const [agencyApplications, setAgencyApplications] = useState<any[]>([]);

  // Load Host & Agency applications
  const loadApplications = () => {
    try {
      const hostAppStr = localStorage.getItem('youngpapi_host_application');
      if (hostAppStr) {
        setHostApplications([JSON.parse(hostAppStr)]);
      } else {
        setHostApplications([]);
      }

      const agencyAppStr = localStorage.getItem('youngpapi_agency_application');
      if (agencyAppStr) {
        setAgencyApplications([JSON.parse(agencyAppStr)]);
      } else {
        setAgencyApplications([]);
      }
    } catch (e) {
      console.warn('Error loading applications:', e);
    }
  };

  useEffect(() => {
    loadApplications();
    fetchServerStats();
    const interval = setInterval(fetchServerStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setServerStats(data);
      }
    } catch (e) {
      // Fallback stats computed from context
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // Send login request to backend admin endpoint
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim()
        })
      });

      if (res.ok) {
        sessionStorage.setItem('youngpapi_admin_session', 'true');
        setIsAuthenticated(true);
        showToast('Welcome, Super Administrator!');
      } else {
        // Direct credential check fallback
        if (usernameInput.trim() === 'admin' && passwordInput.trim() === 'admin123') {
          sessionStorage.setItem('youngpapi_admin_session', 'true');
          setIsAuthenticated(true);
          showToast('Welcome, Super Administrator!');
        } else {
          setLoginError('Invalid username or password. Default is admin / admin123');
        }
      }
    } catch (err) {
      // Direct local fallback
      if (usernameInput.trim() === 'admin' && passwordInput.trim() === 'admin123') {
        sessionStorage.setItem('youngpapi_admin_session', 'true');
        setIsAuthenticated(true);
        showToast('Welcome, Super Administrator!');
      } else {
        setLoginError('Invalid username or password. Default is admin / admin123');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('youngpapi_admin_session');
    setIsAuthenticated(false);
  };

  // Actions
  const handleForceEndStream = (streamId: string, broadcasterName: string) => {
    if (confirm(`Are you sure you want to force terminate the live stream for ${broadcasterName}?`)) {
      endStream(streamId);
      showToast(`Stream "${broadcasterName}" has been terminated by Admin.`);
    }
  };

  const handleToggleVerifyUser = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { isVerified: !currentStatus });
    showToast(`User verification status updated to ${!currentStatus ? 'VERIFIED' : 'UNVERIFIED'}`);
  };

  const handleAddDiamonds = (userId: string, currentDiamonds: number = 0, amount: number = 1000) => {
    updateUser(userId, { diamonds: (currentDiamonds || 0) + amount });
    showToast(`Added +${amount.toLocaleString()} Diamonds to user.`);
  };

  const handleApproveHost = (appData: any) => {
    const updated = { ...appData, status: 'approved', reviewedAt: new Date().toISOString() };
    localStorage.setItem('youngpapi_host_application', JSON.stringify(updated));
    setHostApplications([updated]);
    showToast('Host application approved! User is now a Verified Host.');
  };

  const handleRejectHost = (appData: any) => {
    const updated = { ...appData, status: 'rejected', reviewedAt: new Date().toISOString() };
    localStorage.setItem('youngpapi_host_application', JSON.stringify(updated));
    setHostApplications([updated]);
    showToast('Host application marked as rejected.');
  };

  const handleApproveAgency = (appData: any) => {
    const updated = { ...appData, status: 'approved', reviewedAt: new Date().toISOString() };
    localStorage.setItem('youngpapi_agency_application', JSON.stringify(updated));
    setAgencyApplications([updated]);
    showToast('Agency application approved! Agency is now officially certified.');
  };

  const handleRejectAgency = (appData: any) => {
    const updated = { ...appData, status: 'rejected', reviewedAt: new Date().toISOString() };
    localStorage.setItem('youngpapi_agency_application', JSON.stringify(updated));
    setAgencyApplications([updated]);
    showToast('Agency application marked as rejected.');
  };

  // Filtered users list
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    u.id.includes(userSearchQuery)
  );

  // ==========================================
  // VIEW 1: ADMIN LOGIN PAGE (If not logged in)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 text-white p-4 font-sans select-none overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
              <i className="fa-solid fa-shield-halved text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              YoungPapi <span className="text-indigo-400">Admin</span> Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Administrator & Operations Dashboard (Port 3001)
            </p>
          </div>

          {/* Quick Notice Banner with default credentials */}
          <div className="mb-6 p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl flex items-start gap-3">
            <i className="fa-solid fa-circle-info text-indigo-400 text-sm mt-0.5"></i>
            <div className="text-left text-xs">
              <span className="font-bold text-indigo-200 block">Default Admin Credentials</span>
              <span className="text-slate-300 font-mono text-[11px]">
                User: <b className="text-white">admin</b> | Pass: <b className="text-white">admin123</b>
              </span>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="admin123"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Quick Fill Button */}
            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('admin');
                  setPasswordInput('admin123');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Quick Fill Defaults
              </button>
              <span className="text-[10px] text-slate-500 font-mono">Port 3000 & 3001 Dual-Sync</span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin"></i> Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-right-to-bracket"></i> Enter Admin Console
                </span>
              )}
            </button>
          </form>

          {/* Return to App */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Skip Admin & Return to YoungPapi Live Web App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  const totalDiamondsInCirculation = users.reduce((acc, u) => acc + (u.diamonds || 0), 0);
  const totalBeansInCirculation = users.reduce((acc, u) => acc + (u.beans || 0), 0);
  const activeStreamsCount = streams.length;
  const totalUsersCount = users.length;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-white font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[300] bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-indigo-400/30 flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navigation Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <i className="fa-solid fa-shield-halved text-lg text-white"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">YoungPapi Admin Console</h1>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Port 3000 (App): LIVE
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Port 3001 (Admin API): ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open YoungPapi Live user app"
          >
            <i className="fa-solid fa-play text-indigo-400 text-[10px]"></i>
            <span>Switch to User Web App</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl border border-red-800/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-pie w-4 text-center"></i>
            <span>Overview & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('streams')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'streams'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-video w-4 text-center"></i>
              <span>Live Streams</span>
            </div>
            {streams.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {streams.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-users w-4 text-center"></i>
              <span>User Management</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{users.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-id-badge w-4 text-center"></i>
              <span>Host & Agency Hub</span>
            </div>
            {(hostApplications.length > 0 || agencyApplications.length > 0) && (
              <span className="bg-amber-500 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {hostApplications.length + agencyApplications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gifts')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gifts'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-gift w-4 text-center"></i>
            <span>Virtual Economy</span>
          </button>

          {/* Payment Gateway (ToyyibPay FPX, GrabPay, HTX Crypto) */}
          <button
            onClick={() => setActiveTab('payment_gateway')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payment_gateway'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-network-wired w-4 text-center text-cyan-400"></i>
            <span>Payment Gateway</span>
          </button>

          {/* Payment (Host | Agency Payouts, FPX, Crypto, International Banking) */}
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-money-bill-transfer w-4 text-center text-emerald-400"></i>
            <span>Payment</span>
          </button>

          {/* Bad Wordlist & Chat Filter */}
          <button
            onClick={() => setActiveTab('wordlist')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'wordlist'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-spell-check w-4 text-center text-amber-400"></i>
            <span>Bad Wordlist</span>
          </button>

          {/* Ban List & Prohibited Content Sentinel */}
          <button
            onClick={() => setActiveTab('prohibited')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prohibited'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-ban w-4 text-center text-red-400"></i>
            <span>Ban List & Prohibited</span>
          </button>

          {/* Moderation Activity (Real-Time Violation Incident Logs) */}
          <button
            onClick={() => setActiveTab('moderation_activity')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'moderation_activity'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-list-check w-4 text-center text-rose-400"></i>
              <span>Moderation Activity</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-server w-4 text-center"></i>
            <span>System & Ports</span>
          </button>

          {/* Quick Creator Info Box */}
          <div className="mt-auto p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-bold block mb-1">Operating Mode</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Dual Ports Active
            </span>
            <p className="text-[10px] text-slate-500 mt-1">Port 3000 Web / Port 3001 Admin</p>
          </div>
        </aside>

        {/* Central Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* TAB 1: OVERVIEW & METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">Platform Overview</h2>
                <p className="text-xs text-slate-400">Real-time telemetry and streaming activity.</p>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Streams</span>
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                      <i className="fa-solid fa-video text-xs"></i>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{activeStreamsCount}</div>
                  <span className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span> Live Broadcasts Now
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Users</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <i className="fa-solid fa-users text-xs"></i>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{totalUsersCount}</div>
                  <span className="text-[10px] text-indigo-400 font-bold mt-1 block">Active Profiles & Hosts</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diamonds Volume</span>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <i className="fa-solid fa-gem text-xs"></i>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-cyan-400">{totalDiamondsInCirculation.toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">Total Circulating Diamonds</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Beans (Earnings)</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <i className="fa-solid fa-coins text-xs"></i>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400">{totalBeansInCirculation.toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">~${(totalBeansInCirculation / 210).toFixed(2)} USD Host Value</span>
                </div>
              </div>

              {/* Quick Actions & Live Stream Spotlight */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Broadcasts Preview */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Streams Running
                    </h3>
                    <button
                      onClick={() => setActiveTab('streams')}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                    >
                      View All ({streams.length})
                    </button>
                  </div>

                  {streams.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                      <i className="fa-solid fa-video-slash text-2xl text-slate-600 mb-2"></i>
                      <p className="text-xs text-slate-500">No active live streams at the moment.</p>
                      <button
                        onClick={onExit}
                        className="mt-3 text-xs text-indigo-400 hover:underline font-bold"
                      >
                        Start a stream from User App →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {streams.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={s.broadcaster.avatar}
                              alt={s.broadcaster.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{s.title}</span>
                                {s.country && (
                                  <span className="text-[10px]">{COUNTRIES.find(c => c.code === s.country)?.flag}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Host: {s.broadcaster.name} • <span className="text-emerald-400 font-bold">{s.viewerCount} Viewers</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleForceEndStream(s.id, s.broadcaster.name)}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg text-[10px] font-bold border border-red-800/60 transition-colors"
                          >
                            Terminate
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Creator Hub Reviews */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fa-solid fa-id-badge text-amber-400"></i> Creator & Agency Applications
                    </h3>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                    >
                      Manage
                    </button>
                  </div>

                  {hostApplications.length === 0 && agencyApplications.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                      <i className="fa-solid fa-check text-2xl text-slate-600 mb-2"></i>
                      <p className="text-xs text-slate-500">All applications processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hostApplications.map((app, idx) => (
                        <div key={`h-${idx}`} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Verified Host: {app.name}</span>
                              <span className="bg-indigo-950 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                {app.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{app.experience} • {app.country}</span>
                          </div>
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveHost(app)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ))}

                      {agencyApplications.map((app, idx) => (
                        <div key={`a-${idx}`} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Agency: {app.agencyName}</span>
                              <span className="bg-purple-950 text-purple-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                {app.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{app.rosterSize} Creators • Contact: {app.contactPerson}</span>
                          </div>
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveAgency(app)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE STREAMS MODERATION */}
          {activeTab === 'streams' && (
            <LiveStreamsTab
              streams={streams}
              onForceEndStream={handleForceEndStream}
              onExitToUserApp={onExit}
              onShowToast={showToast}
            />
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">User Accounts & Balances</h2>
                  <p className="text-xs text-slate-400">Search users, modify verification, and award virtual currency.</p>
                </div>

                {/* User Search Input */}
                <div className="relative w-64">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, handle, or ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Unique ID</th>
                        <th className="py-3 px-4">Diamonds</th>
                        <th className="py-3 px-4">Beans</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.isVerified && (
                                  <i className="fa-solid fa-circle-check text-indigo-400 text-[10px]" title="Verified Creator"></i>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">{u.id}</td>
                          <td className="py-3 px-4 font-bold text-cyan-400">
                            {(u.diamonds || 0).toLocaleString()} 💎
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-400">
                            {(u.beans || 0).toLocaleString()} 🫘
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleVerifyUser(u.id, !!u.isVerified)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                u.isVerified
                                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  : 'bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900'
                              }`}
                            >
                              {u.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => handleAddDiamonds(u.id, u.diamonds, 1000)}
                              className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-lg text-[10px] font-bold transition-colors"
                              title="Award 1,000 complimentary diamonds"
                            >
                              +1K 💎
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOST & AGENCY APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Host & Agency Applications</h2>
                <p className="text-xs text-slate-400">Review creator onboarding requests and agency accreditation.</p>
              </div>

              {/* Host Verification Applications */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-user-check text-indigo-400"></i> Verified Host Applications
                </h3>

                {hostApplications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No host applications submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {hostApplications.map((app, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{app.name}</span>
                            <span className="text-xs text-slate-400">({app.email})</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              app.status === 'approved' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">Country: {app.country} • Experience: {app.experience}</p>
                          {app.socialLink && (
                            <a href={app.socialLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">
                              Portfolio / Social: {app.socialLink}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveHost(app)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              Approve Host
                            </button>
                          )}
                          {app.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectHost(app)}
                              className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold border border-red-800/60 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agency Applications */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-building text-purple-400"></i> Certified Agency Applications
                </h3>

                {agencyApplications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No agency applications submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {agencyApplications.map((app, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{app.agencyName}</span>
                            <span className="text-xs text-slate-400">(Contact: {app.contactPerson})</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              app.status === 'approved' ? 'bg-emerald-950 text-emerald-300' : 'bg-purple-950 text-purple-300'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">Country: {app.country} • Creators Managed: {app.rosterSize}</p>
                          <span className="text-xs text-slate-400">Official Email: {app.email} • Phone: {app.phone}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveAgency(app)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              Approve Agency
                            </button>
                          )}
                          {app.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectAgency(app)}
                              className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold border border-red-800/60 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: VIRTUAL ECONOMY & GIFTS */}
          {activeTab === 'gifts' && (
            <GiftsTab onShowToast={showToast} />
          )}

          {/* TAB: PAYMENT GATEWAY */}
          {activeTab === 'payment_gateway' && (
            <PaymentGatewayTab onShowToast={showToast} />
          )}

          {/* TAB: PAYMENT (HOST | AGENCY PAYOUTS) */}
          {activeTab === 'payments' && (
            <PaymentsTab
              users={users}
              streams={streams}
              updateUser={updateUser}
              onShowToast={showToast}
            />
          )}

          {/* TAB: BAD WORDLIST */}
          {activeTab === 'wordlist' && (
            <BadWordlistTab onShowToast={showToast} />
          )}

          {/* TAB: BAN LIST & PROHIBITED SENTINEL */}
          {activeTab === 'prohibited' && (
            <ProhibitedContentTab
              streams={streams}
              users={users}
              endStream={endStream}
              onShowToast={showToast}
            />
          )}

          {/* TAB: MODERATION ACTIVITY (REAL-TIME VIOLATION INCIDENTS) */}
          {activeTab === 'moderation_activity' && (
            <ModerationActivityTab />
          )}

          {/* TAB 6: SYSTEM & PORTS */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">System Infrastructure & Ports</h2>
                <p className="text-xs text-slate-400">Inspect server ports, process health, and socket listeners.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Port 3000 (React Web App)
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                      ONLINE
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div><b>Service:</b> Vite SPA + Express Proxy + WebSocket</div>
                    <div><b>PeerJS Signaling:</b> Mounted at /peerjs</div>
                    <div><b>Access:</b> AI Studio Web Preview Default</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Port 3001 (Admin Portal)
                    </h3>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div><b>Service:</b> Dedicated Admin REST API & Portal</div>
                    <div><b>Default User:</b> admin</div>
                    <div><b>Default Pass:</b> admin123</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
