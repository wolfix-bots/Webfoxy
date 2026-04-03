// utils/foxEconomy.js - COMPLETE ECONOMY
import fs from 'fs';
import path from 'path';
import { getFoxId, getFoxName } from './foxMaster.js';

const FOX_DEN = './fox_den';
const FOX_ECONOMY = path.join(FOX_DEN, 'fox_economy.json');
const FOX_SHOP = path.join(FOX_DEN, 'fox_shop.json');

class FoxEconomy {
    constructor() {
        this.loadData();
        this.initShop();
    }
    
    loadData() {
        try {
            if (fs.existsSync(FOX_ECONOMY)) {
                this.data = JSON.parse(fs.readFileSync(FOX_ECONOMY, 'utf8'));
            } else {
                this.data = {
                    users: {},
                    leaderboard: [],
                    transactions: [],
                    lastReset: new Date().toISOString()
                };
                this.saveData();
            }
        } catch (error) {
            this.data = {
                users: {},
                leaderboard: [],
                transactions: [],
                lastReset: new Date().toISOString()
            };
        }
    }
    
    initShop() {
        const defaultShop = {
            items: [
                { id: 'fox_hat', name: '🦊 Fox Hat', price: 500, emoji: '🎩' },
                { id: 'golden_carrot', name: '🥕 Golden Carrot', price: 1000, emoji: '🥕' },
                { id: 'lucky_charm', name: '🍀 Lucky Charm', price: 2000, emoji: '🍀' },
                { id: 'fox_whistle', name: '📯 Fox Whistle', price: 5000, emoji: '📯' },
                { id: 'diamond_crown', name: '👑 Diamond Crown', price: 10000, emoji: '👑' },
                { id: 'mystic_potion', name: '🧪 Mystic Potion', price: 3000, emoji: '🧪' },
                { id: 'fox_tail', name: '🦊 Fox Tail', price: 1500, emoji: '🦊' },
                { id: 'golden_nugget', name: '💰 Golden Nugget', price: 8000, emoji: '💰' }
            ]
        };
        
        if (!fs.existsSync(FOX_SHOP)) {
            fs.writeFileSync(FOX_SHOP, JSON.stringify(defaultShop, null, 2));
        }
        this.shop = JSON.parse(fs.readFileSync(FOX_SHOP, 'utf8'));
    }
    
    saveData() { fs.writeFileSync(FOX_ECONOMY, JSON.stringify(this.data, null, 2)); }
    
    // 🦊 User Management
    ensureUser(msg) {
        const userId = getFoxId(msg);
        const userName = getFoxName(msg);
        
        if (!this.data.users[userId]) {
            this.data.users[userId] = {
                name: userName,
                wallet: 1000,
                bank: 0,
                dailyStreak: 0,
                lastDaily: null,
                lastWork: null,
                lastRob: null,
                inventory: [],
                totalEarned: 1000,
                totalSpent: 0,
                joinDate: new Date().toISOString()
            };
            this.updateLeaderboard();
            this.saveData();
        }
        return this.data.users[userId];
    }
    
    getUser(userId) { return this.data.users[userId] || null; }
    
    // 🦊 Money Operations
    addMoney(userId, amount, source = 'system') {
        if (!this.data.users[userId]) return false;
        this.data.users[userId].wallet += amount;
        this.data.users[userId].totalEarned += amount;
        this.updateLeaderboard();
        this.saveData();
        return true;
    }
    
    removeMoney(userId, amount) {
        if (!this.data.users[userId] || this.data.users[userId].wallet < amount) return false;
        this.data.users[userId].wallet -= amount;
        this.data.users[userId].totalSpent += amount;
        this.saveData();
        return true;
    }
    
    // 🦊 Bank Operations
    deposit(userId, amount) {
        const user = this.data.users[userId];
        if (!user || user.wallet < amount) return { success: false };
        user.wallet -= amount;
        user.bank += amount;
        this.saveData();
        return { success: true, wallet: user.wallet, bank: user.bank };
    }
    
    withdraw(userId, amount) {
        const user = this.data.users[userId];
        if (!user || user.bank < amount) return { success: false };
        user.bank -= amount;
        user.wallet += amount;
        this.saveData();
        return { success: true, wallet: user.wallet, bank: user.bank };
    }
    
    // 🦊 Daily System
    canClaimDaily(userId) {
        const user = this.data.users[userId];
        if (!user) return { canClaim: false };
        if (!user.lastDaily) return { canClaim: true, streak: user.dailyStreak };
        
        const lastDaily = new Date(user.lastDaily);
        const now = new Date();
        const hoursDiff = (now - lastDaily) / (1000 * 60 * 60);
        return hoursDiff >= 24 ? 
            { canClaim: true, streak: user.dailyStreak } : 
            { canClaim: false, hoursLeft: 24 - hoursDiff };
    }
    
    claimDaily(userId) {
        const user = this.data.users[userId];
        if (!user) return { success: false };
        
        const check = this.canClaimDaily(userId);
        if (!check.canClaim) return { success: false, reason: 'Wait ' + Math.ceil(check.hoursLeft) + ' hours' };
        
        const baseReward = 500;
        const streakBonus = user.dailyStreak * 50;
        const totalReward = baseReward + streakBonus;
        
        user.wallet += totalReward;
        user.totalEarned += totalReward;
        user.dailyStreak += 1;
        user.lastDaily = new Date().toISOString();
        
        this.updateLeaderboard();
        this.saveData();
        
        return { success: true, amount: totalReward, streak: user.dailyStreak, wallet: user.wallet };
    }
    
