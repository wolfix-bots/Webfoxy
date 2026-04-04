/**
 * Foxy Bot — Telegram Linker
 * Lets any user pair their WhatsApp number to Foxy Bot via Telegram.
 *
 * Flow:
 *   /start  →  welcome + ask for phone number
 *   user sends phone number
 *   → bot starts a temporary Baileys session for that number
 *   → requests pairing code from WhatsApp
 *   → sends the 8-digit code back to the user on Telegram
 *   → once WhatsApp confirms connection the session is saved in sessions/<number>/
 *
 * Run standalone:  node telegram_linker.js
 * Or import and call startTelegramLinker() from index.js
 */

import TelegramBot from 'node-telegram-bot-api';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN      = process.env.TELEGRAM_BOT_TOKEN;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
}

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ── Track in-progress link sessions per Telegram chat ──
const pending = new Map(); // chatId → { phone, sock, timeout }

const bot = new TelegramBot(TOKEN, { polling: true });

// ── Helpers ──────────────────────────────────────────────
function sessionDir(phone) {
    return path.join(SESSIONS_DIR, phone);
}

function silentLogger() {
    return pino({ level: 'silent' });
}

function cleanupPending(chatId) {
    const s = pending.get(chatId);
    if (s) {
        try { s.sock?.end?.(); } catch {}
        clearTimeout(s.timeout);
        pending.delete(chatId);
    }
}

// ── /start ───────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    cleanupPending(chatId);
    bot.sendMessage(chatId,
`🦊 *Welcome to Foxy Bot Linker!*

This bot will connect *Foxy Bot* to your WhatsApp account using a pairing code — no QR scan needed.

📲 *Send me your WhatsApp number* in international format:

Examples:
• \`254712345678\`  (Kenya)
• \`27831234567\`   (South Africa)
• \`2348012345678\` (Nigeria)

_Include country code, no + or spaces._`,
        { parse_mode: 'Markdown' }
    );
});

// ── /cancel ──────────────────────────────────────────────
bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    cleanupPending(chatId);
    bot.sendMessage(chatId, '❌ Linking cancelled. Send /start to try again.');
});

// ── /status ──────────────────────────────────────────────
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const sessions = fs.readdirSync(SESSIONS_DIR).filter(d =>
        fs.existsSync(path.join(SESSIONS_DIR, d, 'creds.json'))
    );
    if (sessions.length === 0) {
        return bot.sendMessage(chatId, '📊 No linked accounts yet.');
    }
    bot.sendMessage(chatId,
`📊 *Linked Accounts (${sessions.length}):*\n\n` +
sessions.map((s, i) => `${i + 1}. +${s}`).join('\n'),
        { parse_mode: 'Markdown' }
    );
});

// ── Main message handler — phone number ─────────────────
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text   = (msg.text || '').trim();

    // Ignore commands
    if (text.startsWith('/')) return;

    // Clean to digits only
    const phone = text.replace(/[^0-9]/g, '');

    if (!phone || phone.length < 7 || phone.length > 15) {
        return bot.sendMessage(chatId,
            '⚠️ That doesn\'t look like a valid phone number.\n\nSend your number with country code, digits only.\nExample: `254712345678`',
            { parse_mode: 'Markdown' }
        );
    }

    // Already pending?
    if (pending.has(chatId)) {
        return bot.sendMessage(chatId,
            '⏳ Already generating a code for you. Please wait…\n\nSend /cancel to start over.'
        );
    }

    await bot.sendMessage(chatId,
        `⏳ Requesting pairing code for *+${phone}*…\n\nThis takes about 10 seconds.`,
        { parse_mode: 'Markdown' }
    );

    try {
        await linkPhone(chatId, phone);
    } catch (err) {
        cleanupPending(chatId);
        bot.sendMessage(chatId,
            `❌ Failed to get pairing code: ${err.message}\n\nSend /start to try again.`
        );
    }
});

// ── Core: start Baileys session and get pairing code ─────
async function linkPhone(chatId, phone) {
    const dir = sessionDir(phone);
    fs.mkdirSync(dir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version }          = await fetchLatestBaileysVersion();

    const sock = makeWASocket.default({
        version,
        auth: state,
        logger: silentLogger(),
        printQRInTerminal: false,
        browser: ['Foxy Bot', 'Chrome', '120.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
    });

    // Timeout — give up after 3 minutes
    const timeout = setTimeout(() => {
        cleanupPending(chatId);
        try { sock.end(); } catch {}
        bot.sendMessage(chatId,
            '⏰ Timed out waiting for WhatsApp. Send /start to try again.'
        );
    }, 3 * 60 * 1000);

    pending.set(chatId, { phone, sock, timeout, codeRequested: false });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        const entry = pending.get(chatId);
        if (!entry) return;

        // Request pairing code once we're in the 'connecting' state
        if (connection === 'connecting' && !entry.codeRequested && !state.creds.registered) {
            entry.codeRequested = true;

            // Small delay — WhatsApp needs the socket to be ready
            setTimeout(async () => {
                try {
                    const raw  = await sock.requestPairingCode(phone);
                    const code = raw.replace(/\s+/g, '');
                    const fmt  = code.length === 8
                        ? `${code.slice(0, 4)}-${code.slice(4)}`
                        : code;

                    await bot.sendMessage(chatId,
`✅ *Your Foxy Bot Pairing Code*

🔑 Code: \`${fmt}\`
📞 Number: +${phone}
⏰ Expires: 10 minutes

📱 *How to link:*
1. Open WhatsApp on your phone
2. Go to ⚙️ Settings → Linked Devices
3. Tap *Link a Device*
4. Select *Link with phone number instead*
5. Enter the code above: \`${fmt}\`

After linking, Foxy Bot will be active on your number! 🦊`,
                        { parse_mode: 'Markdown' }
                    );
                } catch (err) {
                    cleanupPending(chatId);
                    bot.sendMessage(chatId,
                        `❌ Could not get pairing code: ${err.message}\n\nSend /start to try again.`
                    );
                }
            }, 3000);
        }

        if (connection === 'open') {
            clearTimeout(entry.timeout);
            pending.delete(chatId);

            await bot.sendMessage(chatId,
`🎉 *Successfully Linked!*

✅ Foxy Bot is now connected to *+${phone}*
🤖 Your bot is active and ready

Foxy Bot will now respond to messages on your WhatsApp.
Use /status to see all linked accounts.`,
                { parse_mode: 'Markdown' }
            );

            // Gracefully close — session is saved, main bot will use it
            setTimeout(() => { try { sock.end(); } catch {} }, 2000);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const entry  = pending.get(chatId);

            if (reason === DisconnectReason.loggedOut) {
                cleanupPending(chatId);
                bot.sendMessage(chatId,
                    '❌ WhatsApp rejected the connection (logged out).\n\nSend /start to try again.'
                );
            } else if (entry && !entry.codeRequested) {
                // Unexpected close before code was even requested
                cleanupPending(chatId);
                bot.sendMessage(chatId,
                    '⚠️ Connection closed unexpectedly. Send /start to try again.'
                );
            }
        }
    });
}

// ── Error handling ────────────────────────────────────────
bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
});

process.on('SIGINT',  () => { bot.stopPolling(); process.exit(0); });
process.on('SIGTERM', () => { bot.stopPolling(); process.exit(0); });

console.log('🦊 Foxy Bot Telegram Linker is running…');
console.log('   Users can find the bot on Telegram and send their number to get a pairing code.');

export function startTelegramLinker() {
    // Already started if this module is imported
    console.log('✅ Telegram Linker active');
}
