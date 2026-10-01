import mysql from 'mysql2/promise';

// In-memory data store for resilient fallback when MySQL daemon is unavailable
const memoryStore = {
  users: [
    {
      id: '1',
      real_name: 'Admin User',
      nickname: 'YoungPapi Admin',
      date_of_birth: '1998-01-01',
      email: 'admin@youngpapi.live',
      phone_number: '+60123456789',
      biodata: 'Platform Administrator',
      password_hash: 'admin123',
      diamonds: 50000,
      beans: 25000,
      total_spending: 12000,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      level: 99
    },
    {
      id: '100000000003',
      real_name: 'Luna Sky',
      nickname: 'Luna Acoustic',
      date_of_birth: '2000-07-15',
      email: 'luna@youngpapi.live',
      phone_number: '+62812345678',
      biodata: 'Late night chill acoustic guitar & singing 🌙',
      password_hash: 'secret',
      diamonds: 24500,
      beans: 89400,
      total_spending: 5200,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      level: 48,
      country: 'ID'
    },
    {
      id: '100000000002',
      real_name: 'Alex Rivers',
      nickname: 'Alex PK King',
      date_of_birth: '1999-09-22',
      email: 'alex@youngpapi.live',
      phone_number: '+60199887766',
      biodata: 'Reigning PK battle champion! Daily battles at 9PM.',
      password_hash: 'secret',
      diamonds: 38200,
      beans: 74200,
      total_spending: 29000,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      level: 56,
      country: 'SG'
    },
    {
      id: '100000000004',
      real_name: 'Nguyen Van Minh',
      nickname: 'GameMaster99',
      date_of_birth: '1998-03-30',
      email: 'gamemaster@youngpapi.live',
      phone_number: '+84988776655',
      biodata: 'Esports caster and top tier mobile gaming streamer.',
      password_hash: 'secret',
      diamonds: 18500,
      beans: 58900,
      total_spending: 14000,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      level: 38,
      country: 'VN'
    },
    {
      id: '100000000001',
      real_name: 'Maya Lin',
      nickname: 'Maya Chill Vibes',
      date_of_birth: '2001-04-12',
      email: 'maya@youngpapi.live',
      phone_number: '+60111223344',
      biodata: 'Chill acoustic vibes & lifestyle storytelling 🌸',
      password_hash: 'secret',
      diamonds: 15400,
      beans: 42100,
      total_spending: 4300,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      level: 25,
      country: 'MY'
    },
    {
      id: '100000000005',
      real_name: 'Somchai Prasert',
      nickname: 'ChefThai Foodie',
      date_of_birth: '1995-11-08',
      email: 'chefthai@youngpapi.live',
      phone_number: '+66812345678',
      biodata: 'Street food adventures & authentic Thai culinary master.',
      password_hash: 'secret',
      diamonds: 9800,
      beans: 31200,
      total_spending: 8600,
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200',
      level: 32,
      country: 'TH'
    }
  ],
  streams: [
    {
      id: 'room_live_7829',
      user_id: '100000000003',
      title: 'Night Lounge Chill & Acoustic Vibes 🌙',
      category: 'Music',
      thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      country: 'ID',
      is_ai_companion: 0,
      status: 'live',
      viewer_count: 1420,
      created_at: new Date().toISOString()
    },
    {
      id: 'room_pk_5502',
      user_id: '100000000002',
      title: 'Mega PK Battle Championship Finale 🔥',
      category: 'Gaming',
      thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
      country: 'SG',
      is_ai_companion: 0,
      status: 'live',
      viewer_count: 2890,
      created_at: new Date().toISOString()
    },
    {
      id: 'room_live_3301',
      user_id: '100000000001',
      title: 'Late Night Talk & Coffee Chill ☕',
      category: 'Chat',
      thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
      country: 'MY',
      is_ai_companion: 0,
      status: 'live',
      viewer_count: 850,
      created_at: new Date().toISOString()
    }
  ],
  gifts: [
    // Static Gifts
    { id: 'rose', name: 'Rose', price: 1, beans: 1, type: 'static', category: 'Static', icon: '🌹', is_active: 1, description: 'Classic red rose of affection' },
    { id: 'heart', name: 'Love Heart', price: 25, beans: 25, type: 'static', category: 'Static', icon: '❤️', is_active: 1, description: 'Warm fluttering love heart' },
    { id: 'coffee', name: 'Espresso', price: 50, beans: 50, type: 'static', category: 'Static', icon: '☕', is_active: 1, description: 'Energizing artisan espresso coffee' },
    { id: 'diamond_ring', name: 'Diamond Ring', price: 200, beans: 200, type: 'static', category: 'Static', icon: '💍', is_active: 1, description: 'Sparkling diamond solitaire ring' },
    { id: 'teddy_bear', name: 'Teddy Bear', price: 500, beans: 500, type: 'static', category: 'Static', icon: '🧸', is_active: 1, description: 'Cute cuddly golden teddy bear' },
    { id: 'gold_crown', name: 'Golden Crown', price: 1000, beans: 1000, type: 'static', category: 'Static', icon: '👑', is_active: 1, description: 'Royal monarch crown for top streamers' },
    { id: 'trophy', name: 'Championship Trophy', price: 2000, beans: 2000, type: 'static', category: 'Static', icon: '🏆', is_active: 1, description: 'Glittering champion cup of glory' },
    
    // Animated Luxury Gifts (with full-screen 3D effects & sounds)
    { id: 'sports_car', name: 'Ferrari Supercar', price: 2500, beans: 2500, type: 'animated', category: 'Animated', icon: '🏎️', animationType: 'ferrari', is_active: 1, description: 'Racing supercar roaring across streamer room with smoke & speed' },
    { id: 'luxury_yacht', name: 'Ocean Superyacht', price: 5000, beans: 5000, type: 'animated', category: 'Animated', icon: '🛥️', animationType: 'yacht', is_active: 1, description: 'Luxury yacht cruising through tropical turquoise waters' },
    { id: 'space_rocket', name: 'Apollo Rocket', price: 10000, beans: 10000, type: 'animated', category: 'Animated', icon: '🚀', animationType: 'rocket', is_active: 1, description: 'Spectacular rocket launch with booster trail & sonic boom' },
    { id: 'golden_dragon', name: 'Golden Dragon', price: 25000, beans: 25000, type: 'animated', category: 'Animated', icon: '🐉', animationType: 'dragon', is_active: 1, description: 'Majestic ancient mythical dragon weaving gold flames' },
    { id: 'galaxy_crown', name: 'Galaxy Nova', price: 50000, beans: 50000, type: 'animated', category: 'Animated', icon: '🌌', animationType: 'galaxy', is_active: 1, description: 'Deep space cosmic vortex orbiting the streamer' },
    { id: 'fireworks_show', name: 'Fireworks Fiesta', price: 100000, beans: 100000, type: 'animated', category: 'Animated', icon: '🎆', animationType: 'fireworks', is_active: 1, description: 'Grand finale fireworks illuminating the live room with celebration' },
    { id: 'pegasus_flight', name: 'Celestial Pegasus', price: 150000, beans: 150000, type: 'animated', category: 'Animated', icon: '🦄', animationType: 'pegasus', is_active: 1, description: 'Mythical winged unicorn descending with cosmic star dust' },
    { id: 'super_meteor', name: 'Cosmic Meteor', price: 200000, beans: 200000, type: 'animated', category: 'Animated', icon: '☄️', animationType: 'meteor', is_active: 1, description: 'Giant burning celestial meteor crashing with gold explosion' }
  ],
  transactions: [
    { id: 'tx-001', user_id: '100000000001', type: 'gift_received', amount: 500, created_at: new Date().toISOString() },
    { id: 'tx-002', user_id: '1', type: 'gift_sent', amount: 500, created_at: new Date().toISOString() }
  ],
  economy_settings: {
    id: 'default',
    company_cut_percentage: 30, // 30% company take
    streamer_cut_percentage: 70, // 70% streamer profit
    exchange_rate_usd: 100, // 100 diamonds = 1 USD
    usd_to_sgd: 1.35,
    usd_to_myr: 4.45,
    usd_to_idr: 15800,
    lucky_gift_enabled: 1,
    lucky_win_rate_percentage: 70, // 70% feeling win
    lucky_session_minutes: 3, // 3 or 5 minutes
    lucky_max_multiplier: 10,
    total_diamond_volume: 45000,
    company_profit_diamonds: 13500,
    streamer_profit_beans: 31500,
    updated_at: new Date().toISOString()
  }
};

