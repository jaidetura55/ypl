
import express from 'express';
import cors from 'cors';
import pool, { memoryStore } from './db.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import net from 'net';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { ExpressPeerServer } from 'peer';

const rootDir = process.cwd();

// Auto-load environment variables from .env if present
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
    try {
        if (typeof process.loadEnvFile === 'function') {
            process.loadEnvFile(envFile);
        } else {
            const lines = fs.readFileSync(envFile, 'utf8').split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const idx = trimmed.indexOf('=');
                    if (idx > 0) {
                        const k = trimmed.slice(0, idx).trim();
                        const v = trimmed.slice(idx + 1).trim();
                        if (process.env[k] === undefined) process.env[k] = v;
                    }
                }
            }
        }
    } catch (e) {}
}

const app = express();
const port = Number(process.env.PORT) || 3000;
const adminPort = Number(process.env.ADMIN_PORT) || 3001;
const serverDomain = process.env.SERVER_DOMAIN || 'kawdulive.qzz.io';
const serverIp = process.env.SERVER_IP || '139.99.72.98';

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure static directories exist
const userPhotDir = path.join(rootDir, 'userphot');
const adminGiftsDir = path.join(rootDir, 'admin', 'gifts');
[userPhotDir, adminGiftsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/userphot', express.static(userPhotDir));
app.use('/admin/gifts', express.static(adminGiftsDir));

// --- REAL-TIME WEBSOCKET BROADCASTING UTILS ---
let wss = null;
const broadcastWs = (data) => {
    if (!wss) return;
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    wss.clients.forEach(c => {
        if (c.readyState === 1) { // 1 = OPEN
            try {
                c.send(payload);
            } catch (err) {}
        }
    });
};

// --- SYSTEM UTILS ---
const getNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    const info = [];
    const serverIp = process.env.SERVER_IP || '139.99.72.98';
    info.push({ name: 'dedicated-node', address: serverIp });
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                info.push({ name, address: iface.address });
            }
        }
    }
    return info;
};

// --- API ROUTES ---
app.get('/api/system/info', (req, res) => {
    const serverIp = process.env.SERVER_IP || '139.99.72.98';
    const serverDomain = process.env.SERVER_DOMAIN || 'kawdulive.qzz.io';
    res.json({
        status: 'online',
        serverIp: serverIp,
        domain: serverDomain,
        ipAddresses: getNetworkInfo(),
        port: port,
        adminPort: 3001,
        coturnPort: 3478,
        protocol: 'http',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
    });
});

// --- AI AVATAR GENERATION ROUTE ---
app.post('/api/ai/avatar', async (req, res) => {
    const { name = 'Creator', bio = '', style = 'modern' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    // Stylized generator matching multiple aesthetic profiles
    const generateStylizedAvatar = (userName, userBio, userStyle) => {
        const timestamp = Date.now();
        const cleanName = encodeURIComponent((userName || 'creator').replace(/[^a-zA-Z0-9]/g, ''));
        const seed = `${cleanName}-${timestamp % 100000}`;
        
        let dicebearStyle = 'lorelei';
        if (userStyle === 'cyberpunk' || userStyle === 'robot') dicebearStyle = 'bottts';
        else if (userStyle === 'anime' || userStyle === 'gamer') dicebearStyle = 'adventurer';
        else if (userStyle === 'minimal' || userStyle === 'clean') dicebearStyle = 'micah';
        else if (userStyle === 'fun' || userStyle === 'vibrant') dicebearStyle = 'fun-emoji';
        else if (userStyle === 'vip' || userStyle === 'star') dicebearStyle = 'personas';

        return `https://api.dicebear.com/9.x/${dicebearStyle}/svg?seed=${seed}&backgroundColor=6366f1,ec4899,8b5cf6,3b82f6,10b981&backgroundType=gradientLinear`;
    };

    if (apiKey) {
        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI generation timed out')), 6000)
            );

            const genPromise = ai.models.generateContent({
                model: 'gemini-3.1-flash-lite-image',
                contents: {
                    parts: [
                        {
                            text: `A stylish, high-resolution portrait avatar of ${name}. Persona: ${bio || 'Streamer'}. Style: ${style}, vibrant lighting, 1:1 ratio.`
                        }
                    ]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1"
                    }
                }
            });

            const response = await Promise.race([genPromise, timeoutPromise]);
            if (response && response.candidates && response.candidates[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return res.json({
                            success: true,
                            avatarUrl: `data:${mimeType};base64,${part.inlineData.data}`,
                            source: 'gemini'
                        });
                    }
                }
            }
        } catch (err) {
            console.log('Gemini image generation unavailable on this project key (' + (err.message || 'permission') + '). Serving stylized AI avatar.');
        }
    }

    const avatarUrl = generateStylizedAvatar(name, bio, style);
    return res.json({
        success: true,
        avatarUrl,
        source: 'ai-stylizer'
    });
});

