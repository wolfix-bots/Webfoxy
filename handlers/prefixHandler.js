import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to prefixes file
const PREFIXES_FILE = path.join(__dirname, '../data/prefixes.json');

// Load prefixes from file
let prefixes = {};

const loadPrefixes = () => {
  try {
    if (fs.existsSync(PREFIXES_FILE)) {
      const data = fs.readFileSync(PREFIXES_FILE, 'utf8');
      prefixes = JSON.parse(data);
      console.log(`✅ Loaded prefixes for ${Object.keys(prefixes).length} chats`);
    } else {
      // Create directory if doesn't exist
      const dir = path.dirname(PREFIXES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Save empty prefixes
      savePrefixes();
      console.log('📁 Created new prefixes file');
    }
  } catch (error) {
    console.error('❌ Error loading prefixes:', error);
    prefixes = {};
  }
};

// Save prefixes to file
const savePrefixes = () => {
  try {
    fs.writeFileSync(PREFIXES_FILE, JSON.stringify(prefixes, null, 2));
  } catch (error) {
    console.error('❌ Error saving prefixes:', error);
  }
};

// Initialize
loadPrefixes();

// Get prefix for a specific chat
const getPrefix = (chatId) => {
  return prefixes[chatId] || '.'; // Default prefix is '.'
};

// Set prefix for a specific chat
const setPrefix = (chatId, newPrefix) => {
  if (!newPrefix || newPrefix.length !== 1) {
    return { success: false, message: 'Prefix must be a single character' };
  }
  
  // Validate it's not a command character
  if (/[a-zA-Z0-9\s]/.test(newPrefix)) {
    return { 
      success: false, 
      message: 'Prefix cannot be letters, numbers, or spaces. Use symbols like ! . / $ # * ~ &' 
    };
  }
  
  const oldPrefix = prefixes[chatId] || '.';
  prefixes[chatId] = newPrefix;
  savePrefixes();
  
  return { 
    success: true, 
    oldPrefix, 
    newPrefix,
    message: `Prefix changed from "${oldPrefix}" to "${newPrefix}"`
  };
};

// Reset prefix to default
const resetPrefix = (chatId) => {
  const oldPrefix = prefixes[chatId] || '.';
  delete prefixes[chatId];
  savePrefixes();
  
  return {
    success: true,
    oldPrefix,
    newPrefix: '.',
    message: 'Prefix reset to default "."'
  };
};

// Get all prefixes (for admin)
const getAllPrefixes = () => {
  return { ...prefixes };
};

// Get prefix count
const getPrefixCount = () => {
  return Object.keys(prefixes).length;
};

export default {
  getPrefix,
  setPrefix,
  resetPrefix,
  getAllPrefixes,
  getPrefixCount,
  loadPrefixes,
  savePrefixes
};