    // 🦊 Work System
    canWork(userId) {
        const user = this.data.users[userId];
        if (!user) return { canWork: false };
        if (!user.lastWork) return { canWork: true };
        
        const lastWork = new Date(user.lastWork);
        const now = new Date();
        const minutesDiff = (now - lastWork) / (1000 * 60);
        return minutesDiff >= 60 ? 
            { canWork: true } : 
            { canWork: false, minutesLeft: 60 - minutesDiff };
    }
    
    work(userId) {
        const user = this.data.users[userId];
        if (!user) return { success: false };
        
        const check = this.canWork(userId);
        if (!check.canWork) return { success: false, reason: 'Wait ' + Math.ceil(check.minutesLeft) + ' minutes' };
        
        const jobs = [
            { name: "🦊 Fox Hunter", min: 200, max: 400 },
            { name: "🍇 Grape Picker", min: 100, max: 300 },
            { name: "💎 Diamond Miner", min: 300, max: 500 }
        ];
        
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        
        user.wallet += reward;
        user.totalEarned += reward;
        user.lastWork = new Date().toISOString();
        
        this.updateLeaderboard();
        this.saveData();
        
        return { success: true, job: job.name, reward: reward, wallet: user.wallet };
    }
    
    // 🦊 Gambling
    gamble(userId, amount) {
        const user = this.data.users[userId];
        if (!user || user.wallet < amount) return { success: false };
        
        const win = Math.random() < 0.45;
        if (win) {
            const winAmount = amount * 2;
            user.wallet += winAmount;
            user.totalEarned += winAmount;
            this.updateLeaderboard();
            this.saveData();
            return { success: true, win: true, amount: winAmount, wallet: user.wallet };
        } else {
            user.wallet -= amount;
            this.saveData();
            return { success: true, win: false, loss: amount, wallet: user.wallet };
        }
    }
    
    // 🦊 Shop
    getShopItems() { return this.shop.items; }
    
    buyItem(userId, itemId) {
        const user = this.data.users[userId];
        if (!user) return { success: false };
        
        const item = this.shop.items.find(i => i.id === itemId);
        if (!item) return { success: false };
        
        if (user.wallet < item.price) {
            return { 
                success: false, 
                needsDeposit: item.price - user.wallet 
            };
        }
        
        user.wallet -= item.price;
        user.totalSpent += item.price;
        user.inventory.push({
            id: item.id,
            name: item.name,
            price: item.price,
            purchased: new Date().toISOString()
        });
        
        this.saveData();
        return { 
            success: true, 
            item: item.name, 
            price: item.price, 
            wallet: user.wallet 
        };
    }
    
    // 🦊 Leaderboard
    updateLeaderboard() {
        const users = Object.entries(this.data.users)
            .map(([id, user]) => ({
                id,
                name: user.name,
                total: user.wallet + user.bank
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 20);
        
        this.data.leaderboard = users;
        this.saveData();
    }
    
    getLeaderboard(limit = 10) { return this.data.leaderboard.slice(0, limit); }
    
    getUserStats(userId) {
        const user = this.data.users[userId];
        if (!user) return null;
        
        const rank = this.data.leaderboard.findIndex(u => u.id === userId) + 1;
        return {
            name: user.name,
            wallet: user.wallet,
            bank: user.bank,
            total: user.wallet + user.bank,
            rank: rank > 0 ? rank : 'Unranked'
        };
    }
    
    // 🦊 Robbery
    canRob(userId, targetId) {
        const user = this.data.users[userId];
        const target = this.data.users[targetId];
        
        if (!user || !target) return { canRob: false };
        if (userId === targetId) return { canRob: false };
        if (target.wallet < 100) return { canRob: false };
        
        return { canRob: true, targetWallet: target.wallet };
    }
    
    performRobbery(userId, targetId) {
        const user = this.data.users[userId];
        const target = this.data.users[targetId];
        
        const stealPercent = Math.random() * 0.2 + 0.1;
        const maxSteal = Math.floor(target.wallet * stealPercent);
        const actualSteal = Math.min(maxSteal, 5000);
        
        const success = Math.random() < 0.6;
        
        if (success) {
            target.wallet -= actualSteal;
            user.wallet += actualSteal;
            user.totalEarned += actualSteal;
            this.updateLeaderboard();
            this.saveData();
            return { success: true, amount: actualSteal };
        } else {
            const fine = Math.min(200, user.wallet);
            user.wallet -= fine;
            this.saveData();
            return { success: false, fine: fine };
        }
    }
    
    // 🦊 Payment
    pay(senderId, receiverId, amount) {
        const sender = this.data.users[senderId];
        const receiver = this.data.users[receiverId];
        
        if (!sender || !receiver) return { success: false };
        if (sender.wallet < amount) return { success: false };
        
        sender.wallet -= amount;
        receiver.wallet += amount;
        receiver.totalEarned += amount;
        
        this.updateLeaderboard();
        this.saveData();
        
        return { success: true, amount: amount };
    }
}

export default new FoxEconomy();