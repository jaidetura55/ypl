import { HistoryItem, Stream, FavoriteMoment } from '../types';

const STORAGE_KEY = 'youngpapi_viewing_history';

export const INITIAL_MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'hist_s1_01',
    streamId: 's1',
    streamTitle: 'Late Night Vibes in Jakarta 🇮🇩',
    broadcasterName: 'Luna_Sky',
    broadcasterAvatar: 'https://picsum.photos/seed/luna/200',
    thumbnail: 'https://picsum.photos/seed/stream1/800/600',
    category: 'Music',
    viewerCount: 1420,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    durationWatched: '28 mins',
    isFavorite: true,
    favoriteMoments: [
      {
        id: 'm_s1_1',
        timeOffsetSec: 180,
        timestampFormatted: '03:00',
        label: 'Acoustic Guitar Cover: "Stay With Me"',
        note: 'Stunning live vocal performance'
      },
      {
        id: 'm_s1_2',
        timeOffsetSec: 740,
        timestampFormatted: '12:20',
        label: 'VIP Dragon Gift Explosion 🐉',
        note: 'Chat reaction went wild!'
      },
      {
        id: 'm_s1_3',
        timeOffsetSec: 1350,
        timestampFormatted: '22:30',
        label: 'Encore Song & Fan Q&A',
        note: 'Answered question about upcoming EP'
      }
    ]
  },
  {
    id: 'hist_s3_02',
    streamId: 's3',
    streamTitle: 'Acoustic Sunset Chill & Chat 🌅',
    broadcasterName: 'Maya_Acoustic',
    broadcasterAvatar: 'https://picsum.photos/seed/maya/200',
    thumbnail: 'https://picsum.photos/seed/stream3/800/600',
    category: 'Singing',
    viewerCount: 890,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    durationWatched: '42 mins',
    isFavorite: true,
    favoriteMoments: [
      {
        id: 'm_s3_1',
        timeOffsetSec: 320,
        timestampFormatted: '05:20',
        label: 'Sunset Golden Hour Singing Session',
        note: 'Golden light reflecting on the beach'
      },
      {
        id: 'm_s3_2',
        timeOffsetSec: 1200,
        timestampFormatted: '20:00',
        label: 'Ukulele Medley of Classic Hits',
        note: '3 song mashup requested by top gifter'
      }
    ]
  },
  {
    id: 'hist_s4_03',
    streamId: 's4',
    streamTitle: 'MLBB Mythic Glory Rank Push 🔥',
    broadcasterName: 'ProGamer_Rey',
    broadcasterAvatar: 'https://picsum.photos/seed/rey/200',
    thumbnail: 'https://picsum.photos/seed/stream4/800/600',
    category: 'Gaming',
    viewerCount: 3100,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // Yesterday
    durationWatched: '1 hr 15 mins',
    isFavorite: false,
    favoriteMoments: [
      {
        id: 'm_s4_1',
        timeOffsetSec: 910,
        timestampFormatted: '15:10',
        label: 'Insane 1v4 Savage Clutch Win ⚔️',
        note: 'Stole Lord and wiped enemy team'
      },
      {
        id: 'm_s4_2',
        timeOffsetSec: 2400,
        timestampFormatted: '40:00',
        label: 'Mythic Immortal Rank Up Moment!',
        note: 'End of match leaderboard celebration'
      }
    ]
  },
  {
    id: 'hist_s2_04',
    streamId: 's2',
    streamTitle: 'Tokyo Club Beat Showcase 🇯🇵',
    broadcasterName: 'DJ_Kenji',
    broadcasterAvatar: 'https://picsum.photos/seed/kenji/200',
    thumbnail: 'https://picsum.photos/seed/stream2/800/600',
    category: 'Party',
    viewerCount: 2200,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 2 days ago
    durationWatched: '55 mins',
    isFavorite: false,
    favoriteMoments: [
      {
        id: 'm_s2_1',
        timeOffsetSec: 600,
        timestampFormatted: '10:00',
        label: 'Cyberpunk Synthwave Drop ⚡',
        note: 'Bass drop with laser lighting synced'
      },
      {
        id: 'm_s2_2',
        timeOffsetSec: 1800,
        timestampFormatted: '30:00',
        label: 'Collab with Guest DJ Sakura',
        note: 'Back-to-back live remixing'
      }
    ]
  },
  {
    id: 'hist_s5_05',
    streamId: 's5',
    streamTitle: 'Authentic Italian Pizza at Home 🍕',
    broadcasterName: 'Chef_Antonio',
    broadcasterAvatar: 'https://picsum.photos/seed/antonio/200',
    thumbnail: 'https://picsum.photos/seed/stream5/800/600',
    category: 'Life',
    viewerCount: 640,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    durationWatched: '35 mins',
    isFavorite: true,
    favoriteMoments: [
      {
        id: 'm_s5_1',
        timeOffsetSec: 450,
        timestampFormatted: '07:30',
        label: 'Neapolitan Dough Tossing Masterclass',
        note: 'Secrets of 72-hour cold fermentation'
      },
      {
        id: 'm_s5_2',
        timeOffsetSec: 1560,
        timestampFormatted: '26:00',
        label: 'Oven Reveal & Fresh Basil Plating',
        note: 'Perfect crust bubble rise'
      }
    ]
  },
  {
    id: 'hist_s6_06',
    streamId: 's6',
    streamTitle: 'Neon Cyberpunk DJ Set 🎧',
    broadcasterName: 'Cyber_Synth',
    broadcasterAvatar: 'https://picsum.photos/seed/cyber/200',
    thumbnail: 'https://picsum.photos/seed/stream6/800/600',
    category: 'Music',
    viewerCount: 1850,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    durationWatched: '19 mins',
    isFavorite: false,
    favoriteMoments: [
      {
        id: 'm_s6_1',
        timeOffsetSec: 300,
        timestampFormatted: '05:00',
        label: 'Retro 80s Live Keytar Solo',
        note: 'Live solo performance on vintage synth'
      }
    ]
  }
];

