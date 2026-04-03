export default {
    name: 'tictactoe',
    alias: ['ttt', 't3'],
    category: 'games',
    description: 'Play Tic Tac Toe with a friend ❌⭕',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Player X';
        const isGroup = chatId.endsWith('@g.us');
        
        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ONLY* 👥 ⧭─┐
│
├─⧭ Tic Tac Toe can only be played in groups!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        if (!global.tttGames) global.tttGames = new Map();
        
        const game = global.tttGames.get(chatId);
        
        // Start new game
        if (args[0]?.toLowerCase() === 'start' || !game) {
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            
            if (!mentioned) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *TIC TAC TOE* ❌⭕ ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}ttt start @player
│
├─⧭ *Example:*
│ ${PREFIX}ttt start @friend
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            const playerX = msg.key.participant || chatId;
            const playerO = mentioned;
            
            const newGame = {
                board: ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'],
                turn: 'X',
                players: { X: playerX, O: playerO },
                moves: 0,
                startTime: Date.now()
            };
            
            global.tttGames.set(chatId, newGame);
            
            const boardDisplay = `
${newGame.board[0]} ${newGame.board[1]} ${newGame.board[2]}
${newGame.board[3]} ${newGame.board[4]} ${newGame.board[5]}
${newGame.board[6]} ${newGame.board[7]} ${newGame.board[8]}`;
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *TIC TAC TOE STARTED* ❌⭕ ⧭─┐
│
├─⧭ *Player X:* @${playerX.split('@')[0]}
├─⧭ *Player O:* @${playerO.split('@')[0]}
│
├─⧭ *Board:*
│ ${boardDisplay}
│
├─⧭ *Turn:* ❌ Player X
│
├─⧭ *To play:*
│ ${PREFIX}ttt <position 1-9>
│
└─⧭🦊`,
                mentions: [playerX, playerO]
            }, { quoted: msg });
            
            return;
        }
        
        // Make a move
        const position = parseInt(args[0]) - 1;
        
        if (isNaN(position) || position < 0 || position > 8) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *INVALID MOVE* ❌ ⧭─┐
│
├─⧭ Choose position 1-9
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        const player = msg.key.participant || chatId;
        
        if (game.players[game.turn] !== player) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *NOT YOUR TURN* ⚠️ ⧭─┐
│
├─⧭ It's Player ${game.turn}'s turn!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        if (game.board[position] !== '⬜') {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *POSITION TAKEN* ❌ ⧭─┐
│
├─⧭ That spot is already filled!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        // Make move
        game.board[position] = game.turn === 'X' ? '❌' : '⭕';
        game.moves++;
        
        // Check winner
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8], // rows
            [0,3,6], [1,4,7], [2,5,8], // columns
            [0,4,8], [2,4,6]           // diagonals
        ];
        
        let winner = null;
        for (const pattern of winPatterns) {
            const [a,b,c] = pattern;
            if (game.board[a] !== '⬜' && 
                game.board[a] === game.board[b] && 
                game.board[b] === game.board[c]) {
                winner = game.board[a];
                break;
            }
        }
        
        const boardDisplay = `
${game.board[0]} ${game.board[1]} ${game.board[2]}
${game.board[3]} ${game.board[4]} ${game.board[5]}
${game.board[6]} ${game.board[7]} ${game.board[8]}`;
        
        if (winner) {
            const winnerPlayer = winner === '❌' ? game.players.X : game.players.O;
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🎉 GAME OVER!* ⧭─┐
│
├─⧭ *Winner:* ${winner} @${winnerPlayer.split('@')[0]}
│
├─⧭ *Final Board:*
│ ${boardDisplay}
│
└─⧭🦊`,
                mentions: [winnerPlayer]
            }, { quoted: msg });
            
            global.tttGames.delete(chatId);
            
        } else if (game.moves === 9) {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🤝 IT'S A TIE!* ⧭─┐
│
├─⧭ *Final Board:*
│ ${boardDisplay}
│
└─⧭🦊`
            }, { quoted: msg });
            
            global.tttGames.delete(chatId);
            
        } else {
            game.turn = game.turn === 'X' ? 'O' : 'X';
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *TIC TAC TOE* ❌⭕ ⧭─┐
│
├─⧭ *Board:*
│ ${boardDisplay}
│
├─⧭ *Turn:* ${game.turn === 'X' ? '❌' : '⭕'} Player ${game.turn}
│
├─⧭ *To play:*
│ ${PREFIX}ttt <position 1-9>
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        await sock.sendMessage(chatId, {
            react: { text: game.turn === 'X' ? '❌' : '⭕', key: msg.key }
        });
    }
};