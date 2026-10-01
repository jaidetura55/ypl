import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { TopStreamer, Stream, User } from '../types';
import { COUNTRIES } from '../constants';

interface TopStreamersWidgetProps {
  onSelectStream?: (stream: Stream) => void;
  onOpenProfile?: (user: User) => void;
}

type CurrencyMode = 'diamonds' | 'usd' | 'sgd' | 'myr' | 'idr';

export default function TopStreamersWidget({ onSelectStream, onOpenProfile }: TopStreamersWidgetProps) {
  const { topStreamers, streams, economySettings, refreshTopStreamers, users, followedUserIds, toggleFollow, currentUser } = useData();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyMode>('diamonds');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Record<string, number>>({});
  const prevEarningsRef = useRef<Record<string, number>>({});

  // Detect real-time diamond earning increases to trigger radiant animations
  useEffect(() => {
    const newUpdates: Record<string, number> = {};
    topStreamers.forEach(s => {
      const prev = prevEarningsRef.current[s.id];
      if (prev !== undefined && s.diamondsEarned > prev) {
        newUpdates[s.id] = s.diamondsEarned - prev;
      }
      prevEarningsRef.current[s.id] = s.diamondsEarned;
    });

    if (Object.keys(newUpdates).length > 0) {
      setRecentlyUpdatedIds(prev => ({ ...prev, ...newUpdates }));
      const timer = setTimeout(() => {
        setRecentlyUpdatedIds({});
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [topStreamers]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshTopStreamers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Format currency based on current selection
  const formatEarnings = (streamer: TopStreamer) => {
    switch (selectedCurrency) {
      case 'usd':
        return `$${streamer.earningsUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'sgd':
        return `S$${streamer.earningsSgd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'myr':
        return `RM${streamer.earningsMyr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'idr':
        return `Rp${streamer.earningsIdr.toLocaleString()}`;
      case 'diamonds':
      default:
        return `${streamer.diamondsEarned.toLocaleString()}`;
    }
  };

  const getCurrencyLabel = () => {
    switch (selectedCurrency) {
      case 'usd': return 'USD Profit';
      case 'sgd': return 'SGD Profit';
      case 'myr': return 'MYR Profit';
      case 'idr': return 'IDR Profit';
      default: return 'Diamond Earnings';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        bg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-400/40',
        ring: 'ring-amber-400',
        glow: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        icon: '👑',
        label: '1st Champion',
        trophyColor: 'text-amber-400'
      };
    }
    if (rank === 2) {
      return {
        bg: 'bg-gradient-to-r from-slate-200 via-gray-300 to-slate-400 text-slate-900 shadow-slate-300/40',
        ring: 'ring-slate-300',
        glow: 'from-slate-300/15 via-slate-400/5 to-transparent',
        icon: '🥈',
        label: '2nd Runner-up',
        trophyColor: 'text-slate-300'
      };
    }
    if (rank === 3) {
      return {
        bg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-amber-600/40',
        ring: 'ring-amber-600',
        glow: 'from-amber-600/15 via-orange-600/5 to-transparent',
        icon: '🥉',
        label: '3rd Place',
        trophyColor: 'text-amber-600'
      };
    }
    return {
      bg: 'bg-slate-800 text-white shadow-slate-800/20',
      ring: 'ring-slate-700',
      glow: 'from-slate-700/10 to-transparent',
      icon: `#${rank}`,
      label: `#${rank} Top Earner`,
      trophyColor: 'text-slate-400'
    };
  };

  const handleStreamerClick = (streamer: TopStreamer) => {
    if (streamer.isLive && onSelectStream) {
      // Find matching live stream from streams list or construct matching stream
      const matchedStream = streams.find(s => s.broadcaster?.id === streamer.id || s.id === streamer.streamId);
      if (matchedStream) {
        onSelectStream(matchedStream);
        return;
      }
      // Fallback construct stream
      const syntheticStream: Stream = {
        id: streamer.streamId || `stream_${streamer.id}`,
        title: streamer.streamTitle || `${streamer.name}'s Live Show`,
        viewerCount: streamer.viewerCount || 1200,
        thumbnail: streamer.avatar,
        category: 'Live',
        country: streamer.country || 'ID',
        quality: '1080p',
        broadcaster: {
          id: streamer.id,
          name: streamer.name,
          avatar: streamer.avatar,
          level: streamer.level,
          diamonds: 5000,
          beans: streamer.diamondsEarned,
          followers: streamer.followers,
          following: 20,
          country: streamer.country || 'ID'
        }
      };
      onSelectStream(syntheticStream);
      return;
    }

    // Open profile modal if available
    if (onOpenProfile) {
      const existingUser = users.find(u => u.id === streamer.id) || {
        id: streamer.id,
        name: streamer.name,
        username: streamer.nickname || streamer.name.toLowerCase().replace(/\s+/g, ''),
        avatar: streamer.avatar,
        level: streamer.level,
        diamonds: 5000,
        beans: streamer.diamondsEarned,
        followers: streamer.followers,
        following: 50,
        country: streamer.country || 'ID',
        isVerified: streamer.level >= 30,
        bio: `Top Ranked Streamer on YoungPapi Live · 💎 ${streamer.diamondsEarned.toLocaleString()} Diamonds Earned`
      };
      onOpenProfile(existingUser as User);
    }
  };

  return (
    <div className="mb-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 sm:p-5 text-white shadow-xl shadow-indigo-950/20 border border-white/10">
      {/* Background ambient radiance */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full"></div>

      {/* Header bar: Title, Real-time badge, Currency selector, Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 flex-shrink-0">
            <i className="fa-solid fa-trophy text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Top Streamers
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Economy</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Top 5 creators ranked by virtual economy diamond gifts & profit share
            </p>
          </div>
        </div>

        {/* Currency Selector Controls + Refresh Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSelectedCurrency('diamonds')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedCurrency === 'diamonds'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Show Diamonds"
            >
              💎 Diamonds
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('usd')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCurrency === 'usd'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="USD Equivalent"
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('sgd')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCurrency === 'sgd'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="SGD Equivalent"
            >
              SGD
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('myr')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCurrency === 'myr'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="MYR Equivalent"
            >
              MYR
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('idr')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCurrency === 'idr'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="IDR Equivalent"
            >
              IDR
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
            title="Refresh Leaderboard"
          >
            <i className={`fa-solid fa-rotate text-xs ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Top 5 Streamers Cards Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
        {topStreamers.slice(0, 5).map((streamer, idx) => {
          const rank = streamer.rank || idx + 1;
          const badge = getRankBadge(rank);
          const isUpdated = !!recentlyUpdatedIds[streamer.id];
          const gainedDiamonds = recentlyUpdatedIds[streamer.id];
          const countryInfo = COUNTRIES.find(c => c.code === streamer.country);
          const isFollowed = followedUserIds.includes(streamer.id);

          return (
            <div
              key={streamer.id}
              onClick={() => handleStreamerClick(streamer)}
              className={`relative rounded-2xl p-3.5 bg-gradient-to-b ${badge.glow} bg-slate-900/80 border border-white/10 hover:border-white/30 hover:bg-slate-800/90 transition-all cursor-pointer group flex flex-col justify-between ${
                isUpdated ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.02]' : ''
              }`}
            >
              {/* Real-time increase notification pill */}
              {isUpdated && gainedDiamonds && (
                <div className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] shadow-lg shadow-emerald-500/50 animate-bounce z-20 flex items-center gap-1">
                  <span>+{gainedDiamonds.toLocaleString()} 💎</span>
                </div>
              )}

              {/* Top row: Rank badge + Live badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-sm ${badge.bg}`}>
                    {badge.icon} #{rank}
                  </span>
                </div>

                {streamer.isLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Live</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Offline
                  </span>
                )}
              </div>

              {/* Streamer Avatar and Identity */}
              <div className="flex flex-col items-center text-center mb-3">
                <div className="relative mb-2">
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden ring-2 ${badge.ring} shadow-md transition-transform group-hover:scale-105 relative`}>
                    <img
                      src={streamer.avatar}
                      alt={streamer.name}
                      className="w-full h-full object-cover"
                    />
                    {streamer.isLive && (
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 to-transparent"></div>
                    )}
                  </div>

                  {/* Level Badge */}
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[8px] font-black rounded-md uppercase tracking-wider shadow-sm border border-white/30 whitespace-nowrap">
                    Lv.{streamer.level}
                  </span>
                </div>

                <div className="w-full px-1">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
                    {streamer.name}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    {countryInfo && (
                      <span title={countryInfo.name}>
                        {countryInfo.flag} {countryInfo.code}
                      </span>
                    )}
                    <span className="text-white/30">·</span>
                    <span>{streamer.followers.toLocaleString()} fans</span>
                  </div>
                </div>
              </div>

              {/* Earnings card & Action button */}
              <div className="mt-auto pt-2 border-t border-white/5 flex flex-col gap-2">
                <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                    {getCurrencyLabel()}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {selectedCurrency === 'diamonds' && (
                      <span className="text-cyan-400 text-xs">💎</span>
                    )}
                    <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                      {formatEarnings(streamer)}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                {streamer.isLive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStreamerClick(streamer);
                    }}
                    className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <i className="fa-solid fa-play text-[8px]"></i>
                    <span>Watch Live</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(streamer.id);
                    }}
                    className={`w-full py-1.5 px-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                      isFollowed
                        ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <i className={`fa-solid ${isFollowed ? 'fa-check text-emerald-400' : 'fa-plus'} text-[8px]`}></i>
                    <span>{isFollowed ? 'Following' : 'Follow'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info: Virtual Economy split ratio hint */}
      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-cyan-400"></i>
          <span>
            Virtual Economy Split: <strong className="text-white">{economySettings.streamerCutPercentage}% Streamer</strong> / <strong className="text-slate-300">{economySettings.companyCutPercentage}% Company</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Rates: 100 💎 = $1.00 USD</span>
          <span className="text-white/20">·</span>
          <span>1 USD = {economySettings.usdToSgd || 1.35} SGD</span>
          <span className="text-white/20">·</span>
          <span>{economySettings.usdToMyr || 4.45} MYR</span>
          <span className="text-white/20">·</span>
          <span>Rp {economySettings.usdToIdr?.toLocaleString() || '15,800'} IDR</span>
        </div>
      </div>
    </div>
  );
}
