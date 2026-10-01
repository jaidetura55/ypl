import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { HistoryItem, Stream, FavoriteMoment } from '../types';
import {
  getRecentWatchedStreamIds,
  removeWatchedStreamId,
  clearWatchedStreamIds
} from '../services/historyStorage';
import { MOCK_STREAMS } from '../constants';

interface HistoryViewProps {
  onSelectStream: (stream: Stream) => void;
  onBack: () => void;
}

export default function HistoryView({ onSelectStream, onBack }: HistoryViewProps) {
  const {
    viewingHistory,
    streams,
    users,
    toggleFavoriteHistory,
    removeHistoryItem,
    clearViewingHistory
  } = useData();

  // Local storage backed record of recent stream IDs
  const [recentStreamIds, setRecentStreamIds] = useState<string[]>(() => {
    return getRecentWatchedStreamIds();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'Music' | 'Gaming' | 'Singing' | 'Party'>('all');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [expandedMomentsStreamId, setExpandedMomentsStreamId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Helper to resolve or construct a playable stream from a history item
  const resolvePlayableStream = (item: HistoryItem): Stream => {
    const existing = streams.find(s => s.id === item.streamId);
    if (existing) return existing;

    // Fallback: construct valid stream object from history metadata
    const broadcasterUser = users.find(u => u.name === item.broadcasterName) || {
      id: item.streamId ? `u_${item.streamId}` : `u_${Date.now()}`,
      name: item.broadcasterName || 'Broadcaster',
      avatar: item.broadcasterAvatar || 'https://picsum.photos/seed/broadcaster/200',
      level: 25,
      diamonds: 1000,
      followers: 12000,
      following: 50,
      country: 'ID',
      vvipStatus: 'vip' as const
    };

    return {
      id: item.streamId,
      title: item.streamTitle,
      broadcaster: broadcasterUser,
      viewerCount: item.viewerCount || 1150,
      thumbnail: item.thumbnail || 'https://picsum.photos/seed/hist/800/600',
      category: item.category || 'Music',
      country: 'ID',
      quality: '1080p',
      startTime: Date.now() - 3600 * 1000
    };
  };

  const handleReWatch = (item: HistoryItem) => {
    const stream = resolvePlayableStream(item);
    showToast(`Re-watching "${item.streamTitle}"`);
    onSelectStream(stream);
  };

  const handleJumpToMoment = (item: HistoryItem, moment: FavoriteMoment) => {
    const stream = resolvePlayableStream(item);
    showToast(`Jumping to moment "${moment.label}" at ${moment.timestampFormatted}`);
    onSelectStream(stream);
  };

  // Sync recentStreamIds with viewingHistory changes
  useEffect(() => {
    setRecentStreamIds(getRecentWatchedStreamIds());
  }, [viewingHistory]);

  // Fetch details from the existing stream list for all recorded stream IDs
  const combinedHistoryItems = useMemo(() => {
    const existingStreamsMap = new Map<string, Stream>();
    MOCK_STREAMS.forEach(s => existingStreamsMap.set(s.id, s));
    streams.forEach(s => existingStreamsMap.set(s.id, s));

    const historyMap = new Map<string, HistoryItem>();
    viewingHistory.forEach(item => historyMap.set(item.streamId, item));

    const allStreamIds = Array.from(new Set([...recentStreamIds, ...viewingHistory.map(h => h.streamId)]));

    return allStreamIds.map(id => {
      const stream = existingStreamsMap.get(id);
      const existingHistory = historyMap.get(id);

      if (stream) {
        return {
          id: existingHistory?.id || `hist_${stream.id}`,
          streamId: stream.id,
          streamTitle: stream.title,
          broadcasterName: stream.broadcaster.name,
          broadcasterAvatar: stream.broadcaster.avatar,
          thumbnail: stream.thumbnail,
          category: stream.category,
          viewerCount: stream.viewerCount,
          timestamp: existingHistory?.timestamp || new Date().toISOString(),
          durationWatched: existingHistory?.durationWatched || 'Watched',
          isFavorite: existingHistory?.isFavorite || false,
          favoriteMoments: existingHistory?.favoriteMoments || [
            { id: `m_${stream.id}_1`, timeOffsetSec: 120, label: "Stream Highlight", timestampFormatted: "02:00" }
          ]
        };
      }
      return existingHistory;
    }).filter((item): item is HistoryItem => Boolean(item));
  }, [recentStreamIds, viewingHistory, streams]);

  // Filter history items
  const filteredHistory = useMemo(() => {
    return combinedHistoryItems.filter(item => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.streamTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.broadcasterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.favoriteMoments?.some(m => m.label.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeFilter === 'favorites') {
        return item.isFavorite;
      }
      if (activeFilter !== 'all') {
        return item.category?.toLowerCase() === activeFilter.toLowerCase();
      }

      return true;
    });
  }, [combinedHistoryItems, searchQuery, activeFilter]);

  const favoritesCount = useMemo(() => {
    return combinedHistoryItems.filter(item => item.isFavorite).length;
  }, [combinedHistoryItems]);

  const handleRemoveItem = (item: HistoryItem) => {
    const id = item.id || item.streamId;
    removeHistoryItem(id);
    removeWatchedStreamId(item.streamId);
    setRecentStreamIds(prev => prev.filter(sid => sid !== item.streamId));
    showToast('Removed from history');
  };

  const handleClearAll = () => {
    clearViewingHistory();
    clearWatchedStreamIds();
    setRecentStreamIds([]);
    setShowClearConfirmModal(false);
    showToast('Viewing history cleared');
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="pb-28 max-w-4xl mx-auto px-4 pt-3 animate-fade-in text-slate-800">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-95 flex-shrink-0"
            title="Go Back"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Viewing History
              </h1>
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {viewingHistory.length} Watched
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Re-watch past live streams and jump back to favorite memorable moments.
            </p>
          </div>
        </div>

        {viewingHistory.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100/80 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              title="Clear all viewing history"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 mb-5 shadow-sm border border-slate-100 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past streams by title, broadcaster, or moment..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-slate-200/60"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[11px] whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({viewingHistory.length})
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'favorites'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <i className="fa-solid fa-star text-xs"></i>
            <span>Favorites ({favoritesCount})</span>
          </button>

          {(['Music', 'Gaming', 'Singing', 'Party'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[11px] whitespace-nowrap transition-all ${
                activeFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const hasMoments = item.favoriteMoments && item.favoriteMoments.length > 0;
            const isMomentsExpanded = expandedMomentsStreamId === (item.id || item.streamId);

            return (
              <div
                key={item.id || item.streamId}
                className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail with Duration & Re-watch Overlay */}
                    <div
                      onClick={() => handleReWatch(item)}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer group/thumb shadow-inner"
                      title="Click to re-watch stream"
                    >
                      <img
                        src={item.thumbnail || 'https://picsum.photos/seed/thumb/300/200'}
                        alt={item.streamTitle}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center text-sm shadow-lg group-hover/thumb:scale-110 transition-transform">
                          <i className="fa-solid fa-play ml-0.5"></i>
                        </div>
                      </div>

                      {/* Watched Duration Badge */}
                      {item.durationWatched && (
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {item.durationWatched}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {item.category && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        {item.viewerCount && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <i className="fa-solid fa-eye text-[9px]"></i> {item.viewerCount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => handleReWatch(item)}
                        className="text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {item.streamTitle}
                      </h3>

                      {/* Broadcaster Info */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <img
                          src={item.broadcasterAvatar || 'https://picsum.photos/seed/user/100'}
                          alt={item.broadcasterName}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {item.broadcasterName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {/* Favorite Toggle Button */}
                    <button
                      onClick={() => {
                        toggleFavoriteHistory(item.id || item.streamId);
                        showToast(item.isFavorite ? 'Removed from favorites' : 'Saved to favorites! ⭐');
                      }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm transition-all active:scale-95 ${
                        item.isFavorite
                          ? 'bg-amber-100 text-amber-500 shadow-xs'
                          : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={item.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      <i className="fa-solid fa-star"></i>
                    </button>

                    {/* Moments Toggle Button */}
                    {hasMoments && (
                      <button
                        onClick={() =>
                          setExpandedMomentsStreamId(isMomentsExpanded ? null : (item.id || item.streamId))
                        }
                        className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isMomentsExpanded
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="View captured moments & highlights"
                      >
                        <i className="fa-solid fa-bookmark text-xs text-indigo-500"></i>
                        <span>{item.favoriteMoments?.length} Moments</span>
                        <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${isMomentsExpanded ? 'rotate-180' : ''}`}></i>
                      </button>
                    )}

                    {/* Watch Again Action Button */}
                    <button
                      onClick={() => handleReWatch(item)}
                      className="px-3.5 sm:px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                      title="Watch this stream again"
                    >
                      <i className="fa-solid fa-rotate-left text-xs"></i>
                      <span>Watch Again</span>
                    </button>

                    {/* Remove from history */}
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="w-8 h-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center text-xs"
                      title="Remove this stream from history"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </div>

                {/* Favorite Past Moments Drawer */}
                {hasMoments && isMomentsExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-bolt text-amber-500 text-xs"></i>
                        Favorite Past Moments
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Click a moment to jump right into the stream
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {item.favoriteMoments!.map((moment) => (
                        <div
                          key={moment.id}
                          onClick={() => handleJumpToMoment(item, moment)}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group/m"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-mono font-black flex-shrink-0 group-hover/m:scale-105 transition-transform">
                              {moment.timestampFormatted}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate group-hover/m:text-indigo-600">
                                {moment.label}
                              </h4>
                              {moment.note && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  {moment.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] shadow-2xs group-hover/m:bg-indigo-600 group-hover/m:text-white transition-colors flex-shrink-0">
                            <i className="fa-solid fa-arrow-right"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h4 className="text-base font-black text-slate-900 mb-1">
            {searchQuery || activeFilter !== 'all' ? 'No Matching History Found' : 'No Viewing History Yet'}
          </h4>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {searchQuery || activeFilter !== 'all'
              ? `No streams matched your query "${searchQuery}". Try a different filter or search term.`
              : 'Streams you watch will automatically be recorded here so you can re-watch past broadcasts and jump back to favorite moments.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
              onBack();
            }}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            Explore Live Streams Now
          </button>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col text-slate-900 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center text-xl mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-trash-can"></i>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Clear Viewing History?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              This will remove all recorded past streams and bookmarked moments from your device. This action cannot be undone.
            </p>

            <div className="space-y-2.5 w-full">
              <button
                onClick={handleClearAll}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Yes, Clear All History
              </button>

              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] max-w-sm w-[90%] sm:w-auto animate-fade-in-up pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 text-xs font-bold justify-center">
            <i className="fa-solid fa-circle-check text-emerald-400"></i>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
