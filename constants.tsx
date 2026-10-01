
import { User, Stream, ScheduledStream, Reseller, AnalyticsData } from './types';

export const COUNTRIES = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
];


export const CURRENT_USER: User = {
  id: '100000000001', // 12-digit ID
  name: 'Alex Nova',
  username: 'alexnova',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200',
  age: 24,
  dob: '2000-01-01',
  country: 'ID',
  level: 15,
  diamonds: 2500,
  beans: 12500,
  followers: 4200,
  following: 125,
  isVerified: false,
  status: 'active',
  vvipStatus: 'none',
  banner: 'https://picsum.photos/seed/banner/800/300',
  themeColor: 'indigo',
  bio: 'Digital nomad & night owl 🦉 Streaming vibes from across the globe.',
  socialLinks: {
    instagram: 'alex_nova',
    twitter: '@alex_n',
    facebook: 'alex.nova.live',
    tiktok: '@alexnova_official',
    youtube: '@AlexNovaStreams'
  },
  bankDetails: {
    bankName: 'BCA',
    accountNumber: '8829102933',
    accountName: 'ALEX NOVA'
  },
  isPhoneBound: false,
  isGoogleBound: true,
  isPublicProfile: true
};

export const EMOJIS = ['😀', '😂', '🤣', '😍', '🥰', '😘', '😎', '😭', '😡', '😱', '🥳', '🤔', '🤫', '👍', '👎', '🙏', '🤝', '👋', '💋', '🌹', '🔥', '💯', '🎉', '💎', '👻', '💩', '🤡', '🦄', '🐶', '🐱'];

export const MOCK_RESELLERS: Reseller[] = [
  { 
    id: 'r-1', name: 'TopUpKing_Indo', appId: 'app-indo-01', balance: 500000, commissionRate: 0.05, totalSales: 15000000, salaryPending: 250, status: 'active',
    bankDetails: { bankName: 'Mandiri', accountNumber: '1234567890', accountName: 'TOPUP KING LTD' }
  },
  { 
    id: 'r-2', name: 'DiamondStore_PH', appId: 'app-ph-02', balance: 120000, commissionRate: 0.04, totalSales: 4500000, salaryPending: 120, status: 'active',
    bankDetails: { bankName: 'BDO', accountNumber: '0987654321', accountName: 'MARIA CLARA' }
  },
  { 
    id: 'r-3', name: 'FastGems_VN', appId: 'app-vn-03', balance: 0, commissionRate: 0.06, totalSales: 800000, salaryPending: 45, status: 'suspended',
    bankDetails: { bankName: 'Vietcombank', accountNumber: '1122334455', accountName: 'NGUYEN VAN A' }
  },
];

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { country: 'Indonesia', visits: 150000, activeUsers: 4500, flag: '🇮🇩' },
  { country: 'Philippines', visits: 89000, activeUsers: 3200, flag: '🇵🇭' },
  { country: 'Vietnam', visits: 67000, activeUsers: 2100, flag: '🇻🇳' },
  { country: 'Thailand', visits: 45000, activeUsers: 1800, flag: '🇹🇭' },
  { country: 'Malaysia', visits: 42000, activeUsers: 1600, flag: '🇲🇾' },
  { country: 'Singapore', visits: 38000, activeUsers: 1400, flag: '🇸🇬' },
  { country: 'Cambodia', visits: 24000, activeUsers: 950, flag: '🇰🇭' },
  { country: 'Brunei', visits: 18000, activeUsers: 720, flag: '🇧🇳' },
  { country: 'Laos', visits: 12000, activeUsers: 540, flag: '🇱🇦' },
  { country: 'Myanmar', visits: 15000, activeUsers: 610, flag: '🇲🇲' },
];

