import React, { useEffect } from 'react';
import { LiveStreamNotification, Stream } from '../types';

interface LiveNotificationToastProps {
  notification: LiveStreamNotification | null;
  onWatch: (notification: LiveStreamNotification) => void;
  onDismiss: () => void;
}

export default function LiveNotificationToast({
  notification,
  onWatch,
  onDismiss
}: LiveNotificationToastProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[85] w-[94%] max-w-md animate-fade-in-down pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border-2 border-rose-500/50 shadow-rose-500/20 flex items-center justify-between gap-3">
        {/* Left: Pulsing Avatar & Broadcaster */}
        <div
          onClick={() => onWatch(notification)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-500 shadow-md">
              <img
                src={notification.broadcaster.avatar || 'https://picsum.photos/seed/broadcaster/200'}
                alt={notification.broadcaster.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            {/* Pulsing Red LIVE indicator */}
            <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-black text-[8px] uppercase tracking-tighter px-1.5 py-0.2 rounded-full border border-slate-900 flex items-center gap-0.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              LIVE
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs sm:text-sm text-white truncate group-hover:text-rose-400 transition-colors">
                {notification.broadcaster.name}
              </h4>
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 whitespace-nowrap">
                Live Now
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
              {notification.streamTitle || 'Started a new live stream'}
            </p>
            {notification.category && (
              <span className="text-[10px] text-slate-400 font-bold">
                #{notification.category}
              </span>
            )}
          </div>
        </div>

        {/* Right: Watch Button & Dismiss */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onWatch(notification)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-play text-[10px]"></i>
            <span>Watch</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Dismiss notification"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
