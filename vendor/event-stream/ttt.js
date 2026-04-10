// ttt.js — 2-Player Tic Tac Toe for WhatsApp groups
// Players challenge each other and take turns by replying with numbers 1-9
export default {
    name: 'ttt',
    alias: ['tictactoe', 'ticbot', 'tttplay', 'tttfriend'],
    category: 'game',
    description: 'Play Tic Tac Toe with a friend! 2-player group game ❌⭕',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!global.tttGames) global.tttGames = new Map();

        const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

        const checkWinner = (b) => {
            for (const [a, c, d] of WIN_LINES) {
                if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
            }
            return b.includes(null) ? null : 'draw';
        };

        const sym = v => v === 'X' ? '❌' : v === 'O' ? '⭕' : '⬜';

        const renderBoard = (b) =>
            `${sym(b[0])} ${sym(b[1])} ${sym(b[2])}\n${sym(b[3])} ${sym(b[4])} ${sym(b[5])}\n${sym(b[6])} ${sym(b[7])} ${sym(b[8])}`;

        const action = args[0]?.toLowerCase();

        // --- START a new game ---
        if (!action || action === 'start' || action === 'new') {
            // Challenge a tagged person
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || msg.message?.extendedTextMessage?.contextInfo?.participant;

            if (!mentioned || mentioned === sender) {
                return sock.sendMessage(chatId, {
                    text:
`╭─⌈ ❌⭕ *TIC TAC TOE* ⌋
│
├─⊷ Challenge a friend to play!
│
├─⊷ *Usage:*
│  \`${PREFIX}ttt @friend\` — Challenge a friend
│  \`${PREFIX}ttt accept\` — Accept a challenge
│  \`${PREFIX}ttt <1-9>\` — Make a move
│  \`${PREFIX}ttt quit\` — Quit current game
│
├─⊷ *Note:*
│  Works best in groups!
│  Want to play vs AI? Use \`${PREFIX}tttai\`
│
╰⊷ 🦊 Foxy`
                }, { quoted: msg });
            }

            // Create challenge
            const gameKey = chatId;
            global.tttGames.set(gameKey, {
                board: Array(9).fill(null),
                challenger: sender,
                challenged: mentioned,
                currentPlayer: null, // set when accepted
                challengerSymbol: 'X',
                challengedSymbol: 'O',
                status: 'pending',
                createdAt: Date.now()
            });

            const challengerName = msg.pushName || sender.split('@')[0];
            const challengedNum = mentioned.split('@')[0];

            return sock.sendMessage(chatId, {
                text:
`❌⭕ *TIC TAC TOE CHALLENGE!*

@${challengerName.replace(/\s+/g,'').toLowerCase()} challenged @${challengedNum} to Tic Tac Toe!

@${challengedNum} type \`${PREFIX}ttt accept\` to start the game!
Or \`${PREFIX}ttt reject\` to decline.

Challenge expires in 2 minutes. ⏰`,
                mentions: [sender, mentioned]
            }, { quoted: msg });
        }

        // --- ACCEPT challenge ---
        if (action === 'accept') {
            const gameKey = chatId;
            const game = global.tttGames.get(gameKey);

            if (!game || game.status !== 'pending') {
                return sock.sendMessage(chatId, {
                    text: `❌ No pending challenge in this chat. Start one with \`${PREFIX}ttt @friend\``
                }, { quoted: msg });
            }

            if (game.challenged !== sender) {
                return sock.sendMessage(chatId, {
                    text: `❌ This challenge is not for you! Only the challenged player can accept.`
                }, { quoted: msg });
            }

            // Check if challenge is still valid (2 min)
            if (Date.now() - game.createdAt > 120000) {
                global.tttGames.delete(gameKey);
                return sock.sendMessage(chatId, {
                    text: `❌ Challenge expired. Start a new game with \`${PREFIX}ttt @friend\``
                }, { quoted: msg });
            }

            game.status = 'active';
            game.currentPlayer = game.challenger; // challenger goes first (X)

            return sock.sendMessage(chatId, {
                text:
`✅ *GAME STARTED!* ❌⭕

@${game.challenger.split('@')[0]} ❌ vs @${game.challenged.split('@')[0]} ⭕

${renderBoard(game.board)}

1️⃣2️⃣3️⃣
4️⃣5️⃣6️⃣
7️⃣8️⃣9️⃣

@${game.challenger.split('@')[0]} goes first (❌)!
Type \`${PREFIX}ttt <1-9>\` to place your symbol.`,
                mentions: [game.challenger, game.challenged]
            }, { quoted: msg });
        }

        // --- REJECT challenge ---
        if (action === 'reject' || action === 'decline') {
            const gameKey = chatId;
            const game = global.tttGames.get(gameKey);
            if (game && game.status === 'pending' && game.challenged === sender) {
                global.tttGames.delete(gameKey);
                return sock.sendMessage(chatId, {
                    text: `❌ Challenge rejected by @${sender.split('@')[0]}`,
                    mentions: [sender]
                }, { quoted: msg });
            }
            return sock.sendMessage(chatId, { text: `No pending challenge to reject.` }, { quoted: msg });
        }

        // --- QUIT game ---
        if (action === 'quit' || action === 'end' || action === 'stop') {
            const gameKey = chatId;
            const game = global.tttGames.get(gameKey);
            if (!game) return sock.sendMessage(chatId, { text: `No active game to quit.` }, { quoted: msg });
            if (game.challenger !== sender && game.challenged !== sender) {
                return sock.sendMessage(chatId, { text: `❌ Only the players can quit the game.` }, { quoted: msg });
            }
            global.tttGames.delete(gameKey);
            return sock.sendMessage(chatId, {
                text: `🏳️ Game ended by @${sender.split('@')[0]}`,
                mentions: [sender]
            }, { quoted: msg });
        }

        // --- MAKE A MOVE ---
        const pos = parseInt(args[0]) - 1;
        if (!isNaN(pos) && pos >= 0 && pos <= 8) {
            const gameKey = chatId;
            const game = global.tttGames.get(gameKey);

            if (!game) {
                return sock.sendMessage(chatId, {
                    text: `No active game! Start one with \`${PREFIX}ttt @friend\``
                }, { quoted: msg });
            }

            if (game.status === 'pending') {
                return sock.sendMessage(chatId, {
                    text: `⏳ Waiting for @${game.challenged.split('@')[0]} to accept the challenge!`,
                    mentions: [game.challenged]
                }, { quoted: msg });
            }

            if (game.currentPlayer !== sender) {
                const otherPlayer = game.currentPlayer === game.challenger ? game.challenger : game.challenged;
                return sock.sendMessage(chatId, {
                    text: `⏳ It's @${otherPlayer.split('@')[0]}'s turn!`,
                    mentions: [otherPlayer]
                }, { quoted: msg });
            }

            if (sender !== game.challenger && sender !== game.challenged) {
                return sock.sendMessage(chatId, { text: `❌ You're not a player in this game.` }, { quoted: msg });
            }

            if (game.board[pos] !== null) {
                return sock.sendMessage(chatId, { text: `❌ That position is already taken! Pick 1-9.` }, { quoted: msg });
            }

            const symbol = sender === game.challenger ? game.challengerSymbol : game.challengedSymbol;
            game.board[pos] = symbol;

            const winner = checkWinner(game.board);

            if (winner === 'draw') {
                global.tttGames.delete(gameKey);
                return sock.sendMessage(chatId, {
                    text:
`🤝 *IT'S A DRAW!*

${renderBoard(game.board)}

Good game! @${game.challenger.split('@')[0]} vs @${game.challenged.split('@')[0]}
Try again with \`${PREFIX}ttt @friend\`!`,
                    mentions: [game.challenger, game.challenged]
                }, { quoted: msg });
            }

            if (winner) {
                const winnerJid = winner === 'X' ? game.challenger : game.challenged;
                global.tttGames.delete(gameKey);
                return sock.sendMessage(chatId, {
                    text:
`🎉 *@${winnerJid.split('@')[0]} WINS!* ${winner === 'X' ? '❌' : '⭕'}

${renderBoard(game.board)}

Congratulations! 🏆
@${winnerJid.split('@')[0]} defeated @${(winnerJid === game.challenger ? game.challenged : game.challenger).split('@')[0]}!
New game: \`${PREFIX}ttt @friend\``,
                    mentions: [game.challenger, game.challenged]
                }, { quoted: msg });
            }

            // Switch player
            game.currentPlayer = sender === game.challenger ? game.challenged : game.challenger;

            return sock.sendMessage(chatId, {
                text:
`${sym(symbol)} @${sender.split('@')[0]} placed at position ${pos + 1}

${renderBoard(game.board)}

Now it's @${game.currentPlayer.split('@')[0]}'s turn! (${sym(game.currentPlayer === game.challenger ? 'X' : 'O')})
Type \`${PREFIX}ttt <1-9>\` to play.`,
                mentions: [game.currentPlayer]
            }, { quoted: msg });
        }

        // Unknown action
        return sock.sendMessage(chatId, {
            text: `❓ Unknown action. Use:\n• \`${PREFIX}ttt @friend\` — Challenge\n• \`${PREFIX}ttt accept\` — Accept\n• \`${PREFIX}ttt 1-9\` — Make a move\n• \`${PREFIX}ttt quit\` — Quit`
        }, { quoted: msg });
    }
};
