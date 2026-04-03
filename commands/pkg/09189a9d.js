export default {
    name: 'hangman',
    alias: ['hang', 'hm'],
    category: 'games',
    description: 'Play hangman word guessing game 🪢',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        // Check if game is already running
        if (!global.hangmanGames) global.hangmanGames = new Map();
        
        const existingGame = global.hangmanGames.get(chatId);
        
        // Word list
        const words = [
            'FOXY', 'BOT', 'WHATSAPP', 'GAME', 'HANGMAN',
            'FOX', 'PYTHON', 'CODING', 'FUN', 'WIN',
            'SMART', 'CUTE', 'FAST', 'CLEVER', 'QUICK'
        ];
        
        // If starting a new game
        if (args[0]?.toLowerCase() === 'start' || !existingGame) {
            const word = words[Math.floor(Math.random() * words.length)];
            const game = {
                word: word,
                guessed: [],
                attempts: 6,
                status: 'playing',
                player: sender,
                startTime: Date.now()
            };
            
            global.hangmanGames.set(chatId, game);
            
            const display = word.split('').map(l => game.guessed.includes(l) ? l : '⬜').join(' ');
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *HANGMAN GAME* 🪢 ⧭─┐
│
├─⧭ *Word:* ${display}
├─⧭ *Attempts left:* ${game.attempts}
├─⧭ *Guessed:* ${game.guessed.join(', ') || 'None'}
│
├─⧭ *Guess a letter:*
│ ${PREFIX}hangman <letter>
│
└─⧭🦊 *Game started!*`
            }, { quoted: msg });
            
            return;
        }
        
        const game = existingGame;
        if (!game) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *HANGMAN* 🪢 ⧭─┐
│
├─⧭ No active game!
│
├─⧭ *Start a game:*
│ ${PREFIX}hangman start
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        // Process guess
        const guess = args[0]?.toUpperCase();
        if (!guess || guess.length !== 1 || !/[A-Z]/.test(guess)) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *INVALID GUESS* ❌ ⧭─┐
│
├─⧭ Please guess a single letter A-Z.
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        if (game.guessed.includes(guess)) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *ALREADY GUESSED* 🔁 ⧭─┐
│
├─⧭ You already guessed "${guess}"!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        game.guessed.push(guess);
        
        if (!game.word.includes(guess)) {
            game.attempts--;
        }
        
        const display = game.word.split('').map(l => game.guessed.includes(l) ? l : '⬜').join(' ');
        const won = !display.includes('⬜');
        
        // Hangman stages
        const stages = [
            '⬜⬜⬜⬜⬜',
            '⬜⬜⬜⬜⬜',
            '⬜⬜⬜⬜⬜',
            '⬜⬜⬜⬜⬜',
            '⬜⬜⬜⬜⬜',
            '⬜⬜⬜⬜⬜'
        ];
        
        if (won) {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🎉 YOU WIN!* ⧭─┐
│
├─⧭ *Word:* ${game.word}
├─⧭ *Guessed:* ${game.guessed.join(', ')}
│
│ Congratulations ${sender}! 🏆
│
└─⧭🦊`
            }, { quoted: msg });
            
            global.hangmanGames.delete(chatId);
            
        } else if (game.attempts <= 0) {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *💀 GAME OVER* ⧭─┐
│
├─⧭ *Word was:* ${game.word}
├─⧭ *Guessed:* ${game.guessed.join(', ')}
│
│ Better luck next time!
│
└─⧭🦊`
            }, { quoted: msg });
            
            global.hangmanGames.delete(chatId);
            
        } else {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *HANGMAN GAME* 🪢 ⧭─┐
│
├─⧭ *Word:* ${display}
├─⧭ *Attempts left:* ${game.attempts}
├─⧭ *Guessed:* ${game.guessed.join(', ')}
│
├─⧭ *Guess another letter:*
│ ${PREFIX}hangman <letter>
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        await sock.sendMessage(chatId, {
            react: { text: "🪢", key: msg.key }
        });
    }
};