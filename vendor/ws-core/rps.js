export default {
    name: 'rps',
    alias: ['rockpaperscissors', 'roshambo'],
    category: 'games',
    description: 'Rock Paper Scissors vs AI 🪨📄✂️',
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const choices = ['rock','paper','scissors'];
        const emoji = {rock:'🪨',paper:'📄',scissors:'✂️'};
        const beats = {rock:'scissors',scissors:'paper',paper:'rock'};
        const player = args[0]?.toLowerCase();
        if (!choices.includes(player))
            return sock.sendMessage(chatId, {text:`┌─⧭ *ROCK PAPER SCISSORS* ✂️ ⧭─┐\n│\n├─⧭ Usage: *${PREFIX}rps rock/paper/scissors*\n│\n├─⧭ 🪨 Rock  📄 Paper  ✂️ Scissors\n└─⧭🦊`},{quoted:msg});
        const ai = choices[Math.floor(Math.random()*3)];
        let result;
        if (player===ai) result='🤝 *DRAW!*';
        else if (beats[player]===ai) result='🎉 *YOU WIN!*';
        else result='🤖 *AI WINS!*';
        const tips = {rock:'Paper covers rock!',paper:'Scissors cut paper!',scissors:'Rock smashes scissors!'};
        await sock.sendMessage(chatId, {text:`┌─⧭ *RPS RESULT* ⧭─┐\n│\n├─⧭ You: ${emoji[player]} ${player.toUpperCase()}\n├─⧭ AI:  ${emoji[ai]} ${ai.toUpperCase()}\n│\n├─⧭ ${result}\n${player!==ai?(`├─⧭ 💡 ${tips[ai]}\n`):''}└─⧭🦊`},{quoted:msg});
    }
};