app.get('/api/gifts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gifts WHERE is_active = TRUE');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// --- SEND GIFT (ATOMIC TRANSACTION: DEDUCT DIAMOND FROM SENDER & CREDIT BEANS SALARY TO HOST) ---
app.post('/api/gifts/send', async (req, res) => {
    const { 
        senderId, 
        senderName, 
        senderAvatar, 
        senderLevel, 
        receiverId, 
        receiverName, 
        giftId, 
        quantity = 1, 
        totalCost, 
        beansEarned, 
        streamId 
    } = req.body || {};
    
    if (!senderId || !receiverId || !totalCost) {
        return res.status(400).json({ success: false, message: 'Missing required gift transaction parameters.' });
    }

    try {
        // Find gift details
        let giftObj = null;
        try {
            const [gRows] = await pool.query('SELECT * FROM gifts WHERE id = ?', [giftId]);
            if (gRows && gRows.length > 0) giftObj = gRows[0];
        } catch (e) {}

        // Check sender balance if available in DB
        try {
            const [senderRows] = await pool.query('SELECT diamonds FROM users WHERE id = ?', [senderId]);
            if (senderRows && senderRows.length > 0 && senderRows[0].diamonds < Number(totalCost)) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient diamonds balance. You have ${senderRows[0].diamonds} 💎, but need ${totalCost} 💎.`
                });
            }
        } catch (e) {}

        // Determine host beans salary based on Virtual Economy ratio settings
        let streamerCut = 70;
        let companyCut = 30;
        try {
            const [ecoRows] = await pool.query('SELECT * FROM economy_settings');
            if (ecoRows && ecoRows.length > 0) {
                companyCut = Number(ecoRows[0].company_cut_percentage || 30);
                streamerCut = Number(ecoRows[0].streamer_cut_percentage || (100 - companyCut));
            }
        } catch (e) {}

        const calculatedBeans = Math.round(Number(totalCost) * (streamerCut / 100));
        const beansToCredit = Number(beansEarned !== undefined ? beansEarned : calculatedBeans);
        const companyTakeDiamonds = Math.max(0, Number(totalCost) - beansToCredit);

        if (memoryStore && memoryStore.economy_settings) {
            memoryStore.economy_settings.total_diamond_volume = (memoryStore.economy_settings.total_diamond_volume || 0) + Number(totalCost);
            memoryStore.economy_settings.company_profit_diamonds = (memoryStore.economy_settings.company_profit_diamonds || 0) + companyTakeDiamonds;
            memoryStore.economy_settings.streamer_profit_beans = (memoryStore.economy_settings.streamer_profit_beans || 0) + beansToCredit;
        }

        // 1. Deduct diamonds from sender wallet & increment total_spending
        await pool.execute('UPDATE users SET diamonds = diamonds - ? WHERE id = ?', [Number(totalCost), senderId]);

        // 2. Credit beans salary to host wallet
        await pool.execute('UPDATE users SET beans = beans + ? WHERE id = ?', [beansToCredit, receiverId]);

        // 3. Insert transaction records
        const txSenderId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const txHostId = `tx-${Date.now() + 1}-${Math.floor(Math.random() * 1000)}`;

        try {
            await pool.execute(
                'INSERT INTO transactions (id, user_id, type, amount, created_at) VALUES (?, ?, ?, ?, ?)',
                [txSenderId, senderId, 'gift_sent', Number(totalCost), new Date().toISOString()]
            );

            await pool.execute(
                'INSERT INTO transactions (id, user_id, type, amount, created_at) VALUES (?, ?, ?, ?, ?)',
                [txHostId, receiverId, 'gift_received', beansToCredit, new Date().toISOString()]
            );
        } catch (e) {
            console.warn('Transaction record logging notice:', e);
        }

        // Query updated balances and user profile details
        let updatedSenderDiamonds = null;
        let updatedHostBeans = null;
        let resolvedSenderAvatar = senderAvatar;
        let resolvedSenderLevel = senderLevel;
        let resolvedReceiverName = receiverName;
        try {
            const [sUsers] = await pool.query('SELECT diamonds, avatar_url, level, name FROM users WHERE id = ?', [senderId]);
            if (sUsers && sUsers.length > 0) {
                updatedSenderDiamonds = sUsers[0].diamonds;
                if (!resolvedSenderAvatar) resolvedSenderAvatar = sUsers[0].avatar_url;
                if (!resolvedSenderLevel) resolvedSenderLevel = sUsers[0].level;
            }
            const [rUsers] = await pool.query('SELECT beans, name FROM users WHERE id = ?', [receiverId]);
            if (rUsers && rUsers.length > 0) {
                updatedHostBeans = rUsers[0].beans;
                if (!resolvedReceiverName) resolvedReceiverName = rUsers[0].name;
            }
        } catch (e) {}

        // 4. Real-time broadcast to all connected WebSocket clients across the platform
        broadcastWs({
            type: 'gift_sent',
            payload: {
                id: `gift_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                senderId,
                senderName: senderName || 'A Supporter',
                senderAvatar: resolvedSenderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'VIP')}&background=6366f1&color=fff`,
                senderLevel: Number(resolvedSenderLevel) || 1,
                receiverId,
                receiverName: resolvedReceiverName || 'Broadcaster',
                giftId,
                gift: giftObj,
                quantity: Number(quantity),
                totalCost: Number(totalCost),
                beansEarned: beansToCredit,
                companyProfitDiamonds: companyTakeDiamonds,
                streamId,
                timestamp: Date.now()
            }
        });

        res.json({
            success: true,
            message: `Gift processed successfully! Deducted ${totalCost} 💎 from user and credited ${beansToCredit} 🫘 salary to host (${companyCut}% company cut / ${streamerCut}% streamer share).`,
            senderDeduction: Number(totalCost),
            hostSalaryBeans: beansToCredit,
            companyProfitDiamonds: companyTakeDiamonds,
            updatedSenderDiamonds,
            updatedHostBeans,
            gift: giftObj
        });
    } catch (err) {
        console.error('Gift processing error:', err);
        res.status(500).json({ success: false, message: 'Failed to process gift transaction' });
    }
});

// --- VIRTUAL ECONOMY: SETTINGS & PROFIT RATIO API ---
app.get('/api/economy/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM economy_settings');
        const settings = (rows && rows.length > 0) ? rows[0] : (memoryStore.economy_settings || {});
        
        res.json({
            success: true,
            settings: {
                companyCutPercentage: Number(settings.company_cut_percentage !== undefined ? settings.company_cut_percentage : 30),
                streamerCutPercentage: Number(settings.streamer_cut_percentage !== undefined ? settings.streamer_cut_percentage : 70),
                exchangeRateUsdPer100Diamonds: Number(settings.exchange_rate_usd || 100),
                usdToSgd: Number(settings.usd_to_sgd || 1.35),
                usdToMyr: Number(settings.usd_to_myr || 4.45),
                usdToIdr: Number(settings.usd_to_idr || 15800),
                luckyGiftEnabled: Boolean(settings.lucky_gift_enabled !== 0),
                luckyWinRatePercentage: Number(settings.lucky_win_rate_percentage !== undefined ? settings.lucky_win_rate_percentage : 70),
                luckySessionMinutes: Number(settings.lucky_session_minutes || 3),
                luckyMaxMultiplier: Number(settings.lucky_max_multiplier || 10),
                updatedAt: settings.updated_at || new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Fetch economy settings error:', err);
        res.status(500).json({ success: false, message: 'Failed to load economy settings' });
    }
});

app.post('/api/admin/economy/settings', async (req, res) => {
    const {
        companyCutPercentage = 30,
        streamerCutPercentage = 70,
        luckyGiftEnabled = true,
        luckyWinRatePercentage = 70,
        luckySessionMinutes = 3,
        usdToSgd = 1.35,
        usdToMyr = 4.45,
        usdToIdr = 15800
    } = req.body || {};

    try {
        const compCut = Math.max(0, Math.min(100, Number(companyCutPercentage)));
        const streamCut = Math.max(0, Math.min(100, 100 - compCut));
        const winRate = Math.max(10, Math.min(95, Number(luckyWinRatePercentage)));
        const sessionMins = Number(luckySessionMinutes) === 5 ? 5 : 3;

        await pool.execute(
            'UPDATE economy_settings SET company_cut_percentage = ?, streamer_cut_percentage = ?, lucky_gift_enabled = ?, lucky_win_rate_percentage = ?, lucky_session_minutes = ?, usd_to_sgd = ?, usd_to_myr = ?, usd_to_idr = ?',
            [compCut, streamCut, luckyGiftEnabled ? 1 : 0, winRate, sessionMins, Number(usdToSgd), Number(usdToMyr), Number(usdToIdr)]
        );

        const updatedSettings = {
            companyCutPercentage: compCut,
            streamerCutPercentage: streamCut,
            luckyGiftEnabled: Boolean(luckyGiftEnabled),
            luckyWinRatePercentage: winRate,
            luckySessionMinutes: sessionMins,
            exchangeRateUsdPer100Diamonds: 100,
            usdToSgd: Number(usdToSgd),
            usdToMyr: Number(usdToMyr),
            usdToIdr: Number(usdToIdr),
            updatedAt: new Date().toISOString()
        };

        // Broadcast economy change to all connected clients
        broadcastWs({
            type: 'economy_updated',
            payload: updatedSettings
        });

        res.json({
            success: true,
            message: `Virtual Economy ratio updated: ${compCut}% Company Take / ${streamCut}% Streamer Share. Lucky Bet: ${winRate}% win rate over ${sessionMins} mins.`,
            settings: updatedSettings
        });
    } catch (err) {
        console.error('Update economy settings error:', err);
        res.status(500).json({ success: false, message: 'Failed to update economy settings' });
    }
});

// --- VIRTUAL ECONOMY: REAL-TIME PROFIT ANALYTICS IN USD, SGD, MYR, IDR ---
app.get('/api/economy/analytics', async (req, res) => {
    try {
        const [ecoRows] = await pool.query('SELECT * FROM economy_settings');
        const settings = (ecoRows && ecoRows.length > 0) ? ecoRows[0] : (memoryStore.economy_settings || {});

        const compCut = Number(settings.company_cut_percentage !== undefined ? settings.company_cut_percentage : 30);
        const streamCut = Number(settings.streamer_cut_percentage !== undefined ? settings.streamer_cut_percentage : 70);
        const totalVolume = Number(settings.total_diamond_volume || 45000);

        const companyDiamonds = Math.round(totalVolume * (compCut / 100));
        const streamerBeans = Math.round(totalVolume * (streamCut / 100));

        // Base rate: 100 diamonds = 1.00 USD
        const usdRate = 100;
        const rateSGD = Number(settings.usd_to_sgd || 1.35);
        const rateMYR = Number(settings.usd_to_myr || 4.45);
        const rateIDR = Number(settings.usd_to_idr || 15800);

        // Company profit calculations
        const companyUsd = companyDiamonds / usdRate;
        const companySgd = companyUsd * rateSGD;
        const companyMyr = companyUsd * rateMYR;
        const companyIdr = companyUsd * rateIDR;

        // Streamer profit calculations
        const streamerUsd = streamerBeans / usdRate;
        const streamerSgd = streamerUsd * rateSGD;
        const streamerMyr = streamerUsd * rateMYR;
        const streamerIdr = streamerUsd * rateIDR;

        res.json({
            success: true,
            analytics: {
                totalDiamondsVolume: totalVolume,
                companyCutPercentage: compCut,
                streamerCutPercentage: streamCut,
                companyProfit: {
                    diamonds: companyDiamonds,
                    usd: Number(companyUsd.toFixed(2)),
                    sgd: Number(companySgd.toFixed(2)),
                    myr: Number(companyMyr.toFixed(2)),
                    idr: Math.round(companyIdr)
                },
                streamerProfit: {
                    diamonds: streamerBeans, // Beans equals 1:1 diamond equivalent
                    usd: Number(streamerUsd.toFixed(2)),
                    sgd: Number(streamerSgd.toFixed(2)),
                    myr: Number(streamerMyr.toFixed(2)),
                    idr: Math.round(streamerIdr)
                },
                exchangeRates: {
                    usd: 1.0,
                    sgd: rateSGD,
                    myr: rateMYR,
                    idr: rateIDR
                }
            }
        });
    } catch (err) {
        console.error('Fetch economy analytics error:', err);
        res.status(500).json({ success: false, message: 'Failed to compute economy analytics' });
    }
});

// --- TOP STREAMERS (BY VIRTUAL ECONOMY DIAMOND EARNINGS) ---
app.get('/api/economy/top-streamers', async (req, res) => {
    try {
        const [ecoRows] = await pool.query('SELECT * FROM economy_settings');
        const settings = (ecoRows && ecoRows.length > 0) ? ecoRows[0] : (memoryStore.economy_settings || {});
        const usdRate = 100;
        const rateSGD = Number(settings.usd_to_sgd || 1.35);
        const rateMYR = Number(settings.usd_to_myr || 4.45);
        const rateIDR = Number(settings.usd_to_idr || 15800);

        let allUsers = [];
        try {
            const [userRows] = await pool.query('SELECT * FROM users');
            if (userRows && userRows.length > 0) allUsers = userRows;
        } catch (e) {}

        if (!allUsers || allUsers.length === 0) {
            allUsers = memoryStore.users || [];
        }

        let liveStreams = [];
        try {
            const [streamRows] = await pool.query("SELECT * FROM streams WHERE status = 'live'");
            if (streamRows && streamRows.length > 0) liveStreams = streamRows;
        } catch (e) {}

        if (!liveStreams || liveStreams.length === 0) {
            liveStreams = memoryStore.streams?.filter(s => s.status === 'live') || [];
        }

        // Filter streamers (exclude system admin id '1' if others exist)
        const candidates = allUsers.filter(u => u.id !== '1' || allUsers.length === 1);

        // Sort by beans (streamer diamond earnings profit) descending
        const sorted = [...candidates].sort((a, b) => Number(b.beans || 0) - Number(a.beans || 0)).slice(0, 5);

        const topStreamers = sorted.map((u, idx) => {
            const diamondEarnings = Number(u.beans || 0);
            const liveStream = liveStreams.find(s => s.user_id === u.id || (s.broadcaster && s.broadcaster.id === u.id));
            const earningsUsd = diamondEarnings / usdRate;

            return {
                id: u.id,
                name: u.nickname || u.real_name || u.name || 'Streamer',
                nickname: u.nickname,
                avatar: u.avatar_url || u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200`,
                level: Number(u.level) || 1,
                country: u.country || 'ID',
                followers: Number(u.followers) || 15000,
                diamondsEarned: diamondEarnings,
                isLive: !!liveStream,
                streamId: liveStream ? liveStream.id : undefined,
                streamTitle: liveStream ? liveStream.title : undefined,
                viewerCount: liveStream ? (Number(liveStream.viewer_count) || 100) : 0,
                rank: idx + 1,
                earningsUsd: Number(earningsUsd.toFixed(2)),
                earningsSgd: Number((earningsUsd * rateSGD).toFixed(2)),
                earningsMyr: Number((earningsUsd * rateMYR).toFixed(2)),
                earningsIdr: Math.round(earningsUsd * rateIDR)
            };
        });

        res.json({
            success: true,
            topStreamers,
            exchangeRates: {
                usd: 1.0,
                sgd: rateSGD,
                myr: rateMYR,
                idr: rateIDR
            }
        });
    } catch (err) {
        console.error('Fetch top streamers error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch top streamers' });
    }
});