// Check if external MySQL host is provided in env
const hasMysqlConfig = Boolean(process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost' && process.env.MYSQL_HOST !== '127.0.0.1');

let realPool = null;
let isMysqlActive = false;

if (hasMysqlConfig) {
  try {
    realPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'youngpapi-live-db',
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    isMysqlActive = true;
  } catch {
    isMysqlActive = false;
  }
}

// In-memory query simulator implementing standard MySQL query/execute responses
const handleInMemoryQuery = async (sql, params = []) => {
  const norm = sql.trim().toUpperCase().replace(/"/g, "'").replace(/\s+/g, ' ');

  // 1. SELECT * FROM GIFTS
  if (norm.includes('SELECT * FROM GIFTS')) {
    if (norm.includes('IS_ACTIVE = TRUE') || norm.includes('IS_ACTIVE = 1')) {
      return [memoryStore.gifts.filter(g => g.is_active === 1 || g.is_active === true), null];
    }
    // Return all for admin
    return [memoryStore.gifts, null];
  }

  // 1b. INSERT INTO GIFTS
  if (norm.startsWith('INSERT INTO GIFTS')) {
    const [id, name, price, beans, type, category, icon, animationType, description, isActive] = params;
    const newGift = {
      id,
      name,
      price: Number(price),
      beans: Number(beans !== undefined ? beans : price),
      type: type || 'static',
      category: category || (type === 'animated' ? 'Animated' : 'Static'),
      icon: icon || '🎁',
      animationType: animationType || null,
      description: description || '',
      is_active: isActive === undefined ? 1 : (isActive ? 1 : 0)
    };
    memoryStore.gifts.unshift(newGift);
    return [{ affectedRows: 1, insertId: id }, null];
  }

  // 1c. DELETE FROM GIFTS
  if (norm.startsWith('DELETE FROM GIFTS WHERE ID = ?')) {
    const [id] = params;
    const idx = memoryStore.gifts.findIndex(g => g.id === id);
    if (idx >= 0) {
      memoryStore.gifts.splice(idx, 1);
      return [{ affectedRows: 1 }, null];
    }
    return [{ affectedRows: 0 }, null];
  }

  // 1d. UPDATE GIFTS
  if (norm.startsWith('UPDATE GIFTS')) {
    if (norm.includes('IS_ACTIVE =') && norm.includes('WHERE ID = ?')) {
      const [isActive, id] = params;
      const target = memoryStore.gifts.find(g => g.id === id);
      if (target) {
        target.is_active = isActive ? 1 : 0;
        return [{ affectedRows: 1 }, null];
      }
    } else {
      // General update: [name, price, beans, type, category, icon, animationType, description, id]
      const id = params[params.length - 1];
      const target = memoryStore.gifts.find(g => g.id === id);
      if (target) {
        if (params.length >= 8) {
          target.name = params[0] !== undefined ? params[0] : target.name;
          target.price = params[1] !== undefined ? Number(params[1]) : target.price;
          target.beans = params[2] !== undefined ? Number(params[2]) : target.beans;
          target.type = params[3] !== undefined ? params[3] : target.type;
          target.category = params[4] !== undefined ? params[4] : target.category;
          target.icon = params[5] !== undefined ? params[5] : target.icon;
          target.animationType = params[6] !== undefined ? params[6] : target.animationType;
          target.description = params[7] !== undefined ? params[7] : target.description;
        }
        return [{ affectedRows: 1 }, null];
      }
    }
    return [{ affectedRows: 0 }, null];
  }

  // 2. SELECT STREAMS JOIN USERS WHERE STATUS = 'LIVE'
  if (norm.includes('FROM STREAMS') && norm.includes('STATUS = \'LIVE\'')) {
    const liveStreams = memoryStore.streams.filter(s => s.status === 'live');
    const joined = liveStreams.map(s => {
      const user = memoryStore.users.find(u => u.id === s.user_id) || {
        nickname: 'Live Streamer',
        avatar_url: s.thumbnail_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        level: 5
      };
      return {
        ...s,
        broadcaster_name: user.nickname,
        broadcaster_avatar: user.avatar_url,
        broadcaster_level: user.level || 1
      };
    });
    return [joined, null];
  }

  // 3. INSERT INTO STREAMS
  if (norm.startsWith('INSERT INTO STREAMS')) {
    const [id, userId, title, category, thumbnail, country, isAiCompanion, status] = params;
    const existingIndex = memoryStore.streams.findIndex(s => s.id === id);
    const streamItem = {
      id,
      user_id: userId,
      title,
      category: category || 'Live',
      thumbnail_url: thumbnail || '',
      country: country || 'MY',
      is_ai_companion: isAiCompanion ? 1 : 0,
      status: status || 'live',
      viewer_count: Math.floor(Math.random() * 200) + 50,
      created_at: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      memoryStore.streams[existingIndex] = { ...memoryStore.streams[existingIndex], ...streamItem };
    } else {
      memoryStore.streams.unshift(streamItem);
    }
    return [{ affectedRows: 1, insertId: id }, null];
  }

  // 4. UPDATE STREAMS SET STATUS = 'ENDED'
  if (norm.startsWith('UPDATE STREAMS SET STATUS = "ENDED"') || norm.startsWith('UPDATE STREAMS SET STATUS = \'ENDED\'')) {
    const [streamId] = params;
    const target = memoryStore.streams.find(s => s.id === streamId);
    if (target) target.status = 'ended';
    return [{ affectedRows: 1 }, null];
  }

  // 5. TRANSACTIONS
  if (norm.includes('FROM TRANSACTIONS WHERE USER_ID = ?')) {
    const [userId] = params;
    const txs = memoryStore.transactions.filter(t => t.user_id === userId);
    return [txs, null];
  }

  if (norm.startsWith('INSERT INTO TRANSACTIONS')) {
    const [id, userId, type, amount] = params;
    const tx = { id, user_id: userId, type, amount, created_at: new Date().toISOString() };
    memoryStore.transactions.unshift(tx);
    return [{ affectedRows: 1, insertId: id }, null];
  }

  // 6. UPDATE USERS DIAMONDS
  if (norm.includes('UPDATE USERS SET DIAMONDS = DIAMONDS + ?')) {
    const [amount, userId] = params;
    const user = memoryStore.users.find(u => u.id === userId);
    if (user) user.diamonds = (user.diamonds || 0) + Number(amount);
    return [{ affectedRows: 1 }, null];
  }

  if (norm.includes('UPDATE USERS SET DIAMONDS = DIAMONDS - ?')) {
    const [amount, spendAmount, userId] = params;
    const targetUserId = userId || spendAmount;
    const spendVal = Number(spendAmount && userId ? spendAmount : amount);
    const user = memoryStore.users.find(u => u.id === targetUserId);
    if (user) {
      user.diamonds = Math.max(0, (user.diamonds || 0) - Number(amount));
      user.total_spending = (user.total_spending || 0) + spendVal;
    }
    return [{ affectedRows: 1 }, null];
  }

  if (norm.includes('UPDATE USERS SET BEANS = BEANS + ?')) {
    const [amount, userId] = params;
    const user = memoryStore.users.find(u => u.id === userId);
    if (user) {
      user.beans = (user.beans || 0) + Number(amount);
    }
    return [{ affectedRows: 1 }, null];
  }

  // 7. SELECT * FROM USERS
  if (norm.includes('FROM USERS')) {
    if (norm.includes('WHERE EMAIL = ?')) {
      const [email] = params;
      return [memoryStore.users.filter(u => u.email === email), null];
    }
    if (norm.includes('WHERE ID = ?')) {
      const [id] = params;
      return [memoryStore.users.filter(u => u.id === id), null];
    }
    return [memoryStore.users, null];
  }

  // 8. AGGREGATES & METRICS
  if (norm.includes('SELECT SUM(AMOUNT) AS TOTALOUT FROM TRANSACTIONS')) {
    const totalOut = memoryStore.transactions
      .filter(t => t.type === 'gift_sent')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return [[{ totalOut }], null];
  }

  if (norm.includes('SELECT SUM(AMOUNT) AS STREAMERTOTAL FROM TRANSACTIONS')) {
    const streamerTotal = memoryStore.transactions
      .filter(t => t.type === 'gift_received')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return [[{ streamerTotal }], null];
  }

  if (norm.includes('SELECT COUNT(*) AS COUNT, SUM(DIAMONDS) AS DIAMONDS, SUM(BEANS) AS BEANS FROM USERS')) {
    const count = memoryStore.users.length;
    const diamonds = memoryStore.users.reduce((s, u) => s + (u.diamonds || 0), 0);
    const beans = memoryStore.users.reduce((s, u) => s + (u.beans || 0), 0);
    return [[{ count, diamonds, beans }], null];
  }

  if (norm.includes('SELECT COUNT(*) AS COUNT FROM STREAMS WHERE STATUS = "LIVE"') || norm.includes('WHERE STATUS = \'LIVE\'')) {
    const count = memoryStore.streams.filter(s => s.status === 'live').length;
    return [[{ count }], null];
  }

  // 9. ECONOMY SETTINGS
  if (norm.includes('FROM ECONOMY_SETTINGS')) {
    return [[memoryStore.economy_settings], null];
  }

  if (norm.startsWith('UPDATE ECONOMY_SETTINGS')) {
    const [companyCut, streamerCut, luckyEnabled, luckyWinRate, luckySessionMin, usdToSgd, usdToMyr, usdToIdr] = params;
    if (companyCut !== undefined) memoryStore.economy_settings.company_cut_percentage = Number(companyCut);
    if (streamerCut !== undefined) memoryStore.economy_settings.streamer_cut_percentage = Number(streamerCut);
    if (luckyEnabled !== undefined) memoryStore.economy_settings.lucky_gift_enabled = luckyEnabled ? 1 : 0;
    if (luckyWinRate !== undefined) memoryStore.economy_settings.lucky_win_rate_percentage = Number(luckyWinRate);
    if (luckySessionMin !== undefined) memoryStore.economy_settings.lucky_session_minutes = Number(luckySessionMin);
    if (usdToSgd !== undefined) memoryStore.economy_settings.usd_to_sgd = Number(usdToSgd);
    if (usdToMyr !== undefined) memoryStore.economy_settings.usd_to_myr = Number(usdToMyr);
    if (usdToIdr !== undefined) memoryStore.economy_settings.usd_to_idr = Number(usdToIdr);
    memoryStore.economy_settings.updated_at = new Date().toISOString();
    return [{ affectedRows: 1 }, null];
  }

  return [[], null];
};

// Resilient Pool proxy that delegates to MySQL when active, or in-memory store seamlessly
export const pool = {
  execute: async (sql, params = []) => {
    if (isMysqlActive && realPool) {
      try {
        return await realPool.execute(sql, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          isMysqlActive = false;
        }
      }
    }
    return await handleInMemoryQuery(sql, params);
  },
  query: async (sql, params = []) => {
    if (isMysqlActive && realPool) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          isMysqlActive = false;
        }
      }
    }
    return await handleInMemoryQuery(sql, params);
  }
};

export { memoryStore };
export default pool;