export const MOCK_ONLINE_USERS: User[] = [
  { id: '100000000101', name: 'SarahVibes', avatar: 'https://picsum.photos/seed/sarah/200', level: 12, diamonds: 500, followers: 1200, following: 50, isVerified: false, status: 'active', vvipStatus: 'vip', country: 'ID' },
  { id: '100000000102', name: 'Mike_Drops', avatar: 'https://picsum.photos/seed/mike/200', level: 25, diamonds: 2500, followers: 5000, following: 200, isVerified: true, status: 'active', vvipStatus: 'svip', country: 'MY' },
  { id: '100000000103', name: 'Jessica_Sing', avatar: 'https://picsum.photos/seed/jessica/200', level: 8, diamonds: 100, followers: 300, following: 20, isVerified: false, status: 'active', vvipStatus: 'none', country: 'PH' },
  { id: '100000000104', name: 'Tom_Travels', avatar: 'https://picsum.photos/seed/tom/200', level: 18, diamonds: 1200, followers: 2200, following: 100, isVerified: false, status: 'active', vvipStatus: 'none', country: 'TH' },
  { id: '100000000105', name: 'Gaming_Dave', avatar: 'https://picsum.photos/seed/dave/200', level: 30, diamonds: 5000, followers: 8000, following: 10, isVerified: true, status: 'active', vvipStatus: 'vip', country: 'VN' },
  { id: '100000000106', name: 'Bella_Dance', avatar: 'https://picsum.photos/seed/bella/200', level: 15, diamonds: 800, followers: 1500, following: 60, isVerified: false, status: 'active', vvipStatus: 'none', country: 'SG' },
  { id: '100000000107', name: 'Tech_Guru', avatar: 'https://picsum.photos/seed/tech/200', level: 40, diamonds: 8000, followers: 10000, following: 5, isVerified: true, status: 'active', vvipStatus: 'svip', country: 'ID' },
];

export const MOCK_STREAMS: Stream[] = [
  {
    id: 's1',
    title: 'Late Night Vibes in Jakarta 🇮🇩',
    broadcaster: { id: '100000000001', name: 'Luna_Sky', avatar: 'https://picsum.photos/seed/luna/200', level: 42, diamonds: 12000, followers: 85000, following: 210, isVerified: true, bio: 'Singing songs & chatting!', socialLinks: { instagram: 'lunasky_music' }, status: 'active', bankDetails: { bankName: 'BCA', accountNumber: '123888999', accountName: 'LUNA SKY' }, vvipStatus: 'svip', country: 'ID' },
    viewerCount: 1250,
    thumbnail: 'https://picsum.photos/seed/stream1/800/600',
    category: 'Music',
    country: 'ID',
    quality: '1080p',
    startTime: Date.now() - 3600000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's2',
    title: 'Gaming with Pro Skills VN 🇻🇳',
    broadcaster: { id: '100000000002', name: 'GameMaster99', avatar: 'https://picsum.photos/seed/game/200', level: 56, diamonds: 45000, followers: 120000, following: 50, isVerified: true, status: 'active', bankDetails: { bankName: 'VietinBank', accountNumber: '999888777', accountName: 'GAME MASTER' }, vvipStatus: 'vip', country: 'VN' },
    viewerCount: 3400,
    thumbnail: 'https://picsum.photos/seed/stream2/800/600',
    category: 'Gaming',
    country: 'VN',
    quality: '720p',
    startTime: Date.now() - 7200000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's3',
    title: 'Manila Talk Show & Chill 🇵🇭',
    broadcaster: { id: '100000000011', name: 'Nova AI', avatar: 'https://picsum.photos/seed/ai/200', level: 100, diamonds: 0, followers: 1000000, following: 0, isVerified: true, status: 'active', vvipStatus: 'svip', country: 'PH' },
    viewerCount: 520,
    thumbnail: 'https://picsum.photos/seed/ai_thumb/800/600',
    category: 'AI Chat',
    isAiCompanion: true,
    country: 'PH',
    quality: '1080p',
    startTime: Date.now() - 1800000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's4',
    title: 'Marina Bay Sunrise & Meditation 🇸🇬',
    broadcaster: { id: '100000000003', name: 'YogiZen', avatar: 'https://picsum.photos/seed/yoga/200', level: 23, diamonds: 5000, followers: 15400, following: 300, status: 'active', vvipStatus: 'none', country: 'SG' },
    viewerCount: 890,
    thumbnail: 'https://picsum.photos/seed/stream3/800/600',
    category: 'Health',
    country: 'SG',
    quality: '720p',
    startTime: Date.now() - 900000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's5',
    title: 'Bangkok Street Food 🇹🇭',
    broadcaster: { id: '100000000004', name: 'ChefThai', avatar: 'https://picsum.photos/seed/chef/200', level: 31, diamonds: 8200, followers: 32000, following: 120, isVerified: true, status: 'active', vvipStatus: 'vip', country: 'TH' },
    viewerCount: 410,
    thumbnail: 'https://picsum.photos/seed/stream4/800/600',
    category: 'Food',
    country: 'TH',
    quality: '720p',
    startTime: Date.now() - 5400000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's6',
    title: 'KL City Night Walk 🇲🇾',
    broadcaster: { id: '100000000005', name: 'CityWalkerMY', avatar: 'https://picsum.photos/seed/art/200', level: 18, diamonds: 3300, followers: 9800, following: 45, status: 'active', vvipStatus: 'none', country: 'MY' },
    viewerCount: 220,
    thumbnail: 'https://picsum.photos/seed/stream5/800/600',
    category: 'Travel',
    country: 'MY',
    quality: '1080p',
    startTime: Date.now() - 1200000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's7',
    title: 'Exploring Angkor Wat 🇰🇭',
    broadcaster: { id: '100000000006', name: 'TravelTom', avatar: 'https://picsum.photos/seed/travel1/800/600', level: 25, diamonds: 1500, followers: 18500, following: 800, status: 'active', vvipStatus: 'none', country: 'KH' },
    viewerCount: 1840,
    thumbnail: 'https://picsum.photos/seed/travel1/800/600',
    category: 'Travel',
    country: 'KH',
    quality: '360p',
    startTime: Date.now() - 10000000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's8',
    title: 'Singapore Tech & AI Coding 🇸🇬',
    broadcaster: { id: '100000000007', name: 'ProfessorX', avatar: 'https://picsum.photos/seed/math/200', level: 60, diamonds: 9000, followers: 54000, following: 10, isVerified: true, status: 'active', vvipStatus: 'svip', country: 'SG' },
    viewerCount: 310,
    thumbnail: 'https://picsum.photos/seed/edu/800/600',
    category: 'Education',
    country: 'SG',
    quality: '720p',
    startTime: Date.now() - 2500000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's9',
    title: 'Luang Prabang Crafts & Life 🇱🇦',
    broadcaster: { id: '100000000008', name: 'DIY_Dan', avatar: 'https://picsum.photos/seed/diy/200', level: 12, diamonds: 450, followers: 2300, following: 150, status: 'active', vvipStatus: 'none', country: 'LA' },
    viewerCount: 560,
    thumbnail: 'https://picsum.photos/seed/diy1/800/600',
    category: 'DIY',
    country: 'LA',
    quality: '360p',
    startTime: Date.now() - 4000000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's10',
    title: 'Yangon Acoustic Sunset Beats 🇲🇲',
    broadcaster: { id: '100000000009', name: 'PakBeats', avatar: 'https://picsum.photos/seed/pk/200', level: 10, diamonds: 300, followers: 1500, following: 60, status: 'active', vvipStatus: 'none', country: 'MM' },
    viewerCount: 150,
    thumbnail: 'https://picsum.photos/seed/pk/800/600',
    category: 'Music',
    country: 'MM',
    quality: '720p',
    startTime: Date.now() - 600000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: false
  },
  {
    id: 's11',
    title: 'Brunei Sunset & Chill 🇧🇳',
    broadcaster: { id: '100000000010', name: 'RoyalVibes', avatar: 'https://picsum.photos/seed/bn/200', level: 45, diamonds: 15000, followers: 67000, following: 90, isVerified: true, status: 'active', vvipStatus: 'vip', country: 'BN' },
    viewerCount: 670,
    thumbnail: 'https://picsum.photos/seed/bn/800/600',
    category: 'Chat',
    country: 'BN',
    quality: '1080p',
    startTime: Date.now() - 300000,
    mutedUserIds: [],
    kickedUserIds: [],
    isPrivate: true,
    pin: '12345678'
  }
];

