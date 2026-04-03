// utils/foxGames.js - GAMES SYSTEM
import fs from 'fs';
import path from 'path';

const FOX_DEN = './fox_den';
const FOX_GAMES = path.join(FOX_DEN, 'fox_games.json');

class FoxGames {
    constructor() {
        this.loadData();
    }
    
    loadData() {
        try {
            if (fs.existsSync(FOX_GAMES)) {
                this.data = JSON.parse(fs.readFileSync(FOX_GAMES, 'utf8'));
            } else {
                this.data = {
                    triviaScores: {},
                    hangmanGames: {},
                    raceGames: {}
                };
                this.saveData();
            }
        } catch (error) {
            this.data = {
                triviaScores: {},
                hangmanGames: {},
                raceGames: {}
            };
        }
    }
    
    saveData() {
        fs.writeFileSync(FOX_GAMES, JSON.stringify(this.data, null, 2));
    }
    
    // 🎲 Roll Dice
    rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }
    
    // 🪙 Coin Flip
    flipCoin() {
        return Math.random() < 0.5 ? 'Heads' : 'Tails';
    }
    
    // 🎱 8-Ball
    eightBall() {
        const responses = [
            "Yes definitely 🟢",
            "It is certain 🟢",
            "Without a doubt 🟢",
            "Yes 🟢",
            "Most likely 🟢",
            "Ask again later 🟡",
            "Cannot predict now 🟡",
            "Don't count on it 🔴",
            "My reply is no 🔴",
            "Very doubtful 🔴"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 🏁 Race Game
    startRace(userId) {
        const positions = {
            player: 0,
            bot1: 0,
            bot2: 0,
            bot3: 0
        };
        
        this.data.raceGames[userId] = {
            positions,
            started: new Date().toISOString()
        };
        this.saveData();
        
        return positions;
    }
    
    raceStep(userId) {
        const race = this.data.raceGames[userId];
        if (!race) return null;
        
        // Move all racers
        race.positions.player += Math.floor(Math.random() * 3) + 1;
        race.positions.bot1 += Math.floor(Math.random() * 3) + 1;
        race.positions.bot2 += Math.floor(Math.random() * 3) + 1;
        race.positions.bot3 += Math.floor(Math.random() * 3) + 1;
        
        this.saveData();
        return race.positions;
    }
    
    // 🧠 Trivia
    getTriviaQuestion() {
        const questions = [
            {
                question: "What does a fox say?",
                options: ["Ring-ding-ding", "Meow", "Woof", "Moo"],
                answer: 0
            },
            {
                question: "How many legs does a fox have?",
                options: ["2", "4", "6", "8"],
                answer: 1
            },
            {
                question: "What color is a typical fox?",
                options: ["Blue", "Green", "Red/Orange", "Pink"],
                answer: 2
            }
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // 😄 Jokes
    getJoke() {
        const jokes = [
            "Why did the fox cross the road? To prove he wasn't chicken! 🦊🐔",
            "What do you call a fox with a carrot in each ear? Anything you want, he can't hear you! 🦊🥕",
            "Why are foxes so good at baseball? They have great paws-eye coordination! 🦊⚾",
            "What's a fox's favorite game? Hide and squeak! 🦊🐭",
            "How do foxes stay cool in summer? They use their fan-tails! 🦊❄️"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    // 💡 Facts
    getFact() {
        const facts = [
            "Foxes can run up to 45 mph! 🦊💨",
            "A group of foxes is called a 'skulk' or 'leash'. 🦊🦊🦊",
            "Foxes have excellent hearing - they can hear a watch ticking from 40 yards away! 🦊👂",
            "Foxes use 28 different vocalizations to communicate. 🦊🗣️",
            "A fox's tail is called a 'brush'. 🦊🖌️"
        ];
        return facts[Math.floor(Math.random() * facts.length)];
    }
    
    // 💬 Quotes
    getQuote() {
        const quotes = [
            "The fox knows many things, but the hedgehog knows one big thing. - Archilochus",
            "Be as sly as a fox, as swift as a wolf, and as silent as the falling snow. 🦊❄️",
            "A fox is a wolf who sends flowers. 🦊🌹",
            "The clever fox avoids the trap. 🦊🪤",
            "Even the slyest fox can be caught. 🦊🎣"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    
    // 🤗 Hug
    getHugMessage() {
        const hugs = [
            "🦊 *Fox Hug!* 🤗 A warm fuzzy hug from your fox friend!",
            "🦊🤗 *Tight Squeeze!* The fox gives you a big warm hug!",
            "🤗🦊 *Fuzzy Embrace!* You're hugged by a fluffy fox!",
            "🦊💕 *Fox Love!* A caring hug from your fox companion!"
        ];
        return hugs[Math.floor(Math.random() * hugs.length)];
    }
    
    // 👋 Slap
    getSlapMessage() {
        const slaps = [
            "🦊 *Fox Slap!* 👋 The fox gives you a gentle paw-slap!",
            "👋🦊 *Tail Whip!* The fox slaps you with its fluffy tail!",
            "🦊👋 *Paw Smack!* A playful slap from fox paws!",
            "👋 *Fox Discipline!* The fox gives you a corrective slap!"
        ];
        return slaps[Math.floor(Math.random() * slaps.length)];
    }
    
    // 🪢 Hangman
    startHangman(userId, word = null) {
        const words = ["FOXY", "DEN", "TAIL", "PAWS", "HUNTER", "FOREST", "CUNNING"];
        const selectedWord = word || words[Math.floor(Math.random() * words.length)];
        
        this.data.hangmanGames[userId] = {
            word: selectedWord,
            guessed: [],
            incorrect: 0,
            maxIncorrect: 6,
            started: new Date().toISOString()
        };
        this.saveData();
        
        return this.data.hangmanGames[userId];
    }
    
    guessHangman(userId, letter) {
        const game = this.data.hangmanGames[userId];
        if (!game) return null;
        
        letter = letter.toUpperCase();
        
        if (game.guessed.includes(letter)) {
            return { error: 'Already guessed' };
        }
        
        game.guessed.push(letter);
        
        if (!game.word.includes(letter)) {
            game.incorrect++;
        }
        
        this.saveData();
        
        const display = this.getHangmanDisplay(game);
        const won = this.checkHangmanWin(game);
        const lost = game.incorrect >= game.maxIncorrect;
        
        return { display, won, lost, game };
    }
    
    getHangmanDisplay(game) {
        let display = '';
        for (const letter of game.word) {
            if (game.guessed.includes(letter)) {
                display += letter + ' ';
            } else {
                display += '_ ';
            }
        }
        
        // Hangman ASCII art based on incorrect guesses
        const stages = [
            `
  ┌───┐
  │   │
      │
      │
      │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
      │
      │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
  │   │
      │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
 /│   │
      │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
 /│\\  │
      │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
 /│\\  │
 /    │
      │
=========`,
            `
  ┌───┐
  │   │
  O   │
 /│\\  │
 / \\  │
      │
=========`
        ];
        
        return stages[game.incorrect] + '\n\nWord: ' + display.trim() + 
               '\n\nGuessed: ' + game.guessed.join(', ') +
               '\nIncorrect: ' + game.incorrect + '/' + game.maxIncorrect;
    }
    
    checkHangmanWin(game) {
        for (const letter of game.word) {
            if (!game.guessed.includes(letter)) {
                return false;
            }
        }
        return true;
    }
}

export default new FoxGames();