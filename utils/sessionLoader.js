// utils/sessionLoader.js
// Loads a FOXY_ session string into the ./session/ directory
// Called at startup if SESSION_ID env var is set
import zlib from 'zlib';
import fs   from 'fs';
import path from 'path';

export function loadFoxySession(sessionString, sessionDir = './session') {
    if (!sessionString) return false;
    // Support both FOXY_ and raw base64
    const raw = sessionString.startsWith('FOXY_') ? sessionString.slice(5) : sessionString;
    try {
        const compressed = Buffer.from(raw, 'base64');
        let json;
        try {
            // Try gzip first
            json = zlib.gunzipSync(compressed).toString('utf8');
        } catch {
            // Fallback: plain base64 JSON
            json = compressed.toString('utf8');
        }
        const files = JSON.parse(json);
        fs.mkdirSync(sessionDir, { recursive: true });
        for (const [name, content] of Object.entries(files)) {
            const filePath = path.join(sessionDir, name);
            fs.writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content));
        }
        console.log(`✅ FOXY session loaded — ${Object.keys(files).length} files written to ${sessionDir}`);
        return true;
    } catch (err) {
        console.error('❌ Failed to load FOXY session:', err.message);
        return false;
    }
}

// Auto-run if SESSION_ID is set in env
const SESSION_ID = process.env.SESSION_ID || process.env.FOXY_SESSION || process.env.SESSION;
if (SESSION_ID && (SESSION_ID.startsWith('FOXY_') || SESSION_ID.length > 200)) {
    loadFoxySession(SESSION_ID, './session');
}

export default loadFoxySession;