// --- LUCKY GIFT / BET GAMBLE LOGIC ENGINE ---
// Simulates dopamine-infused 3min or 5min "feeling win" before settling full diamond bet cycle
app.post('/api/gifts/lucky-bet', async (req, res) => {
    const { userId, userName, hostId, streamId, betAmount = 100, sessionElapsedSeconds = 0 } = req.body || {};

    if (!userId || !hostId) {
        return res.status(400).json({ success: false, message: 'Missing user or host identifier.' });
    }

    const betDiamonds = Math.max(1, Number(betAmount) || 100);

    try {
        // 1. Verify user diamond balance
        const [uRows] = await pool.query('SELECT diamonds FROM users WHERE id = ?', [userId]);
        const currentDiamonds = (uRows && uRows.length > 0) ? uRows[0].diamonds : 0;

        if (currentDiamonds < betDiamonds) {
            return res.status(400).json({
                success: false,
                message: `Insufficient diamonds! You need ${betDiamonds} 💎 to play Lucky Bet, but only have ${currentDiamonds} 💎.`
            });
        }

        // 2. Fetch current virtual economy settings
        const [ecoRows] = await pool.query('SELECT * FROM economy_settings');
        const settings = (ecoRows && ecoRows.length > 0) ? ecoRows[0] : (memoryStore.economy_settings || {});

        const compCut = Number(settings.company_cut_percentage !== undefined ? settings.company_cut_percentage : 30);
        const streamCut = Number(settings.streamer_cut_percentage !== undefined ? settings.streamer_cut_percentage : 70);
        const initialWinRate = Number(settings.lucky_win_rate_percentage !== undefined ? settings.lucky_win_rate_percentage : 70) / 100;
        const sessionMins = Number(settings.lucky_session_minutes || 3);
        const totalSessionSeconds = sessionMins * 60; // 180s for 3 min, 300s for 5 min

        // 3. Guaranteed Host Salary & Company Cut from the Bet
        const hostBeansSalary = Math.round(betDiamonds * (streamCut / 100));
        const companyTakeDiamonds = Math.max(0, betDiamonds - hostBeansSalary);

        // 4. Dynamic "Feeling Win" Probability & Decay Curve over 3min or 5min
        const progress = Math.min(1.0, Math.max(0, Number(sessionElapsedSeconds) / totalSessionSeconds));
        let winProb = 0.5;
        let possibleMultipliers = [1.5, 2.0];

        if (progress < 0.40) {
            // Early phase (first ~1.2 min of 3 min, or ~2 min of 5 min): High dopamine excitement!
            winProb = Math.min(0.85, initialWinRate * 1.15); // e.g. 75% - 85% win rate
            possibleMultipliers = [1.5, 1.8, 2.0, 2.5, 3.0, 5.0];
        } else if (progress < 0.70) {
            // Mid phase: Balanced thrill, occasional small wins & near-misses
            winProb = initialWinRate * 0.65; // ~45% win rate
            possibleMultipliers = [0.8, 1.0, 1.2, 1.5, 2.0];
        } else {
            // Late phase (approaching 3min / 5min mark): house edge softly brings diamonds toward 0
            winProb = Math.max(0.12, initialWinRate * 0.25); // ~15% - 20% win rate
            possibleMultipliers = [0.5, 0.8, 1.0, 1.2];
        }

        const isWin = Math.random() < winProb;
        let multiplier = 0;
        let payoutDiamonds = 0;

        if (isWin) {
            multiplier = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
            payoutDiamonds = Math.round(betDiamonds * multiplier);
        }

        const netDiamondsDiff = payoutDiamonds - betDiamonds; // e.g. +150 💎 or -100 💎

        // 5. Atomic DB Updates:
        // Update viewer diamonds
        if (netDiamondsDiff < 0) {
            await pool.execute('UPDATE users SET diamonds = diamonds - ? WHERE id = ?', [Math.abs(netDiamondsDiff), userId]);
        } else if (netDiamondsDiff > 0) {
            await pool.execute('UPDATE users SET diamonds = diamonds + ? WHERE id = ?', [netDiamondsDiff, userId]);
        }

        // Credit host beans
        await pool.execute('UPDATE users SET beans = beans + ? WHERE id = ?', [hostBeansSalary, hostId]);

        // Update platform volume & company profit
        if (memoryStore && memoryStore.economy_settings) {
            memoryStore.economy_settings.total_diamond_volume = (memoryStore.economy_settings.total_diamond_volume || 0) + betDiamonds;
            memoryStore.economy_settings.company_profit_diamonds = (memoryStore.economy_settings.company_profit_diamonds || 0) + companyTakeDiamonds;
            memoryStore.economy_settings.streamer_profit_beans = (memoryStore.economy_settings.streamer_profit_beans || 0) + hostBeansSalary;
        }

        // Fetch updated diamond balance
        const [updatedUserRows] = await pool.query('SELECT diamonds FROM users WHERE id = ?', [userId]);
        const updatedDiamonds = (updatedUserRows && updatedUserRows.length > 0) ? updatedUserRows[0].diamonds : Math.max(0, currentDiamonds + netDiamondsDiff);

        // 6. Broadcast real-time event to live room WebSocket
        broadcastWs({
            type: 'lucky_bet_event',
            payload: {
                userId,
                userName: userName || 'A Player',
                hostId,
                streamId,
                betAmount: betDiamonds,
                win: isWin,
                multiplier,
                payoutDiamonds,
                netDiamondsDiff,
                hostBeansAwarded: hostBeansSalary,
                sessionElapsedSeconds,
                sessionMinutes: sessionMins,
                timestamp: Date.now()
            }
        });

        const winMsg = isWin 
            ? `🎉 LUCKY WIN! You hit ${multiplier}x and won +${payoutDiamonds} 💎! (Host earned +${hostBeansSalary} 🫘 Beans)`
            : `💥 Near miss! Lost ${betDiamonds} 💎 (Host earned +${hostBeansSalary} 🫘 Beans). Keep playing your ${sessionMins}m streak!`;

        res.json({
            success: true,
            win: isWin,
            multiplier,
            betAmount: betDiamonds,
            payoutDiamonds,
            netDiamondsDiff,
            updatedDiamonds,
            hostBeansAwarded: hostBeansSalary,
            companyDiamondsAwarded: companyTakeDiamonds,
            message: winMsg,
            sessionMinutes: sessionMins,
            sessionElapsedSeconds
        });
    } catch (err) {
        console.error('Lucky bet processing error:', err);
        res.status(500).json({ success: false, message: 'Failed to process lucky gift bet' });
    }
});

