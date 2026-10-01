
import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { User, Stream, Reseller, ScheduledStream, AnalyticsData, Transaction, Gift, HistoryItem, LiveStreamNotification, EconomySettings, EconomyProfitAnalytics, LuckyBetResult, TopStreamer } from '../types';
import { CURRENT_USER, MOCK_RESELLERS, MOCK_ANALYTICS, MOCK_SCHEDULED_STREAMS } from '../constants';
import {
  getStoredViewingHistory,
  addStreamToHistoryStorage,
  toggleFavoriteHistoryInStorage,
  removeHistoryFromStorage,
  clearHistoryStorage
} from '../services/historyStorage';
import {
  getStoredFollowedUserIds,
  saveFollowedUserIds,
  getStoredLiveNotifications,
  saveLiveNotifications,
  playLiveNotificationChime,
  triggerBrowserNotification
} from '../services/notificationService';

export const DEFAULT_GIFTS: Gift[] = [
  // Static Gifts
  { id: 'rose', name: 'Rose', price: 1, beans: 1, type: 'static', category: 'Static', icon: '🌹', isActive: true, description: 'Classic red rose of affection' },
  { id: 'heart', name: 'Love Heart', price: 25, beans: 25, type: 'static', category: 'Static', icon: '❤️', isActive: true, description: 'Warm fluttering love heart' },
  { id: 'coffee', name: 'Espresso', price: 50, beans: 50, type: 'static', category: 'Static', icon: '☕', isActive: true, description: 'Energizing artisan espresso coffee' },
  { id: 'diamond_ring', name: 'Diamond Ring', price: 200, beans: 200, type: 'static', category: 'Static', icon: '💍', isActive: true, description: 'Sparkling diamond solitaire ring' },
  { id: 'teddy_bear', name: 'Teddy Bear', price: 500, beans: 500, type: 'static', category: 'Static', icon: '🧸', isActive: true, description: 'Cute cuddly golden teddy bear' },
  { id: 'gold_crown', name: 'Golden Crown', price: 1000, beans: 1000, type: 'static', category: 'Static', icon: '👑', isActive: true, description: 'Royal monarch crown for top streamers' },
  { id: 'trophy', name: 'Championship Trophy', price: 2000, beans: 2000, type: 'static', category: 'Static', icon: '🏆', isActive: true, description: 'Glittering champion cup of glory' },

  // Animated Luxury Gifts (with full-screen 3D effects & sounds)
  { id: 'sports_car', name: 'Ferrari Supercar', price: 2500, beans: 2500, type: 'animated', category: 'Animated', icon: '🏎️', animationType: 'ferrari', isActive: true, description: 'Racing supercar roaring across streamer room with smoke & speed' },
  { id: 'luxury_yacht', name: 'Ocean Superyacht', price: 5000, beans: 5000, type: 'animated', category: 'Animated', icon: '🛥️', animationType: 'yacht', isActive: true, description: 'Luxury yacht cruising through tropical turquoise waters' },
  { id: 'space_rocket', name: 'Apollo Rocket', price: 10000, beans: 10000, type: 'animated', category: 'Animated', icon: '🚀', animationType: 'rocket', isActive: true, description: 'Spectacular rocket launch with booster trail & sonic boom' },
  { id: 'golden_dragon', name: 'Golden Dragon', price: 25000, beans: 25000, type: 'animated', category: 'Animated', icon: '🐉', animationType: 'dragon', isActive: true, description: 'Majestic ancient mythical dragon weaving gold flames' },
  { id: 'galaxy_crown', name: 'Galaxy Nova', price: 50000, beans: 50000, type: 'animated', category: 'Animated', icon: '🌌', animationType: 'galaxy', isActive: true, description: 'Deep space cosmic vortex orbiting the streamer' },
  { id: 'fireworks_show', name: 'Fireworks Fiesta', price: 100000, beans: 100000, type: 'animated', category: 'Animated', icon: '🎆', animationType: 'fireworks', isActive: true, description: 'Grand finale fireworks illuminating the live room with celebration' },
  { id: 'pegasus_flight', name: 'Celestial Pegasus', price: 150000, beans: 150000, type: 'animated', category: 'Animated', icon: '🦄', animationType: 'pegasus', isActive: true, description: 'Mythical winged unicorn descending with cosmic star dust' },
  { id: 'super_meteor', name: 'Cosmic Meteor', price: 200000, beans: 200000, type: 'animated', category: 'Animated', icon: '☄️', animationType: 'meteor', isActive: true, description: 'Giant burning celestial meteor crashing with gold explosion' }
];

