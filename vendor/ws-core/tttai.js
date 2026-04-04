export default {
    name: 'tttai',
    alias: ['tttbot', 'tictactoeai', 'aitt'],
    category: 'games',
    description: 'Play Tic Tac Toe vs AI 🤖❌⭕',
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!global.tttAiGames) global.tttAiGames = new Map();
        const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        const checkWinner = b => {
            for (const [a,c,d] of WIN_LINES) if (b[a] && b[a]===b[c] && b[a]===b[d]) return b[a];
            return b.includes(null) ? null : 'draw';
        };
        const minimax = (b, isMax, alpha=-Infinity, beta=Infinity) => {
            const w = checkWinner(b);
            if (w==='O') return 10; if (w==='X') return -10; if (w==='draw') return 0;
            let best = isMax ? -Infinity : Infinity;
            for (let i=0;i<9;i++) {
                if (b[i]!==null) continue;
                b[i] = isMax ? 'O' : 'X';
                const s = minimax(b, !isMax, alpha, beta);
                b[i] = null;
                if (isMax) { best=Math.max(best,s); alpha=Math.max(alpha,best); }
                else       { best=Math.min(best,s); beta=Math.min(beta,best); }
                if (beta<=alpha) break;
            }
            return best;
        };
        const bestMove = b => {
            let best=-Infinity, move=-1;
            for (let i=0;i<9;i++) {
                if (b[i]!==null) continue;
                b[i]='O'; const s=minimax(b,false); b[i]=null;
                if (s>best){best=s;move=i;}
            }
            return move;
        };
        const sym = v => v==='X'?'❌':v==='O'?'⭕':'⬜';
        const renderBoard = b => [0,3,6].map(r=>`${sym(b[r])} ${sym(b[r+1])} ${sym(b[r+2])}`).join('\n');

        if (!args[0] || args[0]==='start') {
            global.tttAiGames.delete(sender);
            const board = Array(9).fill(null);
            global.tttAiGames.set(sender, {board, over:false});
            return sock.sendMessage(chatId, {text:`┌─⧭ *TIC TAC TOE vs AI* 🤖 ⧭─┐\n│\n├─⧭ You ❌ vs AI ⭕\n│\n${renderBoard(board)}\n│\n├─⧭ Positions: 1-9 (top-left to bottom-right)\n├─⧭ Play: *${PREFIX}tttai <1-9>*\n└─⧭🦊`},{quoted:msg});
        }
        const game = global.tttAiGames.get(sender);
        if (!game) return sock.sendMessage(chatId,{text:`Start first: *${PREFIX}tttai start*`},{quoted:msg});
        if (game.over) return sock.sendMessage(chatId,{text:`Game over! New game: *${PREFIX}tttai start*`},{quoted:msg});
        const pos = parseInt(args[0])-1;
        if (isNaN(pos)||pos<0||pos>8||game.board[pos]!==null)
            return sock.sendMessage(chatId,{text:'❌ Invalid! Pick 1-9 on an empty square.'},{quoted:msg});
        game.board[pos]='X';
        let w=checkWinner(game.board);
        if (w==='X'){game.over=true;return sock.sendMessage(chatId,{text:`┌─⧭ *YOU WIN!* 🎉 ⧭─┐\n│\n${renderBoard(game.board)}\n│\n├─⧭ You beat the AI! 🦊\n└─⧭ New game: *${PREFIX}tttai start*`},{quoted:msg});}
        if (w==='draw'){game.over=true;return sock.sendMessage(chatId,{text:`┌─⧭ *DRAW!* 🤝\n│\n${renderBoard(game.board)}\n└─⧭ *${PREFIX}tttai start*`},{quoted:msg});}
        const ai=bestMove(game.board);
        game.board[ai]='O';
        w=checkWinner(game.board);
        if (w==='O'){game.over=true;return sock.sendMessage(chatId,{text:`┌─⧭ *AI WINS!* 🤖 ⧭─┐\n│\n${renderBoard(game.board)}\n│\n├─⧭ Better luck next time! 🦊\n└─⧭ New game: *${PREFIX}tttai start*`},{quoted:msg});}
        if (w==='draw'){game.over=true;return sock.sendMessage(chatId,{text:`┌─⧭ *DRAW!* 🤝\n│\n${renderBoard(game.board)}\n└─⧭ *${PREFIX}tttai start*`},{quoted:msg});}
        return sock.sendMessage(chatId,{text:`┌─⧭ *TTTAI* ❌⭕ ⧭─┐\n│\n${renderBoard(game.board)}\n│\n├─⧭ AI played *${ai+1}* — your turn (1-9)\n└─⧭🦊`},{quoted:msg});
    }
};