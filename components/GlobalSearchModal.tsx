import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Stream, User } from '../types';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectStream: (stream: Stream) => void;
  onSelectCategory: (category: string) => void;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  description: string;
  gradient: string;
}

export const POPULAR_CATEGORIES: CategoryItem[] = [
  { id: 'gaming', name: 'Gaming', icon: 'fa-gamepad', emoji: '🎮', description: 'Esports, competitive & casual', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'music', name: 'Music', icon: 'fa-music', emoji: '🎵', description: 'Singing, acoustic & concerts', gradient: 'from-rose-500 to-pink-600' },
  { id: 'ai chat', name: 'AI Chat', icon: 'fa-robot', emoji: '🤖', description: 'Intelligent virtual companions', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'food', name: 'Food', icon: 'fa-utensils', emoji: '🍜', description: 'Cooking & night market tours', gradient: 'from-amber-500 to-orange-600' },
  { id: 'travel', name: 'Travel', icon: 'fa-plane-departure', emoji: '✈️', description: 'City exploration & scenery', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'health', name: 'Health & Yoga', icon: 'fa-heart-pulse', emoji: '🧘', description: 'Wellness & workouts', gradient: 'from-green-500 to-emerald-600' },
  { id: 'chat', name: 'Just Chatting', icon: 'fa-comments', emoji: '💬', description: 'Talk shows, chill & Q&As', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'education', name: 'Education', icon: 'fa-graduation-cap', emoji: '📚', description: 'Skills, tutorials & classes', gradient: 'from-sky-500 to-blue-600' },
  { id: 'diy', name: 'DIY & Crafts', icon: 'fa-hammer', emoji: '🛠️', description: 'Making, building & hobbies', gradient: 'from-amber-600 to-yellow-600' }
];

