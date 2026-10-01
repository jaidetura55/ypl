import React, { useState } from 'react';
import { LiveStreamNotification, Stream, User } from '../types';
import { useData } from '../contexts/DataContext';
import { requestNotificationPermission } from '../services/notificationService';

interface LiveNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStream: (stream: Stream) => void;
}

export default function LiveNotificationCenterModal({
  isOpen,
  onClose,
  onSelectStream
}: LiveNotificationCenterModalProps) {
  const {
    liveNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    followedUserIds,
    toggleFollow,
    streams,
    users,
    triggerLiveNotification
  } = useData();

  const [activeTab, setActiveTab] = useState<'notifications' | 'following'>('notifications');
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  if (!isOpen) return null;

  // Resolve a playable stream from a notification
  const resolveStream = (notif: LiveStreamNotification): Stream => {
    const existing = streams.find(s => s.id === notif.streamId || s.broadcaster.id === notif.broadcaster.id);
    if (existing) return existing;

    const matchedUser = users.find(u => u.id === notif.broadcaster.id) || {
      id: notif.broadcaster.id,
      name: notif.broadcaster.name,
      avatar: notif.broadcaster.avatar,
      level: notif.broadcaster.level || 20,
      diamonds: 1500,
      followers: 8400,
      following: 12,
      country: notif.country || 'ID',
      vvipStatus: 'vip' as const
    };

    return {
      id: notif.streamId,
      title: notif.streamTitle,
      broadcaster: matchedUser,
      viewerCount: 940,
      thumbnail: notif.thumbnail || matchedUser.avatar || 'https://picsum.photos/seed/live/800/600',
      category: notif.category || 'Live',
      country: notif.country || 'ID',
      quality: '1080p',
      startTime: notif.timestamp
    };
  };

  const handleWatch = (notif: LiveStreamNotification) => {
    markNotificationAsRead(notif.id);
    const stream = resolveStream(notif);
    onClose();
    onSelectStream(stream);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
  };

  const followedUsers = users.filter(u => followedUserIds.includes(u.id));

  const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Earlier';
  };

  const handleTestAlert = () => {
    // Pick the first followed user, or Luna_Sky
    const targetUser = followedUsers[0] || users[0] || {
      id: '100000000001',
      name: 'Luna_Sky',
      avatar: 'https://picsum.photos/seed/luna/200',
      level: 42
    };

    // Ensure they are followed so the follow list logic triggers
    if (!followedUserIds.includes(targetUser.id)) {
      toggleFollow(targetUser.id);
    }

    triggerLiveNotification({
      streamId: `test_stream_${Date.now()}`,
      streamTitle: 'Special Live Concert & Fan Chat 🎉',
      broadcaster: {
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        level: targetUser.level
      },
      category: 'Music',
      thumbnail: targetUser.avatar
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in text-slate-800">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden animate-fade-in-up">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shadow-inner">
              <i className="fa-solid fa-bell"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Live Alerts</h3>
                {unreadNotificationCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {unreadNotificationCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Real-time alerts when streamers you follow go live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="px-5 pt-3 flex items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-3 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'notifications'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className="fa-solid fa-tower-broadcast text-xs"></i>
              <span>Live Alerts ({liveNotifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              className={`pb-3 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className="fa-solid fa-heart text-xs"></i>
              <span>Follow List ({followedUserIds.length})</span>
            </button>
          </div>

          {activeTab === 'notifications' && liveNotifications.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Mark Read
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={clearNotifications}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {/* Browser Permission Banner if not enabled */}
          {!hasPermission && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <i className="fa-solid fa-circle-info text-indigo-500 text-sm flex-shrink-0"></i>
                <span className="text-indigo-900 font-medium truncate">
                  Enable device push notifications for live alerts
                </span>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider flex-shrink-0 shadow-xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* Test Live Alert Trigger Banner */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs flex-shrink-0">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate">Test Real-Time Alert</h4>
                <p className="text-[10px] text-slate-300 truncate">
                  Trigger an immediate live alert for your followed streamer
                </p>
              </div>
            </div>
            <button
              onClick={handleTestAlert}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-wider flex-shrink-0 active:scale-95 shadow-md shadow-rose-600/30 transition-all flex items-center gap-1"
            >
              <i className="fa-solid fa-play text-[9px]"></i>
              <span>Test Alert</span>
            </button>
          </div>

          {activeTab === 'notifications' ? (
            liveNotifications.length > 0 ? (
              <div className="space-y-2.5">
                {liveNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleWatch(notif)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      !notif.isRead
                        ? 'bg-rose-50/50 border-rose-200/80 shadow-xs'
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar with red badge */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={notif.broadcaster.avatar || 'https://picsum.photos/seed/avatar/100'}
                          alt={notif.broadcaster.name}
                          className="w-11 h-11 rounded-2xl object-cover border-2 border-rose-500"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                            {notif.broadcaster.name}
                          </h4>
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                            LIVE
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                          {notif.streamTitle}
                        </p>
                        {notif.category && (
                          <span className="text-[10px] text-indigo-600 font-bold">
                            #{notif.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatch(notif);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-sm shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-play text-[9px]"></i>
                        <span>Watch</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl border border-slate-100">
                  <i className="fa-regular fa-bell"></i>
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">No Live Alerts Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
                  Whenever a streamer from your follow list starts streaming, you will receive an instant real-time sound and banner alert.
                </p>
                <button
                  onClick={handleTestAlert}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider transition-all"
                >
                  Simulate Live Streamer Alert
                </button>
              </div>
            )
          ) : (
            /* Follow List Tab */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium">
                You receive instant alerts for these streamers when they go live. Click the heart to follow or unfollow.
              </div>

              {users.map((user) => {
                const isFollowed = followedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar || 'https://picsum.photos/seed/user/100'}
                        alt={user.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-black text-xs text-slate-900 truncate">{user.name}</h5>
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                            Lv.{user.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user.followers?.toLocaleString() || 0} followers
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${
                        isFollowed
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-indigo-600 text-white shadow-xs'
                      }`}
                    >
                      <i className={`fa-solid ${isFollowed ? 'fa-heart text-rose-500' : 'fa-plus'}`}></i>
                      <span>{isFollowed ? 'Following' : 'Follow'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
