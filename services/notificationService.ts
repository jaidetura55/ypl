import { LiveStreamNotification, Stream, User } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'youngpapi_live_notifications';
const FOLLOWED_USERS_KEY = 'youngpapi_followed_user_ids';

// Default initial follow list if user hasn't modified it yet
export const DEFAULT_FOLLOWED_USER_IDS = [
  '100000000001', // Luna_Sky
  '100000000102', // Mike_Drops
  '100000000101', // SarahVibes
];

export const getStoredFollowedUserIds = (): string[] => {
  try {
    const raw = localStorage.getItem(FOLLOWED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed default followed streamers
    localStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(DEFAULT_FOLLOWED_USER_IDS));
    return DEFAULT_FOLLOWED_USER_IDS;
  } catch (e) {
    return DEFAULT_FOLLOWED_USER_IDS;
  }
};

export const saveFollowedUserIds = (ids: string[]): void => {
  try {
    localStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(ids));
  } catch (e) {}
};

export const getStoredLiveNotifications = (): LiveStreamNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveLiveNotifications = (notifications: LiveStreamNotification[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
  } catch (e) {}
};

// Play a pleasant, subtle two-tone chime when a streamer goes live
export const playLiveNotificationChime = (): void => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First tone (E5 ~ 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second higher tone (A5 ~ 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (e) {}
};

// Trigger browser native notification if permitted
export const triggerBrowserNotification = (notification: LiveStreamNotification): void => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🔴 ${notification.broadcaster.name} is LIVE!`, {
          body: notification.streamTitle || 'Join the live stream now on YoungPapi Live',
          icon: notification.broadcaster.avatar || '/icon.png'
        });
      }
    }
  } catch (e) {}
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
    }
  } catch (e) {}
  return false;
};