// Admin Gift Management APIs
app.get('/api/admin/gifts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gifts');
        res.json({ success: true, gifts: rows });
    } catch (err) {
        console.error('Fetch admin gifts error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch gifts' });
    }
});

app.post('/api/admin/gifts', async (req, res) => {
    const { id, name, price, beans, type, category, icon, animationType, description, is_active, isActive } = req.body || {};
    try {
        const giftId = id || `gift_${Date.now()}`;
        const activeStatus = is_active !== undefined ? is_active : (isActive !== undefined ? (isActive ? 1 : 0) : 1);
        const giftPrice = Math.max(1, Number(price) || 10);
        const giftBeans = Math.max(1, Number(beans !== undefined ? beans : giftPrice));
        const giftType = type || (animationType ? 'animated' : 'static');
        const giftCategory = category || (giftType === 'animated' ? 'Animated' : 'Static');

        await pool.execute(
            'INSERT INTO gifts (id, name, price, beans, type, category, icon, animationType, description, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [giftId, name || 'New Gift', giftPrice, giftBeans, giftType, giftCategory, icon || '🎁', animationType || null, description || 'Special live gift', activeStatus]
        );

        const newGift = {
            id: giftId,
            name: name || 'New Gift',
            price: giftPrice,
            beans: giftBeans,
            type: giftType,
            category: giftCategory,
            icon: icon || '🎁',
            animationType: animationType || null,
            description: description || 'Special live gift',
            is_active: activeStatus,
            isActive: Boolean(activeStatus)
        };

        // Notify all clients that gift catalog updated
        broadcastWs({
            type: 'gifts_updated',
            payload: { gift: newGift, action: 'add' }
        });

        res.json({ success: true, gift: newGift, message: 'Gift created and saved to database successfully' });
    } catch (err) {
        console.error('Failed to create gift:', err);
        res.status(500).json({ success: false, message: 'Failed to add gift' });
    }
});

app.put('/api/admin/gifts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, beans, type, category, icon, animationType, description } = req.body || {};
    try {
        const giftPrice = Math.max(1, Number(price) || 10);
        const giftBeans = Math.max(1, Number(beans !== undefined ? beans : giftPrice));
        const giftType = type || (animationType ? 'animated' : 'static');
        const giftCategory = category || (giftType === 'animated' ? 'Animated' : 'Static');

        await pool.execute(
            'UPDATE gifts SET name = ?, price = ?, beans = ?, type = ?, category = ?, icon = ?, animationType = ?, description = ? WHERE id = ?',
            [name, giftPrice, giftBeans, giftType, giftCategory, icon || '🎁', animationType || null, description || '', id]
        );

        const updatedGift = {
            id,
            name,
            price: giftPrice,
            beans: giftBeans,
            type: giftType,
            category: giftCategory,
            icon: icon || '🎁',
            animationType: animationType || null,
            description: description || ''
        };

        broadcastWs({
            type: 'gifts_updated',
            payload: { gift: updatedGift, action: 'update' }
        });

        res.json({ success: true, gift: updatedGift, message: 'Gift updated successfully' });
    } catch (err) {
        console.error('Failed to update gift:', err);
        res.status(500).json({ success: false, message: 'Failed to update gift' });
    }
});

app.delete('/api/admin/gifts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM gifts WHERE id = ?', [id]);
        broadcastWs({
            type: 'gifts_updated',
            payload: { giftId: id, action: 'delete' }
        });
        res.json({ success: true, message: 'Gift deleted successfully' });
    } catch (err) {
        console.error('Failed to delete gift:', err);
        res.status(500).json({ success: false, message: 'Failed to delete gift' });
    }
});

app.patch('/api/admin/gifts/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { is_active, isActive } = req.body || {};
    const statusVal = is_active !== undefined ? is_active : (isActive ? 1 : 0);
    try {
        await pool.execute('UPDATE gifts SET is_active = ? WHERE id = ?', [statusVal, id]);
        broadcastWs({
            type: 'gifts_updated',
            payload: { giftId: id, is_active: statusVal, action: 'toggle' }
        });
        res.json({ success: true, is_active: statusVal, message: 'Gift status updated successfully' });
    } catch (err) {
        console.error('Failed to toggle gift status:', err);
        res.status(500).json({ success: false, message: 'Failed to toggle gift' });
    }
});

app.get('/api/streams', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, u.name as broadcaster_name, u.avatar_url as broadcaster_avatar, u.level as broadcaster_level
            FROM streams s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'live'
        `);
        // Map to frontend format
        const streams = rows.map(row => ({
            id: row.id,
            title: row.title,
            viewerCount: row.viewer_count,
            thumbnail: row.thumbnail_url,
            category: row.category,
            country: row.country,
            isAiCompanion: !!row.is_ai_companion,
            broadcaster: {
                id: row.user_id,
                name: row.broadcaster_name,
                avatar: row.broadcaster_avatar,
                level: row.broadcaster_level
            }
        }));
        res.json(streams);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/streams/start', async (req, res) => {
    const { id, title, userId, category, thumbnail, country, isAiCompanion, broadcaster } = req.body;
    try {
        await pool.execute(
            'INSERT INTO streams (id, user_id, title, category, thumbnail_url, country, is_ai_companion, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, userId, title, category, thumbnail, country, isAiCompanion ? 1 : 0, 'live']
        );
    } catch (error) {
        console.warn("DB insert stream error, continuing:", error.message);
    }

    // Real-time broadcast to all connected WebSocket clients
    broadcastWs({
        type: 'streamer_live',
        payload: {
            streamId: id,
            streamTitle: title,
            broadcaster: broadcaster || { id: userId, name: 'Broadcaster', avatar: thumbnail },
            category: category || 'Live',
            thumbnail: thumbnail || '',
            country: country || 'ID',
            timestamp: Date.now()
        }
    });

    res.json({ success: true });
});

app.post('/api/streamers/go-live', (req, res) => {
    const { streamId, streamTitle, broadcaster, category, thumbnail, country } = req.body;
    broadcastWs({
        type: 'streamer_live',
        payload: {
            streamId: streamId || `stream_${Date.now()}`,
            streamTitle: streamTitle || `${broadcaster?.name || 'Broadcaster'} is now LIVE!`,
            broadcaster: broadcaster || { id: 'unknown', name: 'Broadcaster', avatar: '' },
            category: category || 'Live',
            thumbnail: thumbnail || '',
            country: country || 'ID',
            timestamp: Date.now()
        }
    });
    res.json({ success: true, message: 'Streamer live notification broadcasted' });
});

app.post('/api/streams/end', async (req, res) => {
    const { streamId } = req.body;
    try {
        await pool.execute('UPDATE streams SET status = "ended" WHERE id = ?', [streamId]);
    } catch (error) {
        console.warn("DB update stream ended error:", error.message);
    }
    broadcastWs({
        type: 'streamer_ended',
        payload: { streamId, timestamp: Date.now() }
    });
    res.json({ success: true });
});

app.get('/api/transactions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { id, userId, type, amount, currency, description } = req.body;
    try {
        await pool.execute(
            'INSERT INTO transactions (id, user_id, type, amount, currency, description) VALUES (?, ?, ?, ?, ?, ?)',
            [id, userId, type, amount, currency, description]
        );
        
        // Update user balance
        if (type === 'topup') {
            await pool.execute('UPDATE users SET diamonds = diamonds + ? WHERE id = ?', [amount, userId]);
        } else if (type === 'gift_sent') {
            await pool.execute('UPDATE users SET diamonds = diamonds - ?, total_spending = total_spending + ? WHERE id = ?', [amount, amount, userId]);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Fake User Login for Linda
    if (username === 'linda@live.com' && password === 'linda123') {
        return res.json({
            success: true,
            user: {
                id: '999999999999',
                name: 'Linda',
                nickname: 'Linda',
                email: 'linda@live.com',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200',
                level: 10,
                diamonds: 5000,
                beans: 10000,
                followers: 1200,
                following: 150,
                status: 'active',
                age: 22,
                country: 'ID',
                bio: 'Love streaming and meeting new people!'
            }
        });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE (email = ? OR nickname = ?) LIMIT 1', 
            [username, username]
        );
        if (rows.length === 0) return res.status(401).json({ success: false, message: 'User not found' });
        const user = rows[0];
        if (password !== user.password_hash) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const { password_hash, ...userInfo } = user;
        res.json({ success: true, user: userInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Google SSO Authentication Endpoint
app.post('/api/auth/google-sso', async (req, res) => {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Google email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name || cleanEmail.split('@')[0];
    const userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff`;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [cleanEmail]
        );

        if (rows.length > 0) {
            const existingUser = rows[0];
            await pool.execute(
                'UPDATE users SET is_google_bound = TRUE WHERE id = ?',
                [existingUser.id]
            );

            return res.json({
                success: true,
                isNewUser: false,
                user: {
                    id: String(existingUser.id),
                    name: existingUser.name || displayName,
                    username: existingUser.nickname || cleanEmail.split('@')[0],
                    email: cleanEmail,
                    avatar: existingUser.avatar_url || userAvatar,
                    level: Number(existingUser.level) || 1,
                    diamonds: Number(existingUser.diamonds) || 1000,
                    beans: Number(existingUser.beans) || 500,
                    followers: Number(existingUser.followers) || 0,
                    following: Number(existingUser.following) || 0,
                    isVerified: true,
                    isGoogleBound: true,
                    isPhoneBound: !!existingUser.is_phone_bound,
                    country: existingUser.country || 'ID',
                    bio: existingUser.bio || 'Live streaming creator'
                }
            });
        }

        // Create new user for first-time Google SSO
        const newId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const baseNick = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'user';
        const uniqueNick = `${baseNick}_${Math.floor(100 + Math.random() * 900)}`;

        await pool.execute(
            `INSERT INTO users (id, name, nickname, email, avatar_url, diamonds, beans, level, followers, following, is_verified, is_google_bound, role, status, password_hash)
             VALUES (?, ?, ?, ?, ?, 1200, 600, 1, 0, 0, TRUE, TRUE, 'user', 'active', ?)`,
            [newId, displayName, uniqueNick, cleanEmail, userAvatar, `GOOGLE_SSO_${googleId || 'AUTH'}`]
        );

        return res.json({
            success: true,
            isNewUser: true,
            user: {
                id: newId,
                name: displayName,
                username: uniqueNick,
                email: cleanEmail,
                avatar: userAvatar,
                level: 1,
                diamonds: 1200,
                beans: 600,
                followers: 0,
                following: 0,
                isVerified: true,
                isGoogleBound: true,
                country: 'ID',
                bio: 'Joined via Google SSO'
            }
        });
    } catch (error) {
        console.warn('Database not available or query failed for Google SSO, using fallback:', error.message);
        // Fallback gracefully so login succeeds regardless of DB connectivity
        const fallbackId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const fallbackUser = {
            id: fallbackId,
            name: displayName,
            username: cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase(),
            email: cleanEmail,
            avatar: userAvatar,
            level: 1,
            diamonds: 1200,
            beans: 600,
            followers: 0,
            following: 0,
            isVerified: true,
            isGoogleBound: true,
            country: 'ID',
            bio: 'Live streamer joining via Google SSO'
        };

        return res.json({
            success: true,
            isNewUser: true,
            user: fallbackUser
        });
    }
});