export const TRENDING_TOPICS = [
  { tag: '#LateNightVibes', count: '14.2K watching', category: 'Music', isHot: true },
  { tag: '#ProGamerVN', count: '11.5K watching', category: 'Gaming', isHot: true },
  { tag: '#BangkokFoodie', count: '8.4K watching', category: 'Food', isHot: true },
  { tag: '#AIChatbot', count: '6.9K watching', category: 'AI Chat', isHot: true },
  { tag: '#JakartaMusic', count: '5.1K watching', category: 'Music', isHot: false },
  { tag: '#MorningYoga', count: '4.3K watching', category: 'Health', isHot: false },
  { tag: '#CityWalks', count: '3.8K watching', category: 'Travel', isHot: false },
  { tag: '#RankedPush', count: '9.2K watching', category: 'Gaming', isHot: true }
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSelectStream,
  onSelectCategory
}: GlobalSearchModalProps) {
  const { streams, users, followedUserIds, toggleFollow } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | 'streamers' | 'streams' | 'categories' | 'trending'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('youngpapi_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('youngpapi_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      try {
        localStorage.setItem('youngpapi_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('youngpapi_recent_searches');
    } catch (e) {}
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate all known streamers (from users list + active stream broadcasters)
  const allStreamers = useMemo(() => {
    const map = new Map<string, { user: User; liveStream?: Stream }>();
    
    // Add stream broadcasters first (they are live!)
    streams.forEach(s => {
      map.set(s.broadcaster.id, {
        user: s.broadcaster,
        liveStream: s
      });
    });

    // Add other users from users state
    users.forEach(u => {
      if (!map.has(u.id)) {
        map.set(u.id, { user: u });
      }
    });

    return Array.from(map.values());
  }, [streams, users]);

  // Live count map for categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    streams.forEach(s => {
      const cat = s.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [streams]);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Filtered streamers
  const matchedStreamers = useMemo(() => {
    if (!cleanQuery) return [];
    return allStreamers.filter(({ user }) => {
      const nameMatch = user.name.toLowerCase().includes(cleanQuery);
      const usernameMatch = user.username ? user.username.toLowerCase().includes(cleanQuery) : false;
      const idMatch = user.id.includes(cleanQuery);
      const bioMatch = user.bio ? user.bio.toLowerCase().includes(cleanQuery) : false;
      return nameMatch || usernameMatch || idMatch || bioMatch;
    });
  }, [allStreamers, cleanQuery]);

  // Filtered streams
  const matchedStreams = useMemo(() => {
    if (!cleanQuery) return [];
    return streams.filter(s => {
      const titleMatch = s.title.toLowerCase().includes(cleanQuery);
      const hostMatch = s.broadcaster.name.toLowerCase().includes(cleanQuery) || (s.broadcaster.username && s.broadcaster.username.toLowerCase().includes(cleanQuery));
      const catMatch = s.category.toLowerCase().includes(cleanQuery);
      return titleMatch || hostMatch || catMatch;
    });
  }, [streams, cleanQuery]);

  // Filtered categories
  const matchedCategories = useMemo(() => {
    if (!cleanQuery) return [];
    return POPULAR_CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(cleanQuery) || 
      c.id.toLowerCase().includes(cleanQuery) ||
      c.description.toLowerCase().includes(cleanQuery)
    );
  }, [cleanQuery]);

  // Filtered trending topics
  const matchedTopics = useMemo(() => {
    if (!cleanQuery) return [];
    const qWithoutHash = cleanQuery.startsWith('#') ? cleanQuery.slice(1) : cleanQuery;
    return TRENDING_TOPICS.filter(t => 
      t.tag.toLowerCase().includes(cleanQuery) || 
      t.tag.toLowerCase().includes(qWithoutHash) ||
      t.category.toLowerCase().includes(cleanQuery)
    );
  }, [cleanQuery]);

  const totalResultsCount = matchedStreamers.length + matchedStreams.length + matchedCategories.length + matchedTopics.length;

  const handleSelectTerm = (term: string) => {
    onSearchChange(term);
    saveRecentSearch(term);
  };

  const handleStreamClick = (stream: Stream) => {
    saveRecentSearch(stream.title);
    onSelectStream(stream);
    onClose();
  };

  const handleCategoryClick = (categoryName: string) => {
    saveRecentSearch(categoryName);
    onSelectCategory(categoryName);
    onClose();
  };

  const handleTopicClick = (tag: string) => {
    saveRecentSearch(tag);
    onSearchChange(tag);
    setActiveFilter('all');
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-indigo-100 text-indigo-700 px-0.5 rounded font-black">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-md animate-fade-in">
      {/* Top Search Bar Container */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-slate-100 shadow-md">
        <div className="max-w-3xl mx-auto">
          {/* Main Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    saveRecentSearch(searchQuery);
                    // If there is a matching stream, select first
                    if (matchedStreams.length > 0) {
                      handleStreamClick(matchedStreams[0]);
                    }
                  }
                }}
                placeholder="Search streamers, categories, live streams, or #topics..."
                className="w-full bg-slate-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition-colors text-[11px]"
                  title="Clear search"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>

          {/* Filter Pills Tabs (Visible when typing or searching) */}
          {cleanQuery && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Results</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {totalResultsCount}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('streamers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === 'streamers'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-users text-[10px]"></i>
                <span>Streamers</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'streamers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {matchedStreamers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('streams')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === 'streams'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-video text-[10px]"></i>
                <span>Live Streams</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'streams' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {matchedStreams.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('categories')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === 'categories'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-layer-group text-[10px]"></i>
                <span>Categories</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {matchedCategories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('trending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === 'trending'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fa-solid fa-fire text-amber-500 text-[10px]"></i>
                <span>Trending Topics</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'trending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {matchedTopics.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results / Discovery Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* EMPTY STATE: DISCOVERY MODE (When Query is Empty) */}
          {!cleanQuery && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-clock-rotate-left text-slate-400 text-xs"></i>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Recent Searches</h4>
                    </div>
                    <button
                      onClick={clearAllRecent}
                      className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectTerm(term)}
                        className="group inline-flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer transition-all active:scale-95"
                      >
                        <span>{term}</span>
                        <button
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="text-slate-400 hover:text-slate-600 group-hover:text-indigo-400 text-[10px]"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Topics Now */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-fire"></i>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Trending Topics Now</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-Time</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRENDING_TOPICS.map((topic, idx) => (
                    <div
                      key={topic.tag}
                      onClick={() => handleTopicClick(topic.tag)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 w-4 text-center font-mono">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 truncate">
                              {topic.tag}
                            </span>
                            {topic.isHot && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black uppercase">
                                HOT
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {topic.category} • {topic.count}
                          </p>
                        </div>
                      </div>
                      <i className="fa-solid fa-arrow-trend-up text-xs text-slate-300 group-hover:text-indigo-600 transition-colors ml-2"></i>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-shapes"></i>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Explore by Category</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{POPULAR_CATEGORIES.length} Categories</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {POPULAR_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.id.toLowerCase()] || 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-left transition-all group flex flex-col justify-between h-24 active:scale-95"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{cat.emoji}</span>
                          {count > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> {count} LIVE
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600">
                            {cat.name}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{cat.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Streamers Live Now */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-tower-broadcast"></i>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Broadcasters Live Right Now</h4>
                  </div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    {streams.length} Online
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {streams.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleStreamClick(s)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={s.broadcaster.avatar}
                            alt={s.broadcaster.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 p-0.5"
                          />
                          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full border border-white">
                            LIVE
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 truncate">
                              {s.broadcaster.name}
                            </span>
                            {s.broadcaster.isVerified && (
                              <i className="fa-solid fa-circle-check text-indigo-600 text-[10px]"></i>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold truncate">
                            {s.title}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                          <i className="fa-solid fa-eye text-slate-400 text-[9px]"></i> {s.viewerCount.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">
                          Watch
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEARCH RESULTS VIEW (When User Types) */}
          {cleanQuery && (
            <div className="space-y-6">

              {/* ZERO RESULTS STATE */}
              {totalResultsCount === 0 && (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1">
                    No results found for "{searchQuery}"
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Try searching for different keywords, streamers, or trending topics.
                  </p>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                      Try Searching For:
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Gaming', 'Music', 'Luna_Sky', 'AI Chat', 'Food', '#ProGamerVN'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSelectTerm(s)}
                          className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-bold border border-slate-200 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. MATCHED STREAMERS */}
              {(activeFilter === 'all' || activeFilter === 'streamers') && matchedStreamers.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Streamers ({matchedStreamers.length})
                      </h4>
                    </div>
                    {matchedStreamers.length > 4 && activeFilter === 'all' && (
                      <button
                        onClick={() => setActiveFilter('streamers')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeFilter === 'streamers' ? matchedStreamers : matchedStreamers.slice(0, 4)).map(({ user, liveStream }) => {
                      const isFollowing = followedUserIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between group"
                        >
                          <div 
                            onClick={() => {
                              if (liveStream) handleStreamClick(liveStream);
                            }}
                            className={`flex items-center gap-3 min-w-0 ${liveStream ? 'cursor-pointer' : ''}`}
                          >
                            <div className="relative flex-shrink-0">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className={`w-12 h-12 rounded-full object-cover border-2 ${
                                  liveStream ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'
                                }`}
                              />
                              {liveStream && (
                                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border border-white flex items-center gap-0.5 shadow-sm">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  LIVE
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 truncate">
                                  {highlightMatch(user.name, cleanQuery)}
                                </span>
                                {user.isVerified && (
                                  <i className="fa-solid fa-circle-check text-indigo-600 text-[11px]"></i>
                                )}
                              </div>
                              <p className="text-[11px] font-mono font-bold text-slate-400 truncate">
                                @{user.username || user.name.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 uppercase">
                                  Lv.{user.level}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {user.followers.toLocaleString()} fans
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {liveStream ? (
                              <button
                                onClick={() => handleStreamClick(liveStream)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95"
                              >
                                <i className="fa-solid fa-play text-[9px]"></i>
                                <span>Watch</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleFollow(user.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isFollowing
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                }`}
                              >
                                {isFollowing ? 'Following' : '+ Follow'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MATCHED LIVE STREAMS */}
              {(activeFilter === 'all' || activeFilter === 'streams') && matchedStreams.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs">
                        <i className="fa-solid fa-video"></i>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Live Streams ({matchedStreams.length})
                      </h4>
                    </div>
                    {matchedStreams.length > 4 && activeFilter === 'all' && (
                      <button
                        onClick={() => setActiveFilter('streams')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(activeFilter === 'streams' ? matchedStreams : matchedStreams.slice(0, 4)).map((stream) => (
                      <div
                        key={stream.id}
                        onClick={() => handleStreamClick(stream)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 flex gap-3 cursor-pointer transition-all group active:scale-[0.99]"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                          <img
                            src={stream.thumbnail}
                            alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            LIVE
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1 rounded">
                            {stream.viewerCount.toLocaleString()}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md mb-1 inline-block">
                              {stream.category}
                            </span>
                            <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 line-clamp-2 leading-tight">
                              {highlightMatch(stream.title, cleanQuery)}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100/80">
                            <img
                              src={stream.broadcaster.avatar}
                              alt={stream.broadcaster.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-[11px] font-bold text-slate-600 truncate">
                              {stream.broadcaster.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. MATCHED CATEGORIES */}
              {(activeFilter === 'all' || activeFilter === 'categories') && matchedCategories.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                        <i className="fa-solid fa-layer-group"></i>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Categories ({matchedCategories.length})
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchedCategories.map((cat) => {
                      const count = categoryCounts[cat.id.toLowerCase()] || 0;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleCategoryClick(cat.name)}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
                              {cat.emoji}
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-slate-900 group-hover:text-indigo-600">
                                {highlightMatch(cat.name, cleanQuery)}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {cat.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block">
                              {count} {count === 1 ? 'stream' : 'streams'}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                              Browse →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. MATCHED TRENDING TOPICS */}
              {(activeFilter === 'all' || activeFilter === 'trending') && matchedTopics.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                        <i className="fa-solid fa-fire"></i>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Trending Topics ({matchedTopics.length})
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchedTopics.map((topic) => (
                      <div
                        key={topic.tag}
                        onClick={() => handleTopicClick(topic.tag)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600">
                              {highlightMatch(topic.tag, cleanQuery)}
                            </span>
                            {topic.isHot && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[8px] font-black uppercase">
                                HOT
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {topic.category} • {topic.count}
                          </p>
                        </div>
                        <i className="fa-solid fa-arrow-trend-up text-xs text-slate-300 group-hover:text-indigo-600 transition-colors"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
