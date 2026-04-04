export default {
    name: 'games',
    alias: ['gamelist', 'gamemenu', 'playgames'],
    category: 'games',
    description: 'Show all available Foxy Bot games 🎮',
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        await sock.sendMessage(chatId, {text:
`┌─⧭ *FOXY BOT GAMES* 🎮🦊 ⧭─┐
│
├─⧭ *AI GAMES* 🤖
│ ❌⭕ *${PREFIX}tttai* — TicTacToe vs AI
│ 🪨📄✂️ *${PREFIX}rps* — Rock Paper Scissors vs AI
│ 🔢 *${PREFIX}numguess* — Guess the number (1-100)
│ 🔀 *${PREFIX}scramble* — Word scramble challenge
│
├─⧭ *MULTIPLAYER* 👥
│ ❌⭕ *${PREFIX}ttt* — TicTacToe (group, 2 players)
│ 🏁 *${PREFIX}hangman* — Hangman word game
│ 🧠 *${PREFIX}trivia* — Random trivia quiz
│ 💬 *${PREFIX}truth* — Truth or Dare
│
├─⧭ *QUICK FUN* ⚡
│ 🎲 *${PREFIX}dice* — Roll the dice
│ 🪙 *${PREFIX}coinflip* — Heads or tails
│ 🎱 *${PREFIX}8ball* — Magic 8-ball
│ 😄 *${PREFIX}joke* — Random joke
│ 💡 *${PREFIX}fact* — Fun fact
│
├─⧭ AI games work in DMs + groups!
└─⧭🦊 Have fun!`}, {quoted: msg});
    }
};