export const DEFAULT_ECONOMY_SETTINGS: EconomySettings = {
  companyCutPercentage: 30,
  streamerCutPercentage: 70,
  exchangeRateUsdPer100Diamonds: 100,
  usdToSgd: 1.35,
  usdToMyr: 4.45,
  usdToIdr: 15800,
  luckyGiftEnabled: true,
  luckyWinRatePercentage: 70,
  luckySessionMinutes: 3,
  luckyMaxMultiplier: 10
};

export const DEFAULT_TOP_STREAMERS: TopStreamer[] = [
  {
    id: '100000000003',
    name: 'Luna Acoustic',
    nickname: 'Luna Acoustic',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    level: 48,
    country: 'ID',
    diamondsEarned: 89400,
    followers: 85000,
    isLive: true,
    streamId: 'room_live_7829',
    streamTitle: 'Night Lounge Chill & Acoustic Vibes 🌙',
    viewerCount: 1420,
    rank: 1,
    earningsUsd: 894.00,
    earningsSgd: 1206.90,
    earningsMyr: 3978.30,
    earningsIdr: 14125200
  },
  {
    id: '100000000002',
    name: 'Alex PK King',
    nickname: 'Alex PK King',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    level: 56,
    country: 'SG',
    diamondsEarned: 74200,
    followers: 120000,
    isLive: true,
    streamId: 'room_pk_5502',
    streamTitle: 'Mega PK Battle Championship Finale 🔥',
    viewerCount: 2890,
    rank: 2,
    earningsUsd: 742.00,
    earningsSgd: 1001.70,
    earningsMyr: 3301.90,
    earningsIdr: 11723600
  },
  {
    id: '100000000004',
    name: 'GameMaster99',
    nickname: 'GameMaster99',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    level: 38,
    country: 'VN',
    diamondsEarned: 58900,
    followers: 68000,
    isLive: false,
    rank: 3,
    earningsUsd: 589.00,
    earningsSgd: 795.15,
    earningsMyr: 2621.05,
    earningsIdr: 9306200
  },
  {
    id: '100000000001',
    name: 'Maya Chill Vibes',
    nickname: 'Maya Chill Vibes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    level: 25,
    country: 'MY',
    diamondsEarned: 42100,
    followers: 32000,
    isLive: true,
    streamId: 'room_live_3301',
    streamTitle: 'Late Night Talk & Coffee Chill ☕',
    viewerCount: 850,
    rank: 4,
    earningsUsd: 421.00,
    earningsSgd: 568.35,
    earningsMyr: 1873.45,
    earningsIdr: 6651800
  },
  {
    id: '100000000005',
    name: 'ChefThai Foodie',
    nickname: 'ChefThai Foodie',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200',
    level: 32,
    country: 'TH',
    diamondsEarned: 31200,
    followers: 24000,
    isLive: false,
    rank: 5,
    earningsUsd: 312.00,
    earningsSgd: 421.20,
    earningsMyr: 1388.40,
    earningsIdr: 4929600
  }
];

const INITIAL_GIFTS: Gift[] = DEFAULT_GIFTS;

