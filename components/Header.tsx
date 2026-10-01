import React, { useState } from 'react';
import { COUNTRIES } from '../constants';
import GlobalSearchModal from './GlobalSearchModal';
import { Stream } from '../types';
import { useData } from '../contexts/DataContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  onMessageClick: () => void;
  onSearch: (query: string) => void;
  onSelectStream?: (stream: Stream) => void;
  onSelectCategory?: (category: string) => void;
  currentSearchQuery?: string;
  selectedCategory?: string;
  onClearCategory?: () => void;
  onCheckInClick?: () => void;
  hasUnclaimedCheckIn?: boolean;
  onHistoryClick?: () => void;
  onNotificationsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeSubTab,
  onSubTabChange,
  onMessageClick,
  onSearch,
  onSelectStream,
  onSelectCategory,
  currentSearchQuery = '',
  selectedCategory,
  onClearCategory,
  onCheckInClick,
  hasUnclaimedCheckIn = false,
  onHistoryClick,
  onNotificationsClick
}) => {
  const { unreadNotificationCount } = useData();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState(currentSearchQuery);

  React.useEffect(() => {
    setSearchText(currentSearchQuery);
  }, [currentSearchQuery]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch(text);
  };

  const handleCountrySelect = (code: string) => {
    onSubTabChange(code);
    setIsCountryMenuOpen(false);
  };

  const activeCountry = COUNTRIES.find(c => c.code === activeSubTab);
  const activeCountryName = activeCountry ? activeCountry.name : 'ASEAN All';
  const activeCountryFlag = activeCountry ? activeCountry.flag : '🌏';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md pt-3 pb-2 transition-all duration-300 shadow-sm border-b border-slate-100">
        <div className="flex items-center justify-between px-4 mb-2 min-h-[44px]">
          {/* Main Navigation Tabs */}
          <div className="flex items-baseline gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onTabChange('follow')}
              className={`text-xl sm:text-2xl font-black tracking-tight transition-all whitespace-nowrap relative ${
                activeTab === 'follow' ? 'text-slate-900' : 'text-slate-400 text-base sm:text-lg hover:text-slate-600'
              }`}
            >
              Follow
              {activeTab === 'follow' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 bg-indigo-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => onTabChange('live')}
              className={`text-xl sm:text-2xl font-black tracking-tight transition-all whitespace-nowrap relative ${
                activeTab === 'live' ? 'text-slate-900' : 'text-slate-400 text-base sm:text-lg hover:text-slate-600'
              }`}
            >
              Live
              {activeTab === 'live' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 bg-indigo-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => onTabChange('upcoming')}
              className={`text-xl sm:text-2xl font-black tracking-tight transition-all whitespace-nowrap relative ${
                activeTab === 'upcoming' ? 'text-slate-900' : 'text-slate-400 text-base sm:text-lg hover:text-slate-600'
              }`}
            >
              Upcoming
              {activeTab === 'upcoming' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 bg-indigo-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => onTabChange('party')}
              className={`text-xl sm:text-2xl font-black tracking-tight transition-all whitespace-nowrap relative ${
                activeTab === 'party' ? 'text-slate-900' : 'text-slate-400 text-base sm:text-lg hover:text-slate-600'
              }`}
            >
              Party
              {activeTab === 'party' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 bg-indigo-600 rounded-full"></div>
              )}
            </button>
          </div>

          {/* Header Action Buttons & Search Trigger */}
          <div className="flex items-center gap-2">
            {/* Quick Search Bar / Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 transition-all active:scale-95 group shadow-xs"
              title="Search streamers, categories, or topics"
            >
              <i className="fa-solid fa-magnifying-glass text-xs text-slate-400 group-hover:text-indigo-600"></i>
              <span className="hidden sm:inline text-xs font-bold text-slate-500 group-hover:text-indigo-600 max-w-[140px] truncate">
                {searchText ? `"${searchText}"` : 'Search streamers...'}
              </span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {/* Daily Check-in Trigger Button */}
            {onCheckInClick && (
              <button
                onClick={onCheckInClick}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/80 active:scale-95 transition-all relative"
                title="Daily Check-in & Beans Rewards"
              >
                <i className="fa-solid fa-calendar-check text-sm text-amber-500"></i>
                {hasUnclaimedCheckIn && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-ping"></span>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
                  </>
                )}
              </button>
            )}

            {/* Viewing History Trigger Button */}
            {onHistoryClick && (
              <button
                onClick={onHistoryClick}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700 active:scale-95 transition-all"
                title="Viewing History & Favorite Moments"
                aria-label="Viewing History"
              >
                <i className="fa-solid fa-clock-rotate-left text-sm"></i>
              </button>
            )}

            {/* Live Alerts Notification Center Button */}
            {onNotificationsClick && (
              <button
                onClick={onNotificationsClick}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700 active:scale-95 transition-all relative"
                title="Live Alerts (Followed Streamers)"
                aria-label="Live Alerts"
              >
                <i className="fa-solid fa-bell text-sm"></i>
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Inbox / Notification Button */}
            <button
              onClick={onMessageClick}
              className="text-slate-800 text-lg w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors relative"
              title="Messages"
            >
              <i className="fa-solid fa-comment-dots"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </div>

        {/* Region Sub-Tabs and Active Filter Indicators */}
        <div className="relative px-4 flex items-center gap-2">
          {/* Region Dropdown Toggle */}
          <button
            onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all ${
              isCountryMenuOpen
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-800 active:bg-slate-200 hover:bg-slate-200/80'
            }`}
          >
            <span>{activeCountryFlag}</span>
            <span className="uppercase tracking-wider whitespace-nowrap max-w-[70px] truncate text-[11px]">
              {activeCountryName}
            </span>
            <i
              className={`fa-solid fa-chevron-down text-[9px] transition-transform ${
                isCountryMenuOpen ? 'rotate-180' : ''
              }`}
            ></i>
          </button>

          {/* Quick Region Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 items-center">
            <button
              onClick={() => handleCountrySelect('live_now')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeSubTab === 'live_now'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              Hot 🔥
            </button>
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => handleCountrySelect(c.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1 ${
                  activeSubTab === c.code
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{c.flag}</span>
                <span className="text-[11px]">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Country Selection Menu Overlay */}
          {isCountryMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs"
                onClick={() => setIsCountryMenuOpen(false)}
              ></div>
              <div className="absolute top-full left-4 mt-2 w-64 max-h-[60vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-3 no-scrollbar animate-fade-in-up">
                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 mb-2">
                  Filter By ASEAN Country
                </div>
                <button
                  onClick={() => handleCountrySelect('live_now')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeSubTab === 'live_now' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                      🌏
                    </div>
                    <span className="text-xs font-bold">All ASEAN</span>
                  </div>
                  {activeSubTab === 'live_now' && <i className="fa-solid fa-circle-check text-indigo-600 text-xs"></i>}
                </button>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  {COUNTRIES.map(country => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                        activeSubTab === country.code
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                          {country.flag}
                        </div>
                        <span className="text-xs font-bold">{country.name}</span>
                      </div>
                      {activeSubTab === country.code && (
                        <i className="fa-solid fa-circle-check text-indigo-600 text-xs"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active Filter Bar (when category or search is active) */}
        {(searchText || (selectedCategory && selectedCategory.toLowerCase() !== 'all')) && (
          <div className="px-4 pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>
            {searchText && (
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <i className="fa-solid fa-magnifying-glass text-[9px]"></i>
                <span className="max-w-[120px] truncate">"{searchText}"</span>
                <button
                  onClick={() => handleSearchChange('')}
                  className="hover:text-indigo-900 ml-0.5"
                  title="Remove query"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>
            )}
            {selectedCategory && selectedCategory.toLowerCase() !== 'all' && (
              <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <i className="fa-solid fa-shapes text-[9px]"></i>
                <span>{selectedCategory}</span>
                <button
                  onClick={() => onClearCategory && onClearCategory()}
                  className="hover:text-purple-900 ml-0.5"
                  title="Clear category"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Real-Time Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={searchText}
        onSearchChange={handleSearchChange}
        onSelectStream={(stream) => {
          if (onSelectStream) onSelectStream(stream);
        }}
        onSelectCategory={(category) => {
          if (onSelectCategory) onSelectCategory(category);
        }}
      />
    </>
  );
};

export default Header;
