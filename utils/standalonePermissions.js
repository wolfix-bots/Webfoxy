// utils/standalonePermissions.js
import fs from 'fs';
import path from 'path';

// Create data directory if it doesn't exist
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const OWNERS_FILE = path.join(DATA_DIR, 'owners.json');
const MODE_FILE = path.join(DATA_DIR, 'mode.json');

// Load data from files
function loadOwners() {
    try {
        if (fs.existsSync(OWNERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(OWNERS_FILE, 'utf8'));
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.error('Error loading owners:', error);
    }
    return [];
}

function loadMode() {
    try {
        if (fs.existsSync(MODE_FILE)) {
            const data = JSON.parse(fs.readFileSync(MODE_FILE, 'utf8'));
            return data.mode || 'public';
        }
    } catch (error) {
        console.error('Error loading mode:', error);
    }
    return 'public';
}

// Save data
function saveOwners(owners) {
    fs.writeFileSync(OWNERS_FILE, JSON.stringify(owners, null, 2));
}

function saveMode(mode) {
    fs.writeFileSync(MODE_FILE, JSON.stringify({ mode, updated: new Date().toISOString() }, null, 2));
}

// Get user identifier from message
function getUserId(msg) {
    // Use participant for groups, remoteJid for private
    const jid = msg.key.participant || msg.key.remoteJid;
    // Extract just the number part
    return jid.split('@')[0];
}

// Check if user is owner
function isOwner(msg) {
    const userId = getUserId(msg);
    const owners = loadOwners();
    return owners.includes(userId);
}

// Get current bot mode
function getBotMode() {
    return loadMode();
}

// Add owner
function addOwner(userId) {
    const owners = loadOwners();
    if (!owners.includes(userId)) {
        owners.push(userId);
        saveOwners(owners);
        return true;
    }
    return false;
}

// Remove owner
function removeOwner(userId) {
    const owners = loadOwners();
    const index = owners.indexOf(userId);
    if (index > -1) {
        owners.splice(index, 1);
        saveOwners(owners);
        return true;
    }
    return false;
}

// Check if command can be used
function canUseCommand(msg, commandCategory = 'general') {
    const mode = getBotMode();
    const userIsOwner = isOwner(msg);
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    
    // Owners can always use commands
    if (userIsOwner) return { allowed: true, reason: 'Owner access' };
    
    // Check based on mode
    switch(mode) {
        case 'public':
            return { allowed: true, reason: 'Public mode' };
            
        case 'private':
            // In private mode, only allow if it's a private chat
            if (isGroup) {
                return { allowed: false, reason: 'Private mode: Bot only works in private chats' };
            }
            return { allowed: true, reason: 'Private chat in private mode' };
            
        case 'grouponly':
            // In grouponly mode, only allow if it's a group
            if (!isGroup) {
                return { allowed: false, reason: 'Group-only mode: Bot only works in groups' };
            }
            return { allowed: true, reason: 'Group chat in group-only mode' };
            
        case 'maintenance':
            return { allowed: false, reason: 'Maintenance mode: Only owners can use commands' };
            
        case 'whitelist':
            // Add whitelist logic here if needed
            return { allowed: false, reason: 'Whitelist mode: You are not whitelisted' };
            
        default:
            return { allowed: true, reason: 'Default access' };
    }
}

// Export everything
export {
    loadOwners,
    loadMode,
    saveOwners,
    saveMode,
    getUserId,
    isOwner,
    getBotMode,
    addOwner,
    removeOwner,
    canUseCommand
};