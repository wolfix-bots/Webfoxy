// utils/foxGroup.js - GROUP MANAGEMENT
import fs from 'fs';
import path from 'path';

const FOX_DEN = './fox_den';
const FOX_GROUPS = path.join(FOX_DEN, 'fox_groups.json');

class FoxGroup {
    constructor() {
        this.loadData();
    }
    
    loadData() {
        try {
            if (fs.existsSync(FOX_GROUPS)) {
                this.data = JSON.parse(fs.readFileSync(FOX_GROUPS, 'utf8'));
            } else {
                this.data = {
                    groups: {},
                    welcomeMessages: {},
                    goodbyeMessages: {},
                    rules: {},
                    polls: {}
                };
                this.saveData();
            }
        } catch (error) {
            this.data = {
                groups: {},
                welcomeMessages: {},
                goodbyeMessages: {},
                rules: {},
                polls: {}
            };
        }
    }
    
    saveData() {
        fs.writeFileSync(FOX_GROUPS, JSON.stringify(this.data, null, 2));
    }
    
    // 🦊 Group Settings
    getGroup(groupId) {
        if (!this.data.groups[groupId]) {
            this.data.groups[groupId] = {
                antilink: false,
                antitag: false,
                welcome: true,
                goodbye: true,
                mute: false,
                admins: [],
                settings: {}
            };
            this.saveData();
        }
        return this.data.groups[groupId];
    }
    
    setAntilink(groupId, enabled) {
        const group = this.getGroup(groupId);
        group.antilink = enabled;
        this.saveData();
        return enabled;
    }
    
    setAntitag(groupId, enabled) {
        const group = this.getGroup(groupId);
        group.antitag = enabled;
        this.saveData();
        return enabled;
    }
    
    setWelcome(groupId, enabled) {
        const group = this.getGroup(groupId);
        group.welcome = enabled;
        this.saveData();
        return enabled;
    }
    
    setGoodbye(groupId, enabled) {
        const group = this.getGroup(groupId);
        group.goodbye = enabled;
        this.saveData();
        return enabled;
    }
    
    // 🦊 Welcome/Goodbye Messages
    setWelcomeMessage(groupId, message) {
        this.data.welcomeMessages[groupId] = message;
        this.saveData();
        return message;
    }
    
    setGoodbyeMessage(groupId, message) {
        this.data.goodbyeMessages[groupId] = message;
        this.saveData();
        return message;
    }
    
    getWelcomeMessage(groupId) {
        return this.data.welcomeMessages[groupId] || 
               "🦊 Welcome {user} to the group!\nFeel free to introduce yourself!";
    }
    
    getGoodbyeMessage(groupId) {
        return this.data.goodbyeMessages[groupId] || 
               "🦊 Goodbye {user}!\nWe'll miss you!";
    }
    
    // 🦊 Rules
    setRules(groupId, rules) {
        this.data.rules[groupId] = rules;
        this.saveData();
        return rules;
    }
    
    getRules(groupId) {
        return this.data.rules[groupId] || "No rules set for this group.";
    }
    
    // 🦊 Polls
    createPoll(groupId, question, options, creator) {
        const pollId = Date.now().toString();
        this.data.polls[pollId] = {
            groupId,
            question,
            options: options.map(opt => ({ text: opt, votes: 0 })),
            voters: {},
            creator,
            created: new Date().toISOString()
        };
        this.saveData();
        return pollId;
    }
    
    votePoll(pollId, userId, optionIndex) {
        const poll = this.data.polls[pollId];
        if (!poll) return null;
        
        if (poll.voters[userId]) return { error: 'Already voted' };
        
        if (optionIndex >= 0 && optionIndex < poll.options.length) {
            poll.options[optionIndex].votes++;
            poll.voters[userId] = optionIndex;
            this.saveData();
            return { success: true, option: poll.options[optionIndex].text };
        }
        
        return { error: 'Invalid option' };
    }
    
    getPollResults(pollId) {
        const poll = this.data.polls[pollId];
        if (!poll) return null;
        
        let results = `📊 *Poll Results:* ${poll.question}\n\n`;
        poll.options.forEach((opt, idx) => {
            results += `${idx + 1}. ${opt.text}: ${opt.votes} votes\n`;
        });
        results += `\nTotal votes: ${Object.keys(poll.voters).length}`;
        return results;
    }
    
    // 🦊 Check if link should be blocked
    shouldBlockLink(groupId, message) {
        const group = this.getGroup(groupId);
        if (!group.antilink) return false;
        
        const linkPatterns = [
            /https?:\/\//,
            /www\./,
            /\.com/,
            /\.net/,
            /\.org/,
            /\.me/,
            /\.io/
        ];
        
        return linkPatterns.some(pattern => pattern.test(message));
    }
    
    // 🦊 Check if tag spam
    checkTagSpam(groupId, message) {
        const group = this.getGroup(groupId);
        if (!group.antitag) return false;
        
        const tagCount = (message.match(/@/g) || []).length;
        return tagCount > 5; // More than 5 tags = spam
    }
}

export default new FoxGroup();