export const getStoredViewingHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed default mock history
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_HISTORY));
    return INITIAL_MOCK_HISTORY;
  } catch (e) {
    return INITIAL_MOCK_HISTORY;
  }
};

export const saveViewingHistory = (items: HistoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
};

export const addStreamToHistoryStorage = (stream: Stream): HistoryItem[] => {
  const current = getStoredViewingHistory();
  const existingIdx = current.findIndex(item => item.streamId === stream.id);

  const newEntry: HistoryItem = {
    id: `hist_${stream.id}_${Date.now()}`,
    streamId: stream.id,
    streamTitle: stream.title,
    broadcasterName: stream.broadcaster.name,
    broadcasterAvatar: stream.broadcaster.avatar,
    thumbnail: stream.thumbnail,
    category: stream.category,
    viewerCount: stream.viewerCount,
    timestamp: new Date().toISOString(),
    durationWatched: existingIdx >= 0 && current[existingIdx].durationWatched ? current[existingIdx].durationWatched : 'Active',
    isFavorite: existingIdx >= 0 ? Boolean(current[existingIdx].isFavorite) : false,
    favoriteMoments: existingIdx >= 0 && current[existingIdx].favoriteMoments?.length 
      ? current[existingIdx].favoriteMoments 
      : [
          {
            id: `m_${stream.id}_1`,
            timeOffsetSec: 90,
            timestampFormatted: '01:30',
            label: 'Stream Join & Broadcast Highlight',
            note: 'Captured your first watch session'
          }
        ]
  };

  const filtered = current.filter(item => item.streamId !== stream.id);
  const updated = [newEntry, ...filtered].slice(0, 50);
  saveViewingHistory(updated);
  return updated;
};

export const toggleFavoriteHistoryInStorage = (historyId: string): HistoryItem[] => {
  const current = getStoredViewingHistory();
  const updated = current.map(item => {
    if (item.id === historyId || item.streamId === historyId) {
      return { ...item, isFavorite: !item.isFavorite };
    }
    return item;
  });
  saveViewingHistory(updated);
  return updated;
};

export const removeHistoryFromStorage = (historyId: string): HistoryItem[] => {
  const current = getStoredViewingHistory();
  const updated = current.filter(item => item.id !== historyId && item.streamId !== historyId);
  saveViewingHistory(updated);
  return updated;
};

export const clearHistoryStorage = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(STREAM_IDS_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {}
};

export const STREAM_IDS_STORAGE_KEY = 'youngpapi_recent_stream_ids';
export const DEFAULT_RECENT_STREAM_IDS = ['s1', 's3', 's4', 's2', 's5'];

export const getRecentWatchedStreamIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STREAM_IDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed default stream IDs from existing streams
    localStorage.setItem(STREAM_IDS_STORAGE_KEY, JSON.stringify(DEFAULT_RECENT_STREAM_IDS));
    return DEFAULT_RECENT_STREAM_IDS;
  } catch (e) {
    return DEFAULT_RECENT_STREAM_IDS;
  }
};

export const addWatchedStreamId = (streamId: string): string[] => {
  try {
    const current = getRecentWatchedStreamIds();
    const filtered = current.filter(id => id !== streamId);
    const updated = [streamId, ...filtered].slice(0, 50);
    localStorage.setItem(STREAM_IDS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [streamId];
  }
};

export const removeWatchedStreamId = (streamId: string): string[] => {
  try {
    const current = getRecentWatchedStreamIds();
    const updated = current.filter(id => id !== streamId);
    localStorage.setItem(STREAM_IDS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const clearWatchedStreamIds = (): void => {
  try {
    localStorage.setItem(STREAM_IDS_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {}
};