export const MOCK_SCHEDULED_STREAMS: ScheduledStream[] = [
  {
    id: 'sch1',
    host: { id: '1', name: 'Luna_Sky', avatar: 'https://picsum.photos/seed/luna/200', level: 42, diamonds: 12000, followers: 85000, following: 210, isVerified: true, country: 'ID' },
    title: 'Special Acoustic Night 🎸',
    category: 'Music',
    startTime: Date.now() + 86400000, // +1 day
    thumbnail: 'https://picsum.photos/seed/sch1/800/600'
  },
  {
    id: 'sch2',
    host: { id: '4', name: 'ChefThai', avatar: 'https://picsum.photos/seed/chef/200', level: 31, diamonds: 8200, followers: 32000, following: 120, isVerified: true, country: 'TH' },
    title: 'Cooking Masterclass: Pad Thai',
    category: 'Food',
    startTime: Date.now() + 172800000, // +2 days
    thumbnail: 'https://picsum.photos/seed/sch2/800/600'
  },
  {
    id: 'sch3',
    host: { id: '2', name: 'GameMaster99', avatar: 'https://picsum.photos/seed/game/200', level: 56, diamonds: 45000, followers: 120000, following: 50, isVerified: true, country: 'VN' },
    title: 'Ranked Push to Conqueror',
    category: 'Gaming',
    startTime: Date.now() + 43200000, // +12 hours
    thumbnail: 'https://picsum.photos/seed/sch3/800/600'
  }
];