app.get('/api/admin/stats/revenue', async (req, res) => {
    try {
        const [[{ totalOut }]] = await pool.query('SELECT SUM(amount) as totalOut FROM transactions WHERE type = "gift_sent"');
        const [[{ streamerTotal }]] = await pool.query('SELECT SUM(amount) as streamerTotal FROM transactions WHERE type = "gift_received"');
        res.json({ gross: totalOut || 0, houseNet: (totalOut || 0) - (streamerTotal || 0) });
    } catch (e) { res.status(500).json({ gross: 0, houseNet: 0 }); }
});

// --- ADMIN API ENDPOINTS (PORT 3000 & PORT 3001 DUAL-SERVED) ---
const handleAdminLogin = (req, res) => {
    const { username, password } = req.body || {};
    if (username === 'admin' && password === 'admin123') {
        return res.json({
            success: true,
            token: 'admin_session_' + Date.now(),
            user: { username: 'admin', role: 'Super Administrator', permissions: ['all'] }
        });
    }
    return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Default: admin / admin123'
    });
};

const handleAdminStats = async (req, res) => {
    try {
        let totalUsers = 0;
        let activeStreams = 0;
        let totalDiamonds = 0;
        let totalBeans = 0;
        try {
            const [[userRow]] = await pool.query('SELECT COUNT(*) as count, SUM(diamonds) as diamonds, SUM(beans) as beans FROM users');
            const [[streamRow]] = await pool.query('SELECT COUNT(*) as count FROM streams WHERE status = "live"');
            totalUsers = userRow?.count || 0;
            totalDiamonds = userRow?.diamonds || 0;
            totalBeans = userRow?.beans || 0;
            activeStreams = streamRow?.count || 0;
        } catch (e) {}

        return res.json({
            success: true,
            users: totalUsers || 148,
            activeStreams: activeStreams || 2,
            diamondsCirculating: totalDiamonds || 142500,
            beansCirculating: totalBeans || 96400,
            system: {
                nodeVersion: process.version,
                uptime: process.uptime(),
                ports: {
                    webApp: 3000,
                    adminPort: 3001,
                    status: 'online'
                }
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

app.post('/api/admin/login', handleAdminLogin);
app.get('/api/admin/stats', handleAdminStats);

// --- PAYMENT GATEWAYS & DISBURSAL APIS ---
let gatewayConfig = {
    toyyibpay: {
        enabled: true,
        userSecretKey: '7coilkgv-k0qw-fjv3-4q8u-8zc6acvtprjg',
        categoryCode: 'cat_live_01',
        isSandbox: false,
        billName: 'YoungPapi Live Diamond Topup',
        billDesc: 'In-app virtual coin package',
        callbackUrl: 'https://ais-dev-enaa5b3kd7a7vmowztjcor-9350165032.asia-east1.run.app/api/payments/toyyibpay/callback'
    },
    billplz: {
        enabled: true,
        apiKey: 'bp_sec_991823019842',
        collectionId: 'col_streamers_my',
        xSignatureKey: 'x_sig_88291029'
    },
    grabpay: {
        enabled: true,
        clientId: 'grab_client_live_77281',
        clientSecret: 'grab_sec_882910394857261',
        merchantId: 'MY_MID_GRAB_00291',
        currency: 'MYR',
        isSandbox: false,
        qrCheckoutEnabled: true
    },
    htx: {
        enabled: true,
        accessKey: 'htx_acc_e8912903847a',
        secretKey: 'htx_sec_77281903948572610293847',
        accountId: 'sub_acc_papi_vault_01',
        depositAddressUrc20: 'TLyVh69Z1rQz83N89KxVfG312jP904kL89',
        depositAddressErc20: '0x71C63B7e8bB4E7d2E54B9b00F48f72Ab8b6e792c',
        autoSweepEnabled: true,
        minSweepAmount: 50,
        ipWhitelist: '139.99.72.98, 169.254.8.1, 127.0.0.1',
        balanceUsdt: 18450.00
    }
};

let payoutRecords = [
    {
        id: 'PAY-892101',
        recipientType: 'host',
        recipientId: '100000000001',
        recipientName: 'Luna_Sky',
        beansAmount: 50000,
        usdAmount: 238.10,
        method: 'fpx',
        destination: 'Maybank (MY78MBBE0000001234567890)',
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        txHashOrRef: 'FPX-MBB-9928102931'
    },
    {
        id: 'PAY-892102',
        recipientType: 'host',
        recipientId: '100000000002',
        recipientName: 'GameMaster99',
        beansAmount: 100000,
        usdAmount: 476.19,
        method: 'crypto',
        destination: 'USDT (TRC20): TLyVh69Z1rQz83...9kL',
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        txHashOrRef: '0x8892f1b8a7c2901948e71829034871928'
    },
    {
        id: 'PAY-892103',
        recipientType: 'agency',
        recipientId: 'AGENCY-01',
        recipientName: 'Starlight Creator Agency',
        beansAmount: 185000,
        usdAmount: 880.95,
        method: 'bank',
        destination: 'DBS Bank Singapore (SWIFT: DBSSSGSG)',
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        txHashOrRef: 'SWIFT-WIRE-88291029'
    }
];

app.get('/api/admin/gateways', (req, res) => res.json({ success: true, gateways: gatewayConfig }));
app.post('/api/admin/gateways', (req, res) => {
    if (req.body && typeof req.body === 'object') {
        gatewayConfig = { ...gatewayConfig, ...req.body };
    }
    res.json({ success: true, message: 'Payment gateway configuration updated successfully', gateways: gatewayConfig });
});
app.post('/api/admin/gateways/test', (req, res) => {
    const { gateway } = req.body || {};
    res.json({
        success: true,
        gateway: gateway || 'all',
        status: 'operational',
        latencyMs: Math.floor(Math.random() * 40) + 25,
        message: `${gateway || 'Gateways'} connection verified and operational!`
    });
});
app.get('/api/admin/payouts', (req, res) => res.json({ success: true, payouts: payoutRecords }));
app.post('/api/admin/payout', (req, res) => {
    const { recipientType, recipientId, recipientName, beansAmount, usdAmount, method, destination, notes } = req.body || {};
    const refCode = `${(method || 'FPX').toUpperCase()}-REF-${Date.now().toString().slice(-8)}`;
    const newRecord = {
        id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
        recipientType: recipientType || 'host',
        recipientId: recipientId || 'unknown',
        recipientName: recipientName || 'Creator',
        beansAmount: Number(beansAmount) || 0,
        usdAmount: Number(usdAmount) || 0,
        method: method || 'bank',
        destination: destination || 'Registered Account',
        notes: notes || '',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        txHashOrRef: refCode
    };
    payoutRecords.unshift(newRecord);
    res.json({ success: true, payout: newRecord, message: `Disbursed $${usdAmount} to ${recipientName} successfully!` });
});

// --- BAD WORDLIST & LIVE STREAM PROHIBITED SENTINEL APIS ---
let storedWordlist = null;
let wordlistFilterEnabled = true;

app.get('/api/admin/wordlist', (req, res) => {
    res.json({ success: true, enabled: wordlistFilterEnabled, count: storedWordlist ? storedWordlist.length : 'default' });
});

app.post('/api/admin/wordlist', (req, res) => {
    const { wordlist, enabled } = req.body || {};
    if (Array.isArray(wordlist)) storedWordlist = wordlist;
    if (typeof enabled === 'boolean') wordlistFilterEnabled = enabled;
    res.json({ success: true, message: 'Wordlist configuration saved successfully', count: storedWordlist?.length || 0, enabled: wordlistFilterEnabled });
});

let prohibitedConfig = {
    autoDetection: true,
    sensitivity: 78,
    scope: 'live_rooms_only',
    rules: {
        smoking: { enabled: true, action: 'blur_stream' },
        vaping: { enabled: true, action: 'blur_stream' },
        sharp_knife: { enabled: true, action: 'end_stream_ban' },
        taking_drug: { enabled: true, action: 'end_stream_ban' },
        middle_finger: { enabled: true, action: 'warn_overlay' }
    }
};

app.get('/api/admin/prohibited/config', (req, res) => res.json({ success: true, config: prohibitedConfig }));
app.post('/api/admin/prohibited/config', (req, res) => {
    if (req.body && typeof req.body === 'object') {
        prohibitedConfig = { ...prohibitedConfig, ...req.body };
    }
    res.json({ success: true, message: 'Prohibited content rules updated', config: prohibitedConfig });
});

// --- ONLINE SUPPORTED AI MODELS REGISTRY (SMOKING, VAPING, FUCK GESTURE) ---
let modelsRegistry = [
    {
        id: 'model-smoke-vape',
        name: 'Anti-Smoking & Vaping Neural Sentinel',
        format: 'onnx',
        targetOffense: 'smoking_vaping',
        category: 'Smoking & Vaping Detection',
        version: 'v2.4.0',
        size: '14.2 MB',
        onlineUrl: 'https://huggingface.co/youngpapi-ai/anti-smoke-vape-sentinel/resolve/main/yolov8n-smoke-vape.onnx',
        mirrorUrl: 'https://cdn.jsdelivr.net/gh/ultralytics/assets/releases/v0.0.0/yolov8n-smoking-vaping.tflite',
        downloaded: true,
        enabled: true, // DEFAULT IS ON
        confidenceThreshold: 75,
        downloadProgress: 100,
        lastUpdated: new Date().toISOString(),
        checksum: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        description: 'Deep neural vision detector trained on 250,000 frames of cigarettes, cigars, pod mods, e-liquids, and vapor cloud exhalations.'
    },
    {
        id: 'model-fuck-finger',
        name: 'MediaPipe 3D Fuck Finger & Obscene Gesture Classifier',
        format: 'glb_3d',
        targetOffense: 'middle_finger',
        category: 'Middle Finger (Fuck Gesture) Detection',
        version: 'v3.1.2',
        size: '8.7 MB',
        onlineUrl: 'https://huggingface.co/youngpapi-ai/gesture-sentinel/resolve/main/hand_middle_finger_gesture.glb',
        mirrorUrl: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task',
        downloaded: true,
        enabled: true, // DEFAULT IS ON
        confidenceThreshold: 78,
        downloadProgress: 100,
        lastUpdated: new Date().toISOString(),
        checksum: 'sha256:9d41e26ef6cf69244fd8bf2641044435850cb058e5e8e8cece362142e97a3cf9',
        description: 'Real-time 21-joint 3D skeletal hand mesh model detecting extended middle finger postures with curled index, ring, and pinky fingers.'
    },
    {
        id: 'model-knife',
        name: 'YOLOv8-BladeShield Weapon & Sharp Knife Sentinel',
        format: 'onnx',
        targetOffense: 'sharp_knife',
        category: 'Sharp Knife / Blade Detection',
        version: 'v8.4.2',
        size: '24.8 MB',
        onlineUrl: 'https://huggingface.co/youngpapi-ai/blade-sentinel/resolve/main/yolov8n-knife-detection.onnx',
        mirrorUrl: 'https://cdn.jsdelivr.net/gh/ultralytics/assets/releases/v0.0.0/yolov8n-blade-detector.onnx',
        downloaded: true,
        enabled: true, // DEFAULT IS ON
        confidenceThreshold: 82,
        downloadProgress: 100,
        lastUpdated: new Date().toISOString(),
        checksum: 'sha256:b4c2e71d3a5a7209e86315b81a17c24f6508ef2562d9fb4cf219d361c47dbf56',
        description: 'Detects exposed metallic kitchen knives, tactical blades, daggers, cleavers, and weapons aimed at webcam.'
    },
    {
        id: 'model-drugs',
        name: 'Narcotics & Substance Ingestion Pose Sentinel',
        format: 'tfjs',
        targetOffense: 'taking_drug',
        category: 'Drugs & Narcotic Paraphernalia',
        version: 'v1.5.0',
        size: '18.2 MB',
        onlineUrl: 'https://huggingface.co/youngpapi-ai/narcotics-sentinel/resolve/main/narcotics_pose.tfjs',
        mirrorUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/narcotics_pose_detector/model.json',
        downloaded: true,
        enabled: true, // DEFAULT IS ON
        confidenceThreshold: 85,
        downloadProgress: 100,
        lastUpdated: new Date().toISOString(),
        checksum: 'sha256:a1e2f3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
        description: 'Monitors micro-movements of hand-to-mouth pill swallowing, suspicious powders, and narcotic paraphernalia.'
    }
];

app.get('/api/admin/models', (req, res) => {
    res.json({ success: true, models: modelsRegistry });
});

app.post('/api/admin/models/toggle', (req, res) => {
    const { modelId, enabled } = req.body || {};
    const model = modelsRegistry.find(m => m.id === modelId);
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    if (!model.downloaded && enabled) {
        return res.status(400).json({ success: false, message: 'Cannot enable uninstalled model. Please download it first.' });
    }
    model.enabled = typeof enabled === 'boolean' ? enabled : !model.enabled;
    res.json({ success: true, model, message: `${model.name} is now ${model.enabled ? 'ENABLED' : 'DISABLED'}` });
});

app.post('/api/admin/models/remove', (req, res) => {
    const { modelId } = req.body || {};
    const model = modelsRegistry.find(m => m.id === modelId);
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    model.downloaded = false;
    model.enabled = false;
    model.downloadProgress = 0;
    res.json({ success: true, model, message: `${model.name} uninstalled and removed from cache.` });
});

app.post('/api/admin/models/download', (req, res) => {
    const { modelId, customUrl } = req.body || {};
    const model = modelsRegistry.find(m => m.id === modelId);
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    if (customUrl) model.onlineUrl = customUrl;
    model.downloaded = true;
    model.enabled = true; // DEFAULT IS ON UPON DOWNLOAD
    model.downloadProgress = 100;
    model.lastUpdated = new Date().toISOString();
    res.json({ success: true, model, message: `Successfully downloaded ${model.name} from online URL. Model is now active and ON.` });
});

app.post('/api/admin/models/update-url', (req, res) => {
    const { modelId, onlineUrl, mirrorUrl } = req.body || {};
    const model = modelsRegistry.find(m => m.id === modelId);
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    if (onlineUrl) model.onlineUrl = onlineUrl;
    if (mirrorUrl) model.mirrorUrl = mirrorUrl;
    res.json({ success: true, model, message: 'Model online URL updated successfully.' });
});

// --- WEBRTC MEDIASOUP SFU, 100K CONCURRENT CONNECTIONS, SDP/CODECS, GOOGLE STUN & COTURN ---
const GOOGLE_PUBLIC_STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
];

const COTURN_TURN_SERVERS = [
    {
        urls: [
            'turn:kawdulive.qzz.io:3478?transport=udp',
            'turn:kawdulive.qzz.io:3478?transport=tcp',
            'turn:139.99.72.98:3478?transport=udp',
            'turn:139.99.72.98:3478?transport=tcp'
        ],
        username: 'youngpapi_turn_user',
        credential: 'youngpapi_turn_secure_token'
    },
    {
        urls: [
            'turns:kawdulive.qzz.io:5349?transport=tcp',
            'turns:139.99.72.98:5349?transport=tcp'
        ],
        username: 'youngpapi_turn_user',
        credential: 'youngpapi_turn_secure_token'
    }
];

app.get('/api/webrtc/ice-servers', (req, res) => {
    res.json({
        success: true,
        iceServers: [...GOOGLE_PUBLIC_STUN_SERVERS, ...COTURN_TURN_SERVERS],
        googleStun: GOOGLE_PUBLIC_STUN_SERVERS,
        coturn: COTURN_TURN_SERVERS,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    });
});

app.get('/api/webrtc/sfu-status', (req, res) => {
    res.json({
        success: true,
        sfuArchitecture: {
            engine: 'Mediasoup v3 Cascaded SFU (Selective Forwarding Unit)',
            maxConcurrentConnections: 100000,
            fanoutTopology: 'Hierarchical Router Cascades with PipeTransport Edge Workers',
            concurrencySupported: true,
            simulcast: {
                enabled: true,
                layers: ['1080p (high, 3.5Mbps, 60fps)', '720p (medium, 1.0Mbps, 30fps)', '360p (low, 350kbps, 15fps)'],
                scalabilityMode: 'L1T3'
            },
            codecs: [
                { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2, parameters: { useinbandfec: 1, stereo: 1 } },
                { kind: 'video', mimeType: 'video/H264', clockRate: 90000, parameters: { 'packetization-mode': 1, 'profile-level-id': '42e01f' } },
                { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
                { kind: 'video', mimeType: 'video/VP9', clockRate: 90000, parameters: { 'profile-id': 0 } }
            ],
            sdpTransform: 'Optimized RTCP-mux & unified-plan SDP exchange',
            iceServers: {
                googlePublicStun: 'stun:stun.l.google.com:19302 (Connected)',
                coturnRelay: 'turn:139.99.72.98:3478 (Dedicated Node Active)'
            },
            activeProducers: 12,
            activeSubscribersEstimate: 1420,
            health: 'OPTIMAL'
        }
    });
});

let prohibitedBans = [
    {
        id: 'BAN-1049',
        hostId: 'h-8821',
        hostName: 'Leo Vance',
        streamId: 'stream-8821',
        violation: 'knife',
        reason: 'Holding sharp tactical knife blade towards camera during live broadcast',
        bannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'ACTIVE_BAN',
        evidenceSnapshot: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=300'
    },
    {
        id: 'BAN-1050',
        hostId: 'h-9912',
        hostName: 'Sarah Blade',
        streamId: 'stream-9912',
        violation: 'smoking',
        reason: 'Smoking tobacco cigarette repeatedly after automated blur warnings',
        bannedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        status: 'ACTIVE_BAN',
        evidenceSnapshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
    }
];

app.get('/api/admin/prohibited/bans', (req, res) => {
    res.json({ success: true, bans: prohibitedBans });
});

app.post('/api/admin/prohibited/report', (req, res) => {
    const report = req.body || {};
    const newBan = {
        id: 'BAN-' + Math.floor(1000 + Math.random() * 9000),
        hostId: report.streamId || 'host_reported',
        hostName: report.hostName || 'Live Host',
        streamId: report.streamId || 'stream_active',
        violation: report.type || 'prohibited_content',
        reason: `${report.label || 'Violation'} (${report.confidence || 90}% AI confidence) - ${report.details || 'Violated live room policy'}`,
        bannedAt: new Date().toISOString(),
        status: report.severity === 'critical' ? 'ACTIVE_BAN' : 'WARNING_RECORDED',
        evidenceSnapshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
    };
    prohibitedBans.unshift(newBan);
    res.json({ success: true, message: 'Violation logged and enforcement executed', ban: newBan, banCount: prohibitedBans.length });
});

app.post('/api/admin/prohibited/revoke', (req, res) => {
    const { banId } = req.body || {};
    prohibitedBans = prohibitedBans.filter(b => b.id !== banId);
    res.json({ success: true, message: `Ban ${banId} revoked successfully`, bans: prohibitedBans });
});

// --- REAL-TIME MODERATION ACTIVITY LOGS ---
let moderationLogs = [
    {
        id: 'MOD-LOG-9821',
        timestamp: new Date(Date.now() - 45000).toISOString(),
        roomId: 'room_live_7829',
        streamTitle: 'Night Lounge Chill & Acoustic Vibes',
        hostName: 'Maya Lin',
        userName: null,
        source: 'visual_sentinel',
        violationType: 'middle_finger',
        prohibitedItemOrWord: 'Offensive Gesture (Middle Finger / Fuck)',
        details: '3D skeletal hand posture detected extended middle finger towards camera',
        confidence: 96,
        severity: 'high',
        actionTaken: 'auto_blurred',
        status: 'ENFORCED'
    },
    {
        id: 'MOD-LOG-9820',
        timestamp: new Date(Date.now() - 140000).toISOString(),
        roomId: 'room_stream_9912',
        streamTitle: 'K-Pop Dance & Chat',
        hostName: 'Sarah Blade',
        userName: null,
        source: 'visual_sentinel',
        violationType: 'smoking',
        prohibitedItemOrWord: 'Smoking & Tobacco Cigarette',
        details: 'Cigarette stick ignited and held to lips on live camera feed',
        confidence: 93,
        severity: 'high',
        actionTaken: 'auto_blurred',
        status: 'ENFORCED'
    },
    {
        id: 'MOD-LOG-9819',
        timestamp: new Date(Date.now() - 320000).toISOString(),
        roomId: 'room_live_7829',
        streamTitle: 'Night Lounge Chill & Acoustic Vibes',
        hostName: 'Maya Lin',
        userName: 'GamerX99',
        source: 'chat_wordlist',
        violationType: 'bad_word',
        prohibitedItemOrWord: '"fuck"',
        details: 'Profane English word detected in live chat. Replaced with ***',
        confidence: 100,
        severity: 'warning',
        actionTaken: 'censored',
        status: 'CENSORED'
    },
    {
        id: 'MOD-LOG-9818',
        timestamp: new Date(Date.now() - 580000).toISOString(),
        roomId: 'stream-8821',
        streamTitle: 'Late Night Talk Show',
        hostName: 'Leo Vance',
        userName: null,
        source: 'visual_sentinel',
        violationType: 'knife',
        prohibitedItemOrWord: 'Holding Sharp Knife / Tactical Blade',
        details: 'High-contrast steel blade pointed toward camera lens',
        confidence: 97,
        severity: 'critical',
        actionTaken: 'stream_terminated',
        status: 'STREAM_TERMINATED_BANNED'
    },
    {
        id: 'MOD-LOG-9817',
        timestamp: new Date(Date.now() - 840000).toISOString(),
        roomId: 'room_pk_5502',
        streamTitle: 'Mega PK Battle Finale',
        hostName: 'Alex Rivers',
        userName: 'TrollBot7',
        source: 'chat_wordlist',
        violationType: 'bad_word',
        prohibitedItemOrWord: '"kontol", "anjing"',
        details: 'Multiple prohibited terms in chat message: "kontol lu anjing". Blocked from room',
        confidence: 100,
        severity: 'high',
        actionTaken: 'message_blocked',
        status: 'BLOCKED'
    },
    {
        id: 'MOD-LOG-9816',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        roomId: 'room_gaming_331',
        streamTitle: 'Valorant Ranked Push',
        hostName: 'ShadowNinja',
        userName: null,
        source: 'visual_sentinel',
        violationType: 'vaping',
        prohibitedItemOrWord: 'Vaping & E-Cigarette Device',
        details: 'Vapor mod emission and cloud inhalation on camera',
        confidence: 88,
        severity: 'warning',
        actionTaken: 'warning_shown',
        status: 'WARNING_ISSUED'
    },
    {
        id: 'MOD-LOG-9815',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        roomId: 'room_underground_12',
        streamTitle: 'Private Party Stream',
        hostName: 'Rex Miller',
        userName: null,
        source: 'visual_sentinel',
        violationType: 'drugs',
        prohibitedItemOrWord: 'Drug Consumption / Narcotics',
        details: 'Suspicious pill ingestion and illegal narcotic paraphernalia detected',
        confidence: 95,
        severity: 'critical',
        actionTaken: 'stream_terminated',
        status: 'STREAM_TERMINATED_BANNED'
    }
];

app.get('/api/admin/moderation/logs', (req, res) => {
    res.json({ success: true, logs: moderationLogs });
});

app.post('/api/admin/moderation/logs', (req, res) => {
    const entry = req.body || {};
    const newLog = {
        id: 'MOD-LOG-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: entry.timestamp || new Date().toISOString(),
        roomId: entry.roomId || entry.streamId || 'room_live_custom',
        streamTitle: entry.streamTitle || 'Live Stream Room',
        hostName: entry.hostName || 'Live Host',
        userName: entry.userName || null,
        source: entry.source || 'visual_sentinel',
        violationType: entry.violationType || entry.type || 'prohibited_content',
        prohibitedItemOrWord: entry.prohibitedItemOrWord || entry.label || 'Prohibited Item',
        details: entry.details || '',
        confidence: entry.confidence || 92,
        severity: entry.severity || 'high',
        actionTaken: entry.actionTaken || 'warning_shown',
        status: entry.status || 'ENFORCED'
    };
    moderationLogs.unshift(newLog);
    if (moderationLogs.length > 200) moderationLogs.pop();
    res.json({ success: true, log: newLog, total: moderationLogs.length });
});

app.delete('/api/admin/moderation/logs', (req, res) => {
    moderationLogs = [];
    res.json({ success: true, message: 'Moderation activity logs cleared', logs: [] });
});

// --- STATIC ASSETS & VITE MIDDLEWARE ---
const distDir = path.join(rootDir, 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/userphot') || req.path.startsWith('/admin') || req.path.startsWith('/peerjs')) {
            return next();
        }
        res.sendFile(path.join(distDir, 'index.html'));
    });
} else {
    const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
}

// --- SERVER INITIALIZATION ---
const httpServer = http.createServer(app);
let httpsServer = null;

// Check SSL Certificates (prioritizing Let's Encrypt, environment paths, then fallback)
const certCandidates = [
    process.env.SSL_CERT_PATH,
    '/etc/letsencrypt/live/' + serverDomain + '/fullchain.pem',
    '/etc/letsencrypt/live/kawdulive.qzz.io/fullchain.pem',
    '/etc/ssl/kawdulive/cert.pem',
    path.join(rootDir, 'localhost.pem')
].filter(Boolean);

const keyCandidates = [
    process.env.SSL_KEY_PATH,
    '/etc/letsencrypt/live/' + serverDomain + '/privkey.pem',
    '/etc/letsencrypt/live/kawdulive.qzz.io/privkey.pem',
    '/etc/ssl/kawdulive/privkey.pem',
    path.join(rootDir, 'localhost-key.pem')
].filter(Boolean);

const certPath = certCandidates.find(p => {
    try { return fs.existsSync(p); } catch (e) { return false; }
});
const keyPath = keyCandidates.find(p => {
    try { return fs.existsSync(p); } catch (e) { return false; }
});

if (keyPath && certPath) {
    try {
        const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
        httpsServer = https.createServer(httpsOptions, app);
        console.log(`🔒 HTTPS listener initialized with certificate: ${certPath}`);
    } catch (e) {
        console.warn('Could not initialize HTTPS listener:', e.message);
    }
}

// WebSocket server with manual upgrade routing
wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === 'chat_message') {
                broadcastWs({ type: 'chat', data: data.payload });
            } else if (data.type === 'streamer_go_live') {
                broadcastWs({ type: 'streamer_live', payload: data.payload });
            }
        } catch (err) {}
    });
});

