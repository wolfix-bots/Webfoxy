export default {
    name: 'numguess',
    alias: ['numberguess', 'guess', 'numgame'],
    category: 'games',
    description: 'Guess the secret number 1-100 🔢',
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!global.numGames) global.numGames = new Map();
        if (!args[0] || args[0]==='start') {
            const secret = Math.floor(Math.random()*100)+1;
            global.numGames.set(sender,{secret,attempts:0,max:8,started:Date.now()});
            return sock.sendMessage(chatId,{text:`┌─⧭ *NUMBER GUESSING* 🔢 ⧭─┐\n│\n├─⧭ I picked a number *1–100*\n├─⧭ You have *8 attempts*\n│\n├─⧭ Guess: *${PREFIX}numguess <number>*\n└─⧭🦊`},{quoted:msg});
        }
        const game = global.numGames.get(sender);
        if (!game) return sock.sendMessage(chatId,{text:`Start first: *${PREFIX}numguess start*`},{quoted:msg});
        const guess = parseInt(args[0]);
        if (isNaN(guess)||guess<1||guess>100)
            return sock.sendMessage(chatId,{text:'❌ Pick a number between 1 and 100!'},{quoted:msg});
        game.attempts++;
        const left = game.max - game.attempts;
        if (guess===game.secret) {
            const time = ((Date.now()-game.started)/1000).toFixed(1);
            global.numGames.delete(sender);
            return sock.sendMessage(chatId,{text:`┌─⧭ *CORRECT!* 🎉 ⧭─┐\n│\n├─⧭ The number was *${game.secret}*\n├─⧭ Solved in *${game.attempts}* attempt${game.attempts!==1?'s':''}\n├─⧭ Time: ${time}s\n│\n└─⧭ New game: *${PREFIX}numguess start*`},{quoted:msg});
        }
        if (left<=0) {
            const secret=game.secret; global.numGames.delete(sender);
            return sock.sendMessage(chatId,{text:`┌─⧭ *GAME OVER!* 💀 ⧭─┐\n│\n├─⧭ The number was *${secret}*\n└─⧭ *${PREFIX}numguess start*`},{quoted:msg});
        }
        const dir = guess<game.secret?'📈 *HIGHER!*':'📉 *LOWER!*';
        const diff = Math.abs(guess-game.secret);
        const hint = diff<10?'🔥 Very close!':diff<25?'♨️ Getting warm...':'🧊 Far away!';
        return sock.sendMessage(chatId,{text:`┌─⧭ *NUMBER GUESS* ⧭─┐\n│\n├─⧭ Your guess: *${guess}*\n├─⧭ ${dir}\n├─⧭ ${hint}\n├─⧭ Attempts left: *${left}*\n└─⧭🦊`},{quoted:msg});
    }
};