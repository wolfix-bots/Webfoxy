// utils/foxMaster.js - COMPLETE CONTROL SYSTEM
import fs from 'fs';
import path from 'path';

const FOX_DEN = './fox_den';
if (!fs.existsSync(FOX_DEN)) fs.mkdirSync(FOX_DEN, { recursive: true });

const FOX_OWNERS = path.join(FOX_DEN, 'fox_owners.json');
const FOX_MODE = path.join(FOX_DEN, 'fox_mode.json');
const FOX_SETUP = path.join(FOX_DEN, 'fox_setup.json');

// 🦊 Helper Functions
function foxLoadData(file, defaultValue) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (e) {}
    return defaultValue;
}

function foxSaveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 🦊 Mode & Owner Management
export const foxMode = {
    load: () => {
        const data = foxLoadData(FOX_MODE, { mode: 'public' });
        return data.mode;
    },
    
    save: (mode) => {
        foxSaveData(FOX_MODE, { 
            mode, 
            updated: new Date().toISOString() 
        });
    },
    
    check: (msg) => {
        const mode = foxMode.load();
        const userId = getFoxId(msg);
        const owners = foxOwners.load();
        const isOwner = owners.includes(userId);
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        
        // Private mode = ONLY setup owner
        if (mode === 'private') {
            if (owners.length === 0) return true;
            return isOwner;
        }
        
        switch(mode) {
            case 'public': return true;
            case 'grouponly': return isGroup;
            case 'maintenance': return isOwner;
            case 'whitelist': return isOwner;
            default: return true;
        }
    },
    
    getMessage: () => {
        const mode = foxMode.load();
        const messages = {
            'private': '🔒 *Private Mode* - Only owner can use commands',
            'maintenance': '🔧 *Maintenance Mode* - Owners only',
            'grouponly': '👥 *Group Only Mode* - Use in groups only',
            'whitelist': '📋 *Whitelist Mode* - You are not whitelisted'
        };
        return messages[mode] || null;
    }
};

export const foxOwners = {
    load: () => foxLoadData(FOX_OWNERS, []),
    save: (owners) => foxSaveData(FOX_OWNERS, owners),
    isOwner: (msg) => {
        const userId = getFoxId(msg);
        const owners = foxOwners.load();
        return owners.includes(userId);
    },
    add: (userId) => {
        const owners = foxOwners.load();
        if (!owners.includes(userId)) {
            owners.push(userId);
            foxOwners.save(owners);
            return true;
        }
        return false;
    }
};

export const foxSetup = {
    check: () => {
        const data = foxLoadData(FOX_SETUP, { completed: false });
        return data.completed;
    },
    complete: () => {
        foxSaveData(FOX_SETUP, { 
            completed: true, 
            date: new Date().toISOString() 
        });
    }
};

// 🦊 Get User ID
export function getFoxId(msg) {
    const jid = msg.key.participant || msg.key.remoteJid;
    return jid.split('@')[0];
}

// 🦊 Get User Name
export function getFoxName(msg) {
    return msg.pushName || 'Fox Friend';
}

// 🦊 Check if command can be used
export function foxCanUse(msg, command) {
    // Always allow menu/help commands
    if (['menu', 'help'].includes(command)) return true;
    
    // Check mode
    return foxMode.check(msg);
}