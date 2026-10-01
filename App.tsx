
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import InboxView from './components/InboxView';
import StreamingView from './components/StreamingView';
import WatchingView from './components/WatchingView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import LiveNotificationToast from './components/LiveNotificationToast';
import LiveNotificationCenterModal from './components/LiveNotificationCenterModal';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import GoogleSSOModal, { GoogleSSOButton } from './components/GoogleSSOModal';
import DailyCheckInModal, { getLocalDateString } from './components/DailyCheckInModal';
import { useData } from './contexts/DataContext';
import { Stream, User } from './types';
import { COUNTRIES } from './constants';
import AdminDashboardView from './components/AdminDashboardView';
import TopStreamersWidget from './components/TopStreamersWidget';
import PublicProfileModal from './components/PublicProfileModal';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [status, setStatus] = useState('Booting YoungPapi OS...');

  useEffect(() => {
    const checkBackend = async () => {
        try {
            const res = await fetch(`/api/system/info`);
            if (res.ok) {
                const data = await res.json();
                setSysInfo(data);
                setStatus('Neural Link Established');
            }
        } catch (e) {
            setStatus('Standalone Mode: Backend Offline');
        }
    };

    checkBackend();

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="w-32 h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-bounce">
        <i className="fa-solid fa-bolt text-5xl text-white"></i>
      </div>
      <h1 className="text-4xl font-black mb-2 tracking-tighter">
        YoungPapi<span className="text-indigo-600">Live</span>
      </h1>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">{status}</p>
      
      {sysInfo && (
          <div className="mb-8 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Backend</span>
              <span className="text-xs font-mono font-bold text-indigo-600">{sysInfo.ipAddresses[0]?.address}:{sysInfo.port}</span>
          </div>
      )}

      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ 
  onSkip: () => void; 
  onLogin: () => void; 
  onSignup: () => void; 
  onGoogleSSO: () => void;
  onAdmin: () => void;
}> = ({ onSkip, onLogin, onSignup, onGoogleSSO, onAdmin }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 justify-center items-center p-8 text-center overflow-y-auto">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div 
            onClick={onAdmin}
            className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-3xl flex items-center justify-center mb-6 rotate-3 cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-xl shadow-indigo-600/30 relative z-10"
            title="Admin Access"
        >
            <i className="fa-solid fa-video text-4xl text-white"></i>
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight relative z-10">The New Standard of Streaming</h1>
        <p className="text-slate-400 font-medium mb-10 relative z-10">Join millions of creators & viewers globally.</p>
        
        <div className="w-full max-w-xs space-y-3 relative z-10">
            {/* Google SSO Button */}
            <GoogleSSOButton 
              onClick={onGoogleSSO}
              text="Continue with Google"
              variant="light"
            />
            
            <button 
              onClick={onSignup} 
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 active:scale-95 transition-transform"
            >
              Get Started
            </button>
            
            <button 
              onClick={onLogin} 
              className="w-full bg-white/10 hover:bg-white/15 text-white py-3.5 rounded-2xl font-bold border border-white/10 text-sm transition-colors"
            >
              Sign In with Email
            </button>
            
            <button 
              onClick={onSkip} 
              className="text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest pt-2 transition-colors"
            >
              Skip
            </button>
        </div>
    </div>
  );
};