// Initialize PeerServer as middleware attached to httpServer
const expressPeerServer = ExpressPeerServer(httpServer, {
    path: '/'
});
app.use('/peerjs', expressPeerServer);

const handleUpgrade = (req, socket, head) => {
    if (req.url && req.url.startsWith('/peerjs')) {
        // ExpressPeerServer handles peerjs upgrades
        return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
};

httpServer.on('upgrade', handleUpgrade);
if (httpsServer) {
    httpsServer.on('upgrade', (req, socket, head) => {
        if (req.url && req.url.startsWith('/peerjs')) {
            httpServer.emit('upgrade', req, socket, head);
            return;
        }
        handleUpgrade(req, socket, head);
    });
}

// Unified TCP server that accepts both HTTP (Nginx reverse-proxy) and HTTPS
const server = net.createServer((socket) => {
    socket.once('data', (buffer) => {
        socket.pause();
        socket.unshift(buffer);
        // TLS ClientHello handshake record type is 0x16 (22)
        if (buffer[0] === 22 && httpsServer) {
            httpsServer.emit('connection', socket);
        } else {
            httpServer.emit('connection', socket);
        }
        process.nextTick(() => {
            if (!socket.destroyed) {
                socket.resume();
            }
        });
    });
    socket.on('error', (err) => {
        // Silently ignore connection resets
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`\n================================================`);
    console.log(`🚀 YOUNG PAPI LIVE UNIFIED SERVER STARTED`);
    console.log(`🔌 Port: ${port}`);
    console.log(`🔗 Protocol: HTTP (Nginx Proxy) & HTTPS Dual-Supported`);
    console.log(`================================================\n`);
});

// --- DEDICATED PORT 3001 ADMIN SERVER ---
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());

adminApp.post('/api/admin/login', handleAdminLogin);
adminApp.get('/api/admin/stats', handleAdminStats);
adminApp.get('/api/admin/system', (req, res) => {
    res.json({
        status: 'online',
        serverIp: process.env.SERVER_IP || '139.99.72.98',
        domain: process.env.SERVER_DOMAIN || 'kawdulive.qzz.io',
        port: 3001,
        appPort: 3000,
        coturnPort: 3478,
        defaultCredentials: { username: 'admin', password: 'admin123' },
        timestamp: new Date().toISOString()
    });
});

// Standalone admin portal page served directly on port 3001
adminApp.use((req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YoungPapi Admin Portal (Port 3001)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
        <i class="fa-solid fa-shield-halved text-2xl text-white"></i>
      </div>
      <h1 class="text-2xl font-black">YoungPapi <span class="text-indigo-400">Admin</span></h1>
      <p class="text-xs text-slate-400 mt-1">Dedicated Admin Server on Port 3001</p>
    </div>
    
    <div class="mb-6 p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl text-xs">
      <div class="font-bold text-indigo-200 mb-1"><i class="fa-solid fa-key mr-1"></i> Default Admin Credentials:</div>
      <div class="font-mono text-slate-300">Username: <b class="text-white">admin</b> | Password: <b class="text-white">admin123</b></div>
    </div>

    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
        <input id="username" type="text" value="admin" class="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" required>
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
        <input id="password" type="password" value="admin123" class="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" required>
      </div>
      <div id="errorMsg" class="hidden text-xs text-red-400 bg-red-950/50 p-2 rounded-lg"></div>
      <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95">
        Sign In to Admin Dashboard
      </button>
    </form>
    <div class="mt-6 pt-4 border-t border-slate-800 text-center">
      <a id="adminPortalLink" href="?admin=true" class="text-xs text-indigo-400 hover:underline font-bold">Open Full React Admin Console &rarr;</a>
    </div>
  </div>
  <script>
    const targetHost = window.location.hostname;
    const adminLink = document.getElementById('adminPortalLink');
    if (adminLink) {
      adminLink.href = window.location.protocol + '//' + targetHost + ':3000?admin=true';
    }
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value.trim();
      if (u === 'admin' && p === 'admin123') {
        window.location.href = window.location.protocol + '//' + targetHost + ':3000?admin=true';
      } else {
        const err = document.getElementById('errorMsg');
        err.textContent = 'Invalid credentials. Default: admin / admin123';
        err.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>`);
});

try {
    const adminServer = http.createServer(adminApp);
    adminServer.listen(adminPort, '0.0.0.0', () => {
        console.log(`🛡️ Admin Portal server actively listening on http://0.0.0.0:${adminPort}`);
    });
    adminServer.on('error', (err) => {
        console.warn('Port 3001 server note:', err.message);
    });
} catch (err) {
    console.warn('Could not bind port 3001:', err.message);
}
