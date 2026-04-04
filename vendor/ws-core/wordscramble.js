export default {
    name: 'wordscramble',
    alias: ['scramble', 'unscramble', 'ws'],
    category: 'games',
    description: 'Unscramble the word! 🔀',
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!global.scrambleGames) global.scrambleGames = new Map();
        const WORDS = [
            {word:'PYTHON',hint:'🐍 A popular programming language'},
            {word:'FIREFOX',hint:'🦊 A popular web browser'},
            {word:'KEYBOARD',hint:'⌨️ You type on it'},
            {word:'ANDROID',hint:'📱 A mobile OS by Google'},
            {word:'WHATSAPP',hint:'💬 A messaging app'},
            {word:'INTERNET',hint:'🌐 The world wide web'},
            {word:'TELEGRAM',hint:'✈️ A messaging platform'},
            {word:'PASSWORD',hint:'🔑 Keeps your accounts safe'},
            {word:'ELEPHANT',hint:'🐘 Largest land animal'},
            {word:'FOOTBALL',hint:'⚽ Most popular sport globally'},
            {word:'MIDNIGHT',hint:'🌙 12 AM'},
            {word:'CHAMPION',hint:'🏆 The winner'},
            {word:'DOLPHIN',hint:'🐬 Intelligent sea mammal'},
            {word:'VOLCANO',hint:'🌋 Erupts lava'},
            {word:'GALAXY',hint:'🌌 Contains billions of stars'},
        ];
        const scramble = w => w.split('').sort(()=>Math.random()-0.5).join('');
        if (!args[0] || args[0]==='start') {
            const {word,hint} = WORDS[Math.floor(Math.random()*WORDS.length)];
            let scrambled = scramble(word);
            while (scrambled===word) scrambled=scramble(word);
            global.scrambleGames.set(sender,{word,scrambled,hint,attempts:0,maxAttempts:5});
            return sock.sendMessage(chatId,{text:`┌─⧭ *WORD SCRAMBLE* 🔀 ⧭─┐\n│\n├─⧭ Unscramble: *${scrambled}*\n├─⧭ Hint: ${hint}\n├─⧭ Attempts: *5*\n│\n├─⧭ Answer: *${PREFIX}scramble <word>*\n├─⧭ Hint: *${PREFIX}scramble hint*\n├─⧭ Skip: *${PREFIX}scramble skip*\n└─⧭🦊`},{quoted:msg});
        }
        const game = global.scrambleGames.get(sender);
        if (!game) return sock.sendMessage(chatId,{text:`Start first: *${PREFIX}scramble start*`},{quoted:msg});
        if (args[0]==='hint') return sock.sendMessage(chatId,{text:`💡 Hint: ${game.hint}\n🔀 Scrambled: *${game.scrambled}*\nAttempts left: *${game.maxAttempts-game.attempts}*`},{quoted:msg});
        if (args[0]==='skip') { const w=game.word; global.scrambleGames.delete(sender); return sock.sendMessage(chatId,{text:`⏩ The word was *${w}*\nNew game: *${PREFIX}scramble start*`},{quoted:msg}); }
        const guess = args[0].toUpperCase().trim();
        game.attempts++;
        const left = game.maxAttempts-game.attempts;
        if (guess===game.word) {
            global.scrambleGames.delete(sender);
            return sock.sendMessage(chatId,{text:`┌─⧭ *CORRECT!* 🎉 ⧭─┐\n│\n├─⧭ The word was *${game.word}*\n├─⧭ Solved in ${game.attempts} attempt${game.attempts!==1?'s':''}!\n└─⧭ New game: *${PREFIX}scramble start*`},{quoted:msg});
        }
        if (left<=0) { const w=game.word; global.scrambleGames.delete(sender); return sock.sendMessage(chatId,{text:`┌─⧭ *OUT OF ATTEMPTS!* 💀\n├─⧭ The word was *${w}*\n└─⧭ *${PREFIX}scramble start*`},{quoted:msg}); }
        return sock.sendMessage(chatId,{text:`❌ Wrong! ${left} attempt${left!==1?'s':''} left\n🔀 *${game.scrambled}*\n💡 *${PREFIX}scramble hint* for a clue`},{quoted:msg});
    }
};