export const App: React.FC = () => {
  const {
    currentUser,
    streams,
    toggleFollow,
    followedUserIds,
    logout,
    activeLiveToast,
    dismissLiveToast,
    endStream
  } = useData();
  const [appState, setAppState] = useState<'splash' | 'landing' | 'main' | 'login' | 'register' | 'admin'>('admin');
  const [viewState, setViewState] = useState<'browse' | 'history' | 'inbox' | 'streaming' | 'watching' | 'settings' | 'profile'>('browse');
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [inspectProfileUser, setInspectProfileUser] = useState<User | null>(null);
  const [isGoogleSSOOpen, setIsGoogleSSOOpen] = useState(false);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const [showLiveNotificationCenter, setShowLiveNotificationCenter] = useState(false);
  const [shareToast, setShareToast] = useState<{ message: string; submessage?: string } | null>(null);
  const shareToastTimerRef = useRef<any>(null);

  const showShareToastNotification = (message: string, submessage?: string) => {
    if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
    setShareToast({ message, submessage });
    shareToastTimerRef.current = setTimeout(() => {
      setShareToast(null);
    }, 3200);
  };

  const copyStreamLink = async (url: string, title: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showShareToastNotification("Stream link copied!", `Direct link to "${title}" copied to clipboard.`);
    } catch (e) {
      showShareToastNotification("Stream Link", url);
    }
  };

  const handleShareStream = async (e: React.MouseEvent, stream: Stream) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?stream=${encodeURIComponent(stream.id)}`;
    const shareData = {
      title: `${stream.broadcaster.name} is LIVE on YoungPapi Live!`,
      text: `Watch "${stream.title}" by ${stream.broadcaster.name} on YoungPapi Live! 🎥🔥`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showShareToastNotification("Shared successfully!", `Stream link: ${stream.title}`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyStreamLink(shareUrl, stream.title);
        }
      }
    } else {
      copyStreamLink(shareUrl, stream.title);
    }
  };

  // Auto-open stream if ?stream=STREAM_ID is provided in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamId = urlParams.get('stream');
    if (streamId && streams.length > 0) {
      const target = streams.find(s => s.id === streamId);
      if (target) {
        setSelectedStream(target);
        setViewState('watching');
      }
    }
  }, [streams]);

  // Global Navigation & Search Filter States
  const [activeTab, setActiveTab] = useState<string>('live');
  const [activeSubTab, setActiveSubTab] = useState<string>('live_now');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const todayDateStr = getLocalDateString();
  const hasUnclaimedCheckIn = currentUser.lastCheckInDate !== todayDateStr;

  // Auto popup Daily Check-in modal when entering main app if not checked in today
  useEffect(() => {
    if (appState !== 'main') return;
    const today = getLocalDateString();
    const hasPrompted = sessionStorage.getItem('daily_checkin_auto_prompted_' + today);
    if (currentUser.lastCheckInDate !== today && !hasPrompted) {
      const timer = setTimeout(() => {
        setShowDailyCheckIn(true);
        try {
          sessionStorage.setItem('daily_checkin_auto_prompted_' + today, 'true');
        } catch (e) {}
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [appState, currentUser.lastCheckInDate]);

  const handleCleanExit = () => {
    logout();
    try {
      localStorage.removeItem('youngpapi_current_user');
      localStorage.removeItem('youngpapi_google_bound');
      sessionStorage.clear();
    } catch (e) {}
    setViewState('browse');
    setAppState('landing');
  };

  if (appState === 'splash') {
    return (
      <SplashScreen 
        onComplete={() => {
          // If user previously logged in with Google or account, go to main
          const savedUser = localStorage.getItem('youngpapi_current_user');
          if (savedUser) {
            setAppState('main');
          } else {
            setAppState('landing');
          }
        }} 
      />
    );
  }

  if (appState === 'landing') {
    return (
      <>
        <LandingPage 
          onSkip={() => setAppState('main')} 
          onLogin={() => setAppState('login')} 
          onSignup={() => setAppState('register')} 
          onGoogleSSO={() => setIsGoogleSSOOpen(true)}
          onAdmin={() => setAppState('admin')} 
        />
        <GoogleSSOModal
          isOpen={isGoogleSSOOpen}
          onClose={() => setIsGoogleSSOOpen(false)}
          onSuccess={() => {
            setIsGoogleSSOOpen(false);
            setAppState('main');
          }}
        />
      </>
    );
  }

  if (appState === 'register') return <RegistrationPage onBack={() => setAppState('landing')} onComplete={() => setAppState('main')} />;
  if (appState === 'login') return <LoginPage onBack={() => setAppState('landing')} onLoginSuccess={() => setAppState('main')} />;
  if (appState === 'admin') {
    return (
      <AdminDashboardView
        onExit={() => {
          if (window.location.search.includes('admin') || window.location.hash.includes('admin')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('admin');
            url.hash = '';
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          }
          setAppState('main');
        }}
      />
    );
  }

  if (viewState === 'streaming') return <StreamingView onClose={() => setViewState('browse')} />;
  if (viewState === 'watching' && selectedStream) return <WatchingView stream={selectedStream} currentUser={currentUser} onClose={() => { setViewState('browse'); setSelectedStream(null); }} onFollow={toggleFollow} />;

  if (viewState === 'profile') return (
    <ProfileView 
      onBack={() => setViewState('browse')} 
      onSettings={() => setViewState('settings')} 
      onLogout={handleCleanExit} 
      onHistory={() => setViewState('history')} 
      onAdmin={() => setAppState('admin')} 
    />
  );

  // Detect if current user has an active live stream
  const myActiveStream = streams.find(s => s.broadcaster.id === currentUser.id);

  // Real-time filtered streams based on activeTab, activeSubTab, selectedCategory, and searchQuery
  const filteredStreams = streams.filter(s => {
    // 1. Tab filter
    if (activeTab === 'follow') {
      if (!followedUserIds.includes(s.broadcaster.id) && s.broadcaster.id !== currentUser.id) return false;
    }
    // 2. Region subtab filter
    if (activeSubTab && activeSubTab !== 'live_now') {
      if (s.country !== activeSubTab && s.broadcaster.id !== currentUser.id) return false;
    }
    // 3. Category filter
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      if (s.category.toLowerCase() !== selectedCategory.toLowerCase() && s.broadcaster.id !== currentUser.id) return false;
    }
    // 4. Real-time search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = s.title.toLowerCase().includes(q);
      const hostMatch = s.broadcaster.name.toLowerCase().includes(q) || (s.broadcaster.username && s.broadcaster.username.toLowerCase().includes(q));
      const catMatch = s.category.toLowerCase().includes(q);
      if (!titleMatch && !hostMatch && !catMatch) return false;
    }
    return true;
  });

  // Keep current user's live stream highlighted at the top
  const sortedStreams = [...filteredStreams].sort((a, b) => {
    if (a.broadcaster.id === currentUser.id) return -1;
    if (b.broadcaster.id === currentUser.id) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        activeSubTab={activeSubTab} 
        onSubTabChange={setActiveSubTab} 
        onMessageClick={() => setViewState('inbox')} 
        onSearch={setSearchQuery}
        onCheckInClick={() => setShowDailyCheckIn(true)}
        hasUnclaimedCheckIn={hasUnclaimedCheckIn}
        onHistoryClick={() => setViewState('history')}
        onNotificationsClick={() => setShowLiveNotificationCenter(true)}
        onSelectStream={(s) => {
          setSelectedStream(s);
          setViewState('watching');
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setViewState('browse');
        }}
        currentSearchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onClearCategory={() => setSelectedCategory('all')}
      />
      
      <main className="flex-1 overflow-y-auto pb-24 pt-[115px] px-4">
          {viewState === 'history' && (
            <HistoryView 
              onSelectStream={(s) => {
                setSelectedStream(s);
                setViewState('watching');
              }}
              onBack={() => setViewState('browse')}
            />
          )}
          {viewState === 'inbox' && <InboxView onBack={() => setViewState('browse')} />}
          {viewState === 'settings' && <SettingsView onBack={() => setViewState('browse')} onLogout={handleCleanExit} />}
          
          {viewState === 'browse' && (
              <div>
                  {/* User's Active Live Room Featured Box */}
                  {myActiveStream && (
                    <div className="mb-4 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 p-0.5 shadow-xl shadow-rose-500/20 group">
                      <div className="bg-slate-950/92 backdrop-blur-xl rounded-[1.9rem] p-4 sm:p-5 text-white">
                        {/* Header status bar */}
                        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                              <span>You Are Live Now</span>
                            </span>
                            <span className="text-[10px] font-mono text-white/50 tracking-wider">
                              Room ID: {myActiveStream.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={(e) => handleShareStream(e, myActiveStream)}
                              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Share My Live Room"
                            >
                              <i className="fa-solid fa-share-nodes text-xs"></i>
                              <span className="hidden sm:inline">Share</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                if (confirm("End your live broadcast?")) {
                                  endStream(myActiveStream.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-rose-500/30"
                              title="End Broadcast"
                            >
                              <i className="fa-solid fa-power-off text-xs"></i>
                              <span>End</span>
                            </button>
                          </div>
                        </div>

                        {/* Stream and Broadcaster Info with Profile Image */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Profile Image with Glowing LIVE Ring */}
                            <div 
                              className="relative flex-shrink-0 cursor-pointer group/avatar" 
                              onClick={() => setViewState('streaming')}
                              title="Click to enter your live room"
                            >
                              <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-rose-500/80 shadow-lg shadow-rose-500/30 transition-transform group-hover/avatar:scale-105">
                                <img 
                                  src={currentUser.avatar} 
                                  alt={currentUser.name} 
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                              </div>
                              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[8px] font-black rounded-full uppercase tracking-wider shadow-md border border-white/40">
                                LIVE
                              </span>
                            </div>

                            {/* Stream Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 
                                  onClick={() => setViewState('streaming')}
                                  className="text-base font-black text-white truncate cursor-pointer hover:text-rose-200 transition-colors"
                                >
                                  {myActiveStream.title || `${currentUser.name}'s Live Room`}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-white/10">
                                  {myActiveStream.category}
                                </span>
                                {myActiveStream.country && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold flex items-center gap-1 border border-white/10">
                                    <span>{COUNTRIES.find(c => c.code === myActiveStream.country)?.flag || '🌏'}</span>
                                    <span className="text-[9px] uppercase font-black">{myActiveStream.country}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-white/70">
                                <span className="flex items-center gap-1.5 text-white font-bold truncate">
                                  <i className="fa-solid fa-user text-rose-400 text-[10px]"></i>
                                  <span className="truncate">{currentUser.name}</span>
                                </span>
                                <span className="text-white/30">·</span>
                                <span className="flex items-center gap-1 text-emerald-400 font-bold whitespace-nowrap">
                                  <i className="fa-solid fa-eye text-[10px]"></i>
                                  <span>{myActiveStream.viewerCount || 1} viewing</span>
                                </span>
                                <span className="text-white/30 hidden sm:inline">·</span>
                                <span className="text-indigo-300 font-mono text-[11px] hidden sm:inline font-bold">
                                  {myActiveStream.quality || '1080p HD'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Enter Live Room */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewState('streaming')}
                              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <i className="fa-solid fa-video text-sm animate-pulse"></i>
                              <span>Enter My Live Room</span>
                              <i className="fa-solid fa-arrow-right text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Streamers Real-Time Virtual Economy Widget */}
                  <TopStreamersWidget
                    onSelectStream={(s) => {
                      setSelectedStream(s);
                      setViewState('watching');
                    }}
                    onOpenProfile={(u) => setInspectProfileUser(u)}
                  />

                  {/* Daily Check-in Streak Banner Card */}
                  <div 
                    onClick={() => setShowDailyCheckIn(true)}
                    className="mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-3.5 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/15 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                        <i className="fa-solid fa-calendar-check text-amber-200"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
                            Daily Beans Check-in
                          </span>
                          <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-tight flex items-center gap-1">
                            <i className="fa-solid fa-fire text-amber-300 text-[8px]"></i>
                            Streak: {currentUser.checkInStreak || 0}d
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-white leading-tight truncate mt-0.5">
                          {currentUser.lastCheckInDate === todayDateStr 
                            ? "Checked in today! (+Beans Claimed ✅)" 
                            : "Claim your daily bonus Beans now! 🎁"}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="relative z-10 px-3 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs shadow-md shadow-black/10 group-hover:bg-amber-50 transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      {currentUser.lastCheckInDate === todayDateStr ? (
                        <>
                          <i className="fa-solid fa-check text-emerald-600 text-xs"></i>
                          <span>Claimed</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-coins text-amber-500 text-xs"></i>
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Results Count / Filter Bar */}
                  {(searchQuery || (selectedCategory && selectedCategory.toLowerCase() !== 'all') || (activeSubTab && activeSubTab !== 'live_now')) && (
                    <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <i className="fa-solid fa-filter text-indigo-600"></i>
                        <span>Showing {filteredStreams.length} {filteredStreams.length === 1 ? 'stream' : 'streams'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setActiveSubTab('live_now');
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-rotate-left text-[10px]"></i>
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  )}

                  {sortedStreams.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sortedStreams.map(s => {
                            const isMyStream = s.broadcaster.id === currentUser.id;
                            return (
                            <div 
                              key={s.id} 
                              onClick={() => { 
                                if (isMyStream) {
                                  setViewState('streaming');
                                } else {
                                  setSelectedStream(s); 
                                  setViewState('watching'); 
                                }
                              }} 
                              className={`relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-200 cursor-pointer group shadow-lg hover:shadow-xl transition-all ${
                                isMyStream ? 'ring-3 ring-rose-500 ring-offset-2' : ''
                              }`}
                            >
                                <img src={s.thumbnail || s.broadcaster.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                                
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap">
                                    <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                                    </div>
                                    {isMyStream && (
                                      <div className="bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs border border-white/20 uppercase tracking-wider">
                                          <i className="fa-solid fa-star text-[8px] text-amber-300"></i> YOU
                                      </div>
                                    )}
                                    {s.country && (
                                        <div className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/10" title={COUNTRIES.find(c => c.code === s.country)?.name || s.country}>
                                            <span>{COUNTRIES.find(c => c.code === s.country)?.flag || '🌏'}</span>
                                            <span className="text-[9px] font-black uppercase">{s.country}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <i className="fa-solid fa-eye text-[9px] text-slate-300"></i> {s.viewerCount.toLocaleString()}
                                </div>

                                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-2 z-10">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 block mb-0.5">
                                          {s.category}
                                        </span>
                                        <h3 className="text-white font-black text-sm line-clamp-1 leading-snug">{s.title}</h3>
                                        <p className="text-white/70 text-[10px] font-bold uppercase truncate">{isMyStream ? 'You (Host)' : s.broadcaster.name}</p>
                                    </div>

                                    {/* Social Share Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleShareStream(e, s)}
                                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-indigo-600/90 active:scale-90 backdrop-blur-md text-white flex items-center justify-center text-xs shadow-md border border-white/25 hover:border-indigo-400 transition-all flex-shrink-0 group-hover:scale-105 cursor-pointer"
                                      title={`Share ${s.broadcaster.name}'s stream link`}
                                      aria-label={`Share ${s.title} stream link`}
                                    >
                                      <i className="fa-solid fa-share-nodes text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-8">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i className="fa-solid fa-magnifying-glass"></i>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mb-1">No Streams Found</h4>
                      <p className="text-xs text-slate-400 mb-6">
                        No live broadcasts match your current filters or search query "{searchQuery}".
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setActiveSubTab('live_now');
                          setActiveTab('live');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                      >
                        View All Live Streams
                      </button>
                    </div>
                  )}
              </div>
          )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 sm:px-6 py-2 flex justify-around items-center z-40 safe-bottom shadow-lg">
          <button 
            onClick={() => setViewState('browse')} 
            className={`flex flex-col items-center gap-1 transition-colors ${viewState === 'browse' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[10px] uppercase tracking-wider font-bold">Home</span>
          </button>

          <button 
            onClick={() => setViewState('history')} 
            className={`flex flex-col items-center gap-1 transition-colors relative ${viewState === 'history' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            title="History"
          >
            <i className="fa-solid fa-clock-rotate-left text-lg"></i>
            <span className="text-[10px] uppercase tracking-wider font-bold">History</span>
          </button>
          
          <button 
            onClick={() => setViewState('streaming')} 
            className="w-13 h-13 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-full flex items-center justify-center text-white text-xl shadow-xl shadow-indigo-600/30 -mt-6 hover:scale-105 active:scale-95 transition-all"
            title="Go Live"
          >
            <i className="fa-solid fa-camera"></i>
          </button>
          
          <button 
            onClick={() => setViewState('inbox')} 
            className={`flex flex-col items-center gap-1 transition-colors relative ${viewState === 'inbox' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            title="Chat & Messages"
          >
            <div className="relative">
              <i className="fa-solid fa-comment-dots text-lg"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold">Chat</span>
          </button>
          
          <button 
            onClick={() => setViewState('profile')} 
            className={`flex flex-col items-center gap-1 transition-colors relative ${viewState === 'profile' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            title="Me"
          >
            <i className="fa-solid fa-user text-lg"></i>
            <span className="text-[10px] uppercase tracking-wider font-bold">Me</span>
          </button>
      </nav>

      {/* Daily Check-in Modal */}
      <DailyCheckInModal 
        isOpen={showDailyCheckIn} 
        onClose={() => setShowDailyCheckIn(false)} 
      />

      {/* Social Share Toast Notification */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] max-w-sm w-[92%] sm:w-auto animate-fade-in-down pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-sm flex-shrink-0">
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div className="min-w-0 pr-1">
              <h5 className="text-xs font-black text-white truncate">{shareToast.message}</h5>
              {shareToast.submessage && (
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  {shareToast.submessage}
                </p>
              )}
            </div>
            <button
              onClick={() => setShareToast(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-auto flex-shrink-0"
              title="Dismiss"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Live Notification Toast Banner */}
      <LiveNotificationToast
        notification={activeLiveToast}
        onWatch={(notif) => {
          dismissLiveToast();
          const existing = streams.find(s => s.id === notif.streamId || s.broadcaster.id === notif.broadcaster.id);
          if (existing) {
            setSelectedStream(existing);
          } else {
            setSelectedStream({
              id: notif.streamId,
              title: notif.streamTitle,
              broadcaster: {
                id: notif.broadcaster.id,
                name: notif.broadcaster.name,
                avatar: notif.broadcaster.avatar,
                level: notif.broadcaster.level || 25,
                diamonds: 5000,
                followers: 12000,
                following: 10,
                country: notif.country || 'ID',
                vvipStatus: 'vip'
              },
              viewerCount: 1350,
              thumbnail: notif.thumbnail || notif.broadcaster.avatar,
              category: notif.category || 'Live',
              country: notif.country || 'ID',
              quality: '1080p',
              startTime: notif.timestamp
            });
          }
          setViewState('watching');
        }}
        onDismiss={dismissLiveToast}
      />

      {/* Live Alerts Notification Center Modal */}
      <LiveNotificationCenterModal
        isOpen={showLiveNotificationCenter}
        onClose={() => setShowLiveNotificationCenter(false)}
        onSelectStream={(s) => {
          setSelectedStream(s);
          setViewState('watching');
        }}
      />

      {/* Streamer Public Profile Modal */}
      {inspectProfileUser && (
        <PublicProfileModal
          user={inspectProfileUser}
          onClose={() => setInspectProfileUser(null)}
        />
      )}
    </div>
  );
};
