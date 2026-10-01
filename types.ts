
export enum StreamStatus {
  IDLE = 'IDLE',
  LIVE = 'LIVE',
  CONNECTING = 'CONNECTING',
  ENDED = 'ENDED'
}

export interface FavoriteMoment {
  id: string;
  timeOffsetSec: number;
  label: string;
  timestampFormatted: string;
  note?: string;
}

export interface HistoryItem {
  id?: string;
  streamId: string;
  streamTitle: string;
  broadcasterName: string;
  timestamp: string;
  thumbnail?: string;
  broadcasterAvatar?: string;
  category?: string;
  viewerCount?: number;
  durationWatched?: string;
  isFavorite?: boolean;
  favoriteMoments?: FavoriteMoment[];
}

export interface LiveStreamNotification {
  id: string;
  streamId: string;
  streamTitle: string;
  broadcaster: {
    id: string;
    name: string;
    avatar: string;
    level?: number;
    username?: string;
  };
  category?: string;
  thumbnail?: string;
  country?: string;
  timestamp: number;
  isRead: boolean;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  email?: string;
  age?: number;
  dob?: string;
  country?: string;
  level: number;
  diamonds: number;
  beans?: number;
  salary?: number;
  totalSpending?: number;
  followers: number;
  following: number;
  banner?: string;
  bio?: string;
  isVerified?: boolean;
  themeColor?: 'indigo' | 'rose' | 'purple' | 'emerald' | 'orange' | 'blue';
  vvipStatus?: 'none' | 'vip' | 'svip';
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
  };
  status?: 'active' | 'banned';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  isPhoneBound?: boolean;
  isGoogleBound?: boolean;
  isPublicProfile?: boolean;
  viewingHistory?: HistoryItem[];
  checkInStreak?: number;
  lastCheckInDate?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'topup' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'salary' | 'rebate';
  amount: number;
  currency: 'diamond' | 'bean' | 'usd';
  description: string;
  createdAt: string;
}

export interface Reseller {
  id: string;
  name: string;
  appId: string;
  balance: number;
  commissionRate: number;
  totalSales: number;
  salaryPending: number;
  status: 'active' | 'suspended';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Stream {
  id: string;
  title: string;
  broadcaster: User;
  viewerCount: number;
  thumbnail: string;
  category: string;
  isAiCompanion?: boolean;
  country: string;
  quality?: '360p' | '720p' | '1080p';
  startTime?: number;
  mutedUserIds?: string[];
  kickedUserIds?: string[];
  isPrivate?: boolean;
  pin?: string;
  entryFee?: number;
  pkOpponent?: User;
  pkStatus?: 'none' | 'inviting' | 'active' | 'ended';
  pkScores?: { host: number, opponent: number };
  pkTimeLeft?: number;
}

export interface ScheduledStream {
  id: string;
  host: User;
  title: string;
  category: string;
  startTime: number;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  level?: number;
  moderationAction?: 'allow' | 'flag' | 'hide';
}

export interface Seat {
  id: string;
  user: User | null;
  isMuted?: boolean;
  isLocked?: boolean;
  isHost?: boolean;
}

export interface PartySession {
  id: string;
  title: string;
  host: User;
  viewerCount: number;
  seats: Seat[];
  background: string;
}

export interface AnalyticsData {
  country: string;
  visits: number;
  activeUsers: number;
  flag: string;
}

export interface Gift {
  id: string;
  name: string;
  category: 'Standard' | 'Beautiful' | 'VIP' | 'SVIP' | 'Event' | 'Static' | 'Animated';
  type?: 'static' | 'animated';
  price: number; // Diamonds cost to send
  beans?: number; // Beans salary received by host
  icon: string;
  audio?: string;
  animationUrl?: string; // URL to WebM/MP4 for full screen effect
  animationType?: 'ferrari' | 'yacht' | 'rocket' | 'dragon' | 'galaxy' | 'fireworks' | 'pegasus' | 'meteor' | 'sparkle' | 'custom';
  description?: string;
  isActive?: boolean;
}

export interface EconomySettings {
  companyCutPercentage: number; // e.g. 30 -> 30% company take
  streamerCutPercentage: number; // e.g. 70 -> 70% streamer profit
  exchangeRateUsdPer100Diamonds: number; // e.g. 1.00 USD per 100 diamonds
  usdToSgd: number; // e.g. 1.35
  usdToMyr: number; // e.g. 4.45
  usdToIdr: number; // e.g. 15800
  luckyGiftEnabled: boolean;
  luckyWinRatePercentage: number; // e.g. 70% feeling win
  luckySessionMinutes: number; // 3 or 5 minutes
  luckyMaxMultiplier: number; // e.g. 10x
  updatedAt?: string;
}

export interface CurrencyProfitBreakdown {
  diamonds: number;
  usd: number;
  sgd: number;
  myr: number;
  idr: number;
}

export interface EconomyProfitAnalytics {
  totalDiamondsVolume: number;
  companyProfit: CurrencyProfitBreakdown;
  streamerProfit: CurrencyProfitBreakdown;
  companyCutPercentage: number;
  streamerCutPercentage: number;
  exchangeRates: {
    usd: number;
    sgd: number;
    myr: number;
    idr: number;
  };
}

export interface LuckyBetResult {
  success: boolean;
  win: boolean;
  multiplier: number;
  betAmount: number;
  payoutDiamonds: number;
  netDiamondsDiff: number;
  updatedDiamonds: number;
  hostBeansAwarded: number;
  companyDiamondsAwarded: number;
  message: string;
  sessionMinutes: number;
  sessionElapsedSeconds: number;
}

export interface TopStreamer {
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  level: number;
  country?: string;
  diamondsEarned: number;
  followers: number;
  isLive: boolean;
  streamId?: string;
  streamTitle?: string;
  viewerCount?: number;
  rank: number;
  earningsUsd: number;
  earningsSgd: number;
  earningsMyr: number;
  earningsIdr: number;
}

export interface HighValueGiftAlert {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderLevel?: number;
  receiverId: string;
  receiverName?: string;
  streamId?: string;
  gift: {
    id: string;
    name: string;
    icon: string;
    price: number;
    beans?: number;
    animationType?: string;
  };
  quantity: number;
  totalCost: number; // diamonds cost
  beansEarned: number; // beans salary credited to host
  tier: 'elite' | 'luxury' | 'cosmic'; // elite: 1k-9.9k, luxury: 10k-49.9k, cosmic: 50k+
  timestamp: number;
  isCurrentRoom: boolean;
}

