import axios from 'axios';

export default {
    name: 'trivia',
    alias: ['quiz', 'triv'],
    category: 'games',
    description: 'Answer trivia questions 🧠',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        if (!global.triviaGames) global.triviaGames = new Map();
        
        const game = global.triviaGames.get(chatId);
        
        if (game) {
            // Answer current question
            const answer = args.join(' ').toLowerCase().trim();
            const correct = game.correctAnswer.toLowerCase();
            
            if (answer === correct || 
                game.options?.some(opt => opt.toLowerCase() === answer)) {
                
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ CORRECT!* ⧭─┐
│
├─⧭ *Answer:* ${game.correctAnswer}
├─⧭ *Winner:* ${sender}
│
│ Well done! 🏆
│
└─⧭🦊`
                }, { quoted: msg });
                
                global.triviaGames.delete(chatId);
                
            } else {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *❌ WRONG!* ⧭─┐
│
├─⧭ Try again!
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            return;
        }
        
        // Fetch new question
        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = response.data.results[0];
            
            const question = data.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'");
            const correctAnswer = data.correct_answer;
            const options = [...data.incorrect_answers, correctAnswer];
            
            // Shuffle options
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            const optionLetters = ['A', 'B', 'C', 'D'];
            const optionsDisplay = options.map((opt, i) => 
                `${optionLetters[i]}. ${opt.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}`
            ).join('\n│ ');
            
            global.triviaGames.set(chatId, {
                correctAnswer,
                options,
                startTime: Date.now()
            });
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *TRIVIA QUIZ* 🧠 ⧭─┐
│
├─⧭ *Category:* ${data.category}
├─⧭ *Difficulty:* ${data.difficulty}
│
├─⧭ *Question:*
│ ${question}
│
├─⧭ *Options:*
│ ${optionsDisplay}
│
├─⧭ *Answer with:*
│ ${PREFIX}trivia A
│ ${PREFIX}trivia answer
│
└─⧭🦊 *First to answer wins!*`
            }, { quoted: msg });
            
            // Auto-end after 60 seconds
            setTimeout(() => {
                if (global.triviaGames.has(chatId)) {
                    sock.sendMessage(chatId, {
                        text: `┌─⧭ *⏰ TIME'S UP!* ⧭─┐
│
├─⧭ The correct answer was:
│ ${correctAnswer}
│
└─⧭🦊`
                    }, { quoted: msg });
                    global.triviaGames.delete(chatId);
                }
            }, 60000);
            
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Could not fetch trivia question.
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        await sock.sendMessage(chatId, {
            react: { text: "🧠", key: msg.key }
        });
    }
};