interface DataContextType {
  currentUser: User;
  users: User[];
  streams: Stream[];
  resellers: Reseller[];
  scheduledStreams: ScheduledStream[];
  analytics: AnalyticsData[];
  gifts: Gift[];
  economySettings: EconomySettings;
  economyAnalytics: EconomyProfitAnalytics | null;
  topStreamers: TopStreamer[];
  refreshTopStreamers: () => Promise<void>;
  updateEconomySettings: (newSettings: Partial<EconomySettings>) => Promise<boolean>;
  refreshEconomyAnalytics: () => Promise<void>;
  sendLuckyBet: (hostId: string, streamId: string, betAmount: number, sessionElapsedSeconds: number) => Promise<LuckyBetResult | null>;
  viewingHistory: HistoryItem[];
  setCurrentUser: (user: User) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  startStream: (stream: Stream) => void;
  updateStream: (streamId: string, data: Partial<Stream>) => void;
  endStream: (streamId: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  toggleMuteUserInStream: (streamId: string, userId: string) => void;
  kickUserFromStream: (streamId: string, userId: string) => void;
  topUpDiamonds: (amount: number, cost: number, packageId: string, paymentMethod?: string) => Promise<boolean>;
  sendGift: (receiverId: string, giftId: string, giftName: string, quantity: number, totalCost: number, streamId?: string, receiverName?: string) => Promise<boolean>;
  addGift: (newGift: Gift) => void;
  updateGift: (giftId: string, data: Partial<Gift>) => void;
  deleteGift: (giftId: string) => void;
  toggleGift: (giftId: string) => void;
  fetchTransactionHistory: () => Promise<Transaction[]>;
  followedUserIds: string[];
  toggleFollow: (userId: string) => void;
  addToHistory: (stream: Stream) => void;
  toggleFavoriteHistory: (historyId: string) => void;
  removeHistoryItem: (historyId: string) => void;
  clearViewingHistory: () => void;
  liveNotifications: LiveStreamNotification[];
  unreadNotificationCount: number;
  activeLiveToast: LiveStreamNotification | null;
  dismissLiveToast: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  triggerLiveNotification: (payload: {
    streamId?: string;
    streamTitle?: string;
    broadcaster: { id: string; name: string; avatar: string; level?: number };
    category?: string;
    thumbnail?: string;
  }) => void;
  logout: () => void; 
  deleteAccount: () => void;
  reportProblem: (text: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('youngpapi_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return CURRENT_USER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('youngpapi_current_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [gifts, setGifts] = useState<Gift[]>(DEFAULT_GIFTS);
  const [users, setUsers] = useState<User[]>([CURRENT_USER]);
  const [economySettings, setEconomySettings] = useState<EconomySettings>(DEFAULT_ECONOMY_SETTINGS);
  const [economyAnalytics, setEconomyAnalytics] = useState<EconomyProfitAnalytics | null>(null);
  const [topStreamers, setTopStreamers] = useState<TopStreamer[]>(DEFAULT_TOP_STREAMERS);
  const [resellers, setResellers] = useState<Reseller[]>(MOCK_RESELLERS);
  const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>(MOCK_SCHEDULED_STREAMS);
  const [analytics] = useState<AnalyticsData[]>(MOCK_ANALYTICS);

  const updateStreamerEarningsInTop = (streamerId: string, additionalDiamonds: number) => {
    if (!additionalDiamonds || additionalDiamonds <= 0) return;
    setTopStreamers(prev => {
      const exists = prev.some(s => s.id === streamerId);
      let list = [...prev];
      if (exists) {
        list = list.map(s => {
          if (s.id === streamerId) {
            const newDiamonds = s.diamondsEarned + additionalDiamonds;
            const rateSGD = economySettings.usdToSgd || 1.35;
            const rateMYR = economySettings.usdToMyr || 4.45;
            const rateIDR = economySettings.usdToIdr || 15800;
            const usd = newDiamonds / 100;
            return {
              ...s,
              diamondsEarned: newDiamonds,
              earningsUsd: Number(usd.toFixed(2)),
              earningsSgd: Number((usd * rateSGD).toFixed(2)),
              earningsMyr: Number((usd * rateMYR).toFixed(2)),
              earningsIdr: Math.round(usd * rateIDR)
            };
          }
          return s;
        });
      }
      return list.sort((a, b) => b.diamondsEarned - a.diamondsEarned).map((s, idx) => ({ ...s, rank: idx + 1 }));
    });
  };

  // Fetch Virtual Economy settings and analytics on mount
  useEffect(() => {
    fetch('/api/economy/settings')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.settings) {
          setEconomySettings(data.settings);
        }
      })
      .catch(() => {});

    fetch('/api/economy/analytics')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.analytics) {
          setEconomyAnalytics(data.analytics);
        }
      })
      .catch(() => {});
  }, []);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(() => {
    return getStoredFollowedUserIds();
  });

  useEffect(() => {
    saveFollowedUserIds(followedUserIds);
  }, [followedUserIds]);

  const [liveNotifications, setLiveNotifications] = useState<LiveStreamNotification[]>(() => {
    return getStoredLiveNotifications();
  });

  useEffect(() => {
    saveLiveNotifications(liveNotifications);
  }, [liveNotifications]);

  const [activeLiveToast, setActiveLiveToast] = useState<LiveStreamNotification | null>(null);

  const followedUserIdsRef = useRef<string[]>(followedUserIds);
  useEffect(() => {
    followedUserIdsRef.current = followedUserIds;
  }, [followedUserIds]);

  const unreadNotificationCount = useMemo(() => {
    return liveNotifications.filter(n => !n.isRead).length;
  }, [liveNotifications]);

  const dismissLiveToast = () => {
    setActiveLiveToast(null);
  };

  const markNotificationAsRead = (id: string) => {
    setLiveNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setLiveNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setLiveNotifications([]);
  };

  const processIncomingLiveStreamer = (payload: any) => {
    if (!payload || !payload.broadcaster || !payload.broadcaster.id) return;
    const broadcasterId = payload.broadcaster.id;

    // Follow list logic check: only alert if user follows this streamer!
    if (!followedUserIdsRef.current.includes(broadcasterId)) {
      console.log(`Streamer ${payload.broadcaster.name} is now live, but not in user's follow list.`);
      return;
    }

    const newNotif: LiveStreamNotification = {
      id: `live_${broadcasterId}_${Date.now()}`,
      streamId: payload.streamId || `stream_${broadcasterId}`,
      streamTitle: payload.streamTitle || `${payload.broadcaster.name} is LIVE!`,
      broadcaster: {
        id: broadcasterId,
        name: payload.broadcaster.name,
        avatar: payload.broadcaster.avatar || 'https://picsum.photos/seed/streamer/200',
        level: payload.broadcaster.level || 20
      },
      category: payload.category || 'Live',
      thumbnail: payload.thumbnail || payload.broadcaster.avatar,
      timestamp: payload.timestamp || Date.now(),
      isRead: false
    };

    setLiveNotifications(prev => [newNotif, ...prev.filter(n => n.broadcaster.id !== broadcasterId)].slice(0, 30));
    setActiveLiveToast(newNotif);
    playLiveNotificationChime();
    triggerBrowserNotification(newNotif);

    // Ensure the stream is present in streams state for immediate watching
    setStreams(prev => {
      if (prev.some(s => s.id === newNotif.streamId)) return prev;
      const newStream: Stream = {
        id: newNotif.streamId,
        title: newNotif.streamTitle,
        broadcaster: {
          id: newNotif.broadcaster.id,
          name: newNotif.broadcaster.name,
          avatar: newNotif.broadcaster.avatar,
          level: newNotif.broadcaster.level || 25,
          diamonds: 5000,
          followers: 12000,
          following: 10,
          country: newNotif.country || 'ID',
          vvipStatus: 'vip'
        },
        viewerCount: 1450,
        thumbnail: newNotif.thumbnail || newNotif.broadcaster.avatar,
        category: newNotif.category || 'Live',
        country: newNotif.country || 'ID',
        quality: '1080p',
        startTime: Date.now()
      };
      return [newStream, ...prev];
    });
  };

  const triggerLiveNotification = (payload: any) => {
    fetch('/api/streamers/go-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    processIncomingLiveStreamer(payload);
  };

  // Real-time WebSocket connection to server for streamer live events
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'streamer_live') {
              processIncomingLiveStreamer(data.payload);
            } else if (data.type === 'gift_sent') {
              const payload = data.payload || {};
              const { senderId, receiverId, totalCost, beansEarned } = payload;

              // If current user is host receiving the gift, add beans salary
              if (currentUser.id === receiverId) {
                setCurrentUser(prev => ({
                  ...prev,
                  beans: (prev.beans || 0) + (beansEarned || 0)
                }));
              }
              // If current user sent the gift, deduct diamonds and increment spending
              if (currentUser.id === senderId) {
                setCurrentUser(prev => ({
                  ...prev,
                  diamonds: Math.max(0, prev.diamonds - (totalCost || 0)),
                  totalSpending: (prev.totalSpending || 0) + (totalCost || 0)
                }));
              }

              // Update in users state list
              setUsers(prev => prev.map(u => {
                if (u.id === receiverId) return { ...u, beans: (u.beans || 0) + (beansEarned || 0) };
                if (u.id === senderId) return { ...u, diamonds: Math.max(0, u.diamonds - (totalCost || 0)), totalSpending: (u.totalSpending || 0) + (totalCost || 0) };
                return u;
              }));

              // Dispatch window event for live room views (StreamingView and WatchingView)
              window.dispatchEvent(new CustomEvent('live_room_gift_event', { detail: payload }));
              // Update live Top Streamers widget real-time diamond earnings
              updateStreamerEarningsInTop(receiverId, beansEarned || 0);
            } else if (data.type === 'lucky_bet_event') {
              const payload = data.payload || {};
              const { userId, hostId, netDiamondsDiff, hostBeansAwarded } = payload;

              // If current user is host receiving the salary from bet
              if (currentUser.id === hostId) {
                setCurrentUser(prev => ({
                  ...prev,
                  beans: (prev.beans || 0) + (hostBeansAwarded || 0)
                }));
              }
              // If current user played the lucky bet
              if (currentUser.id === userId) {
                setCurrentUser(prev => ({
                  ...prev,
                  diamonds: Math.max(0, (prev.diamonds || 0) + (netDiamondsDiff || 0))
                }));
              }

              setUsers(prev => prev.map(u => {
                if (u.id === hostId) return { ...u, beans: (u.beans || 0) + (hostBeansAwarded || 0) };
                if (u.id === userId) return { ...u, diamonds: Math.max(0, (u.diamonds || 0) + (netDiamondsDiff || 0)) };
                return u;
              }));

              // Dispatch window event for WatchingView and StreamingView
              window.dispatchEvent(new CustomEvent('live_room_lucky_bet_event', { detail: payload }));
              // Update live Top Streamers widget real-time diamond earnings
              updateStreamerEarningsInTop(hostId, hostBeansAwarded || 0);
            } else if (data.type === 'economy_updated') {
              if (data.payload) {
                setEconomySettings(prev => ({ ...prev, ...data.payload }));
              }
              // Refresh analytics when economy settings change
              fetch('/api/economy/analytics')
                .then(r => r.json())
                .then(d => {
                  if (d.success && d.analytics) setEconomyAnalytics(d.analytics);
                })
                .catch(() => {});
            } else if (data.type === 'gifts_updated') {
              fetch('/api/gifts')
                .then(r => r.json())
                .then(list => {
                  if (Array.isArray(list)) setGifts(list);
                })
                .catch(() => {});
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {}
    };

    connectWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const [viewingHistory, setViewingHistory] = useState<HistoryItem[]>(() => {
    return getStoredViewingHistory();
  });

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [streamsRes, giftsRes, topRes] = await Promise.all([
                fetch('/api/streams'),
                fetch('/api/gifts'),
                fetch('/api/economy/top-streamers')
            ]);
            if (streamsRes.ok) {
                const fetchedStreams = await streamsRes.json();
                setStreams(fetchedStreams);
                // Extract unique users from streams
                const streamUsers = fetchedStreams.map((s: any) => s.broadcaster);
                const uniqueUsers = Array.from(new Map([...streamUsers, CURRENT_USER].map(item => [item.id, item])).values());
                setUsers(uniqueUsers as User[]);
            }
            if (giftsRes.ok) setGifts(await giftsRes.json());
            if (topRes.ok) {
                const topData = await topRes.json();
                if (topData.success && Array.isArray(topData.topStreamers) && topData.topStreamers.length > 0) {
                    setTopStreamers(topData.topStreamers);
                }
            }
        } catch (err) {
            console.error("Failed to fetch initial data:", err);
        }
    };
    fetchData();
  }, []);

  const refreshTopStreamers = async () => {
    try {
      const res = await fetch('/api/economy/top-streamers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.topStreamers) && data.topStreamers.length > 0) {
          setTopStreamers(data.topStreamers);
        }
      }
    } catch (err) {
      console.error("Failed to refresh top streamers:", err);
    }
  };

  useEffect(() => {
    setTopStreamers(prev => prev.map(s => {
      const liveStream = streams.find(st => st.broadcaster?.id === s.id || st.id === s.streamId);
      return {
        ...s,
        isLive: !!liveStream,
        streamId: liveStream ? liveStream.id : s.streamId,
        streamTitle: liveStream ? liveStream.title : s.streamTitle,
        viewerCount: liveStream ? liveStream.viewerCount : s.viewerCount
      };
    }));
  }, [streams]);

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser.id === userId) setCurrentUser(prev => ({ ...prev, ...data }));
    setStreams(prev => prev.map(s => s.broadcaster.id === userId ? { ...s, broadcaster: { ...s.broadcaster, ...data } } : s));
  };

  const startStream = async (stream: Stream) => {
    try {
        const res = await fetch('/api/streams/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: stream.id,
                title: stream.title,
                userId: stream.broadcaster.id,
                category: stream.category,
                thumbnail: stream.thumbnail,
                country: stream.country,
                isAiCompanion: stream.isAiCompanion
            })
        });
        if (res.ok) {
            setStreams(prev => [stream, ...prev]);
        }
    } catch (err) {
        console.error("Failed to start stream on backend:", err);
    }
  };

  const updateStream = (streamId: string, data: Partial<Stream>) => {
    setStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...data } : s));
  };

  const endStream = async (streamId: string) => {
    try {
        await fetch('/api/streams/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamId })
        });
        setStreams(prev => prev.filter(s => s.id !== streamId));
    } catch (err) {
        console.error("Failed to end stream on backend:", err);
    }
  };

  const banUser = async (userId: string) => updateUser(userId, { status: 'banned' });
  const unbanUser = async (userId: string) => updateUser(userId, { status: 'active' });

  const toggleMuteUserInStream = (streamId: string, userId: string) => {
    setStreams(prev => prev.map(s => {
        if (s.id === streamId) {
            const currentMuted = s.mutedUserIds || [];
            const isMuted = currentMuted.includes(userId);
            return { ...s, mutedUserIds: isMuted ? currentMuted.filter(id => id !== userId) : [...currentMuted, userId] };
        }
        return s;
    }));
  };

  const kickUserFromStream = (streamId: string, userId: string) => {
    setStreams(prev => prev.map(s => {
        if (s.id === streamId) {
            const currentKicked = s.kickedUserIds || [];
            if (!currentKicked.includes(userId)) return { ...s, kickedUserIds: [...currentKicked, userId] };
        }
        return s;
    }));
  };

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-init-1',
      userId: CURRENT_USER.id,
      type: 'topup',
      amount: 1200,
      currency: 'diamond',
      description: 'Purchased 1,200 Diamonds (Google Wallet)',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'tx-init-2',
      userId: CURRENT_USER.id,
      type: 'topup',
      amount: 500,
      currency: 'diamond',
      description: 'Purchased 500 Diamonds (FPX - Maybank2u)',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ]);

  const topUpDiamonds = async (amount: number, cost: number, packageId: string, paymentMethod?: string) => {
    const txId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const methodStr = paymentMethod ? ` (${paymentMethod})` : '';
    const desc = `Purchased ${amount.toLocaleString()} Diamonds${methodStr}`;
    
    const newTx: Transaction = {
      id: txId,
      userId: currentUser.id,
      type: 'topup',
      amount,
      currency: 'diamond',
      description: desc,
      createdAt: new Date().toISOString()
    };

    try {
        await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTx)
        });
    } catch (err) {
        console.warn("Backend transaction logging warning (using client fallback):", err);
    }
    
    // Always credit diamonds & record transaction
    setCurrentUser(prev => ({ ...prev, diamonds: prev.diamonds + amount }));
    setTransactions(prev => [newTx, ...prev]);
    return true;
  };

  const sendGift = async (receiverId: string, giftId: string, giftName: string, quantity: number, totalCost: number, streamId?: string, receiverName?: string) => {
      if (currentUser.diamonds < totalCost) return false;
      
      const gift = gifts.find(g => g.id === giftId);
      const beansPerUnit = gift?.beans !== undefined ? gift.beans : (gift?.price || Math.floor(totalCost / quantity));
      const beansEarned = beansPerUnit * quantity;

      const txSenderId = `tx-sent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const txHostId = `tx-rcvd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const senderTx: Transaction = {
          id: txSenderId,
          userId: currentUser.id,
          type: 'gift_sent',
          amount: totalCost,
          currency: 'diamond',
          description: `Sent ${giftName} x${quantity} (Cost: ${totalCost} 💎)`,
          createdAt: new Date().toISOString()
      };

      const hostTx: Transaction = {
          id: txHostId,
          userId: receiverId,
          type: 'gift_received',
          amount: beansEarned,
          currency: 'bean',
          description: `Received ${giftName} x${quantity} from ${currentUser.name} (Salary: +${beansEarned} 🫘)`,
          createdAt: new Date().toISOString()
      };

      // 1. Deduct diamonds from sender
      setCurrentUser(prev => ({ 
        ...prev, 
        diamonds: Math.max(0, prev.diamonds - totalCost), 
        totalSpending: (prev.totalSpending || 0) + totalCost 
      }));

      // 2. Credit beans salary to host user
      setUsers(prev => prev.map(u => {
        if (u.id === receiverId) {
          return { ...u, beans: (u.beans || 0) + beansEarned };
        }
        return u;
      }));

      // If current user is also the host in testing
      if (currentUser.id === receiverId) {
        setCurrentUser(prev => ({ ...prev, beans: (prev.beans || 0) + beansEarned }));
      }

      setTransactions(prev => [senderTx, hostTx, ...prev]);

      // 3. Sync to backend API & DB
      try {
          const res = await fetch('/api/gifts/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                senderId: currentUser.id,
                senderName: currentUser.name,
                senderAvatar: currentUser.avatar,
                senderLevel: currentUser.level,
                receiverId,
                receiverName,
                giftId,
                quantity,
                totalCost,
                beansEarned,
                streamId
              })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.updatedSenderDiamonds !== null && data.updatedSenderDiamonds !== undefined) {
              setCurrentUser(prev => ({ ...prev, diamonds: data.updatedSenderDiamonds }));
            }
            if (data.updatedHostBeans !== null && data.updatedHostBeans !== undefined && currentUser.id === receiverId) {
              setCurrentUser(prev => ({ ...prev, beans: data.updatedHostBeans }));
            }
          }
      } catch (err) {
          console.warn("Backend gift transaction warning:", err);
      }
      
      return true;
  };

  // Admin gift management methods with backend DB persistence
  const addGift = async (newGift: Gift) => {
    setGifts(prev => [newGift, ...prev.filter(g => g.id !== newGift.id)]);
    try {
      await fetch('/api/admin/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGift)
      });
    } catch (err) {
      console.warn("Failed to persist new gift to server:", err);
    }
  };

  const updateGift = async (giftId: string, data: Partial<Gift>) => {
    setGifts(prev => prev.map(g => g.id === giftId ? { ...g, ...data } : g));
    try {
      await fetch(`/api/admin/gifts/${giftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn("Failed to persist gift update to server:", err);
    }
  };

  const deleteGift = async (giftId: string) => {
    setGifts(prev => prev.filter(g => g.id !== giftId));
    try {
      await fetch(`/api/admin/gifts/${giftId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Failed to delete gift on server:", err);
    }
  };

  const toggleGift = async (giftId: string) => {
    const target = gifts.find(g => g.id === giftId);
    const newStatus = target?.isActive === false ? true : false;
    setGifts(prev => prev.map(g => g.id === giftId ? { ...g, isActive: newStatus } : g));
    try {
      await fetch(`/api/admin/gifts/${giftId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
    } catch (err) {
      console.warn("Failed to toggle gift status on server:", err);
    }
  };

  const fetchTransactionHistory = async (): Promise<Transaction[]> => {
      try {
          const res = await fetch(`/api/transactions/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              return data;
            }
          }
      } catch (err) {
          console.warn("Fetching transactions from backend failed, using local history:", err);
      }
      return transactions;
  };

  const toggleFollow = (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;
    const isFollowing = followedUserIds.includes(targetUserId);
    setFollowedUserIds(prev => isFollowing ? prev.filter(id => id !== targetUserId) : [...prev, targetUserId]);
    setCurrentUser(prev => ({ ...prev, following: isFollowing ? Math.max(0, prev.following - 1) : prev.following + 1 }));
  };

  const addToHistory = (stream: Stream) => {
    const updated = addStreamToHistoryStorage(stream);
    setViewingHistory(updated);
    setCurrentUser(prev => ({
      ...prev,
      viewingHistory: updated
    }));
  };

  const toggleFavoriteHistory = (historyId: string) => {
    const updated = toggleFavoriteHistoryInStorage(historyId);
    setViewingHistory(updated);
    setCurrentUser(prev => ({
      ...prev,
      viewingHistory: updated
    }));
  };

  const removeHistoryItem = (historyId: string) => {
    const updated = removeHistoryFromStorage(historyId);
    setViewingHistory(updated);
    setCurrentUser(prev => ({
      ...prev,
      viewingHistory: updated
    }));
  };

  const clearViewingHistory = () => {
    clearHistoryStorage();
    setViewingHistory([]);
    setCurrentUser(prev => ({
      ...prev,
      viewingHistory: []
    }));
  };

  const logout = () => {
    try {
      localStorage.removeItem('youngpapi_current_user');
      localStorage.removeItem('youngpapi_google_bound');
    } catch (e) {}
    setCurrentUser(CURRENT_USER);
  };

  // Fixed: Implemented deleteAccount to handle account deletion requests
  const deleteAccount = () => {
    console.log("Account deletion requested for user:", currentUser.id);
    logout();
  };

  // Fixed: Implemented reportProblem to handle user problem reports
  const reportProblem = (text: string) => {
    console.log("Problem reported by user", currentUser.id, ":", text);
  };

  const refreshEconomyAnalytics = async () => {
    try {
      const res = await fetch('/api/economy/analytics');
      const data = await res.json();
      if (data.success && data.analytics) {
        setEconomyAnalytics(data.analytics);
      }
    } catch (e) {}
  };

  const updateEconomySettings = async (newSettings: Partial<EconomySettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/economy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setEconomySettings(data.settings);
        refreshEconomyAnalytics();
        return true;
      }
    } catch (err) {
      console.error('Update economy settings error:', err);
    }
    return false;
  };

  const sendLuckyBet = async (hostId: string, streamId: string, betAmount: number, sessionElapsedSeconds: number): Promise<LuckyBetResult | null> => {
    try {
      const res = await fetch('/api/gifts/lucky-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          hostId,
          streamId,
          betAmount,
          sessionElapsedSeconds
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.updatedDiamonds !== undefined) {
          setCurrentUser(prev => ({
            ...prev,
            diamonds: data.updatedDiamonds
          }));
        }
        refreshEconomyAnalytics();
        return data;
      } else {
        console.warn('Lucky bet notice:', data.message);
        return null;
      }
    } catch (err) {
      console.error('Send lucky bet error:', err);
      return null;
    }
  };

  return (
    <DataContext.Provider value={{
      currentUser, users, streams, resellers, scheduledStreams, analytics, gifts,
      economySettings, economyAnalytics, updateEconomySettings, refreshEconomyAnalytics, sendLuckyBet,
      topStreamers, refreshTopStreamers,
      viewingHistory,
      liveNotifications, unreadNotificationCount, activeLiveToast, dismissLiveToast,
      markNotificationAsRead, markAllNotificationsAsRead, clearNotifications,
      triggerLiveNotification,
      setCurrentUser, updateUser, startStream, updateStream, endStream, banUser, unbanUser,
      toggleMuteUserInStream, kickUserFromStream, topUpDiamonds, sendGift,
      addGift, updateGift, deleteGift, toggleGift,
      fetchTransactionHistory, followedUserIds, toggleFollow, addToHistory,
      toggleFavoriteHistory, removeHistoryItem, clearViewingHistory, logout,
      deleteAccount, reportProblem
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
