// Truth or Dare — tod command
const TRUTHS = [
    "What's the most embarrassing thing you've done in public?",
    "Have you ever lied to get out of trouble? What was the lie?",
    "What's the weirdest dream you've ever had?",
    "Have you ever blamed someone else for something you did?",
    "What's the most childish thing you still do?",
    "Have you ever cheated on a test or game?",
    "What's the longest you've gone without showering?",
    "Have you ever sent a message to the wrong person?",
    "What's the most embarrassing thing in your phone right now?",
    "Have you ever talked bad about someone in this group?",
    "What's your biggest fear that nobody knows about?",
    "Have you ever pretended to be sick to avoid something?",
    "What's the most cringe thing you did as a kid?",
    "Have you ever ghosted someone? Who?",
    "What's a lie you told your parents that they still believe?",
    "Have you ever walked into a room and forgotten why?",
    "What's the most embarrassing thing your parents have caught you doing?",
    "Have you ever stalked someone's social media for hours?",
    "What's the pettiest reason you've ever been mad at someone?",
    "Have you ever eaten food off the floor?",
    "What song do you secretly love but would never admit?",
    "Have you ever laughed at the wrong moment?",
    "What's your most used emoji and what does that say about you?",
    "Have you ever pretended to laugh when you didn't find something funny?",
    "What's the strangest thing you've ever googled?",
    "Have you ever eavesdropped on a private conversation?",
    "What habit of yours would embarrass you most if people knew?",
    "Have you ever lied about your age?",
    "What's the most desperate thing you've done for attention?",
    "Have you ever faked a phone call to avoid talking to someone?",
];

const DARES = [
    "Send a voice note saying 'I am the greatest' in the most dramatic way possible.",
    "Change your WhatsApp status to 'I love soap operas' for 10 minutes.",
    "Send a GIF of a chicken to the last person you texted.",
    "Type a full sentence using only your nose emoji — no corrections.",
    "Send a voice note of you doing your best robot impression.",
    "Write a haiku about the person who dared you.",
    "Send the 5th photo from your gallery right now — no editing.",
    "Text someone outside this chat 'Are you a parking ticket? Because you've got fine written all over you.'",
    "Send a voice note of you singing happy birthday in the worst voice possible.",
    "Do 20 jumping jacks and send proof with a voice note counting out loud.",
    "Change your profile picture to a cartoon for 15 minutes.",
    "Send a compliment to every person in this chat.",
    "Talk in rhymes for the next 3 messages you send.",
    "Send a voice note of you doing your best villain laugh.",
    "Write a 2-sentence love story using only emojis.",
    "Say something nice about the person above you in the chat.",
    "Send a voice note where you speak with a random accent for 30 seconds.",
    "Post your most embarrassing selfie (your choice of which one).",
    "Describe your personality in 3 emojis only.",
    "Send a voice note of you beatboxing for 15 seconds.",
    "Type a paragraph with your eyes closed — no corrections.",
    "Send a meme that describes your life right now.",
    "Text your mom 'I just saw a UFO' and show the group her reply.",
    "Send a voice note of you saying your own name backwards 5 times fast.",
    "Speak backwards for your next 2 messages.",
    "Send a voice note of you telling the worst joke you know.",
    "Describe what you're wearing right now in the most poetic way possible.",
    "Do your best impression of a news anchor in a voice note.",
    "Send a voice note of you sneezing dramatically three times.",
    "Write an advertisement selling the last thing you ate.",
];

export default {
    name: 'tod',
    alias: ['truthordare', 'dare', 'tod'],
    category: 'games',
    description: 'Play Truth or Dare — random or choose your fate',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const arg    = (args[0] || '').toLowerCase();

        // Determine mode
        let mode;
        if (arg === 'truth' || arg === 't') {
            mode = 'truth';
        } else if (arg === 'dare' || arg === 'd') {
            mode = 'dare';
        } else {
            // Random
            mode = Math.random() < 0.5 ? 'truth' : 'dare';
        }

        // Optional @mention target
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target    = mentioned && mentioned[0];
        const targetStr = target ? `@${target.replace(/@.+/, '')}` : null;

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        let content, headerEmoji, headerLabel, reactEmoji;

        if (mode === 'truth') {
            content    = pick(TRUTHS);
            headerEmoji  = '🔮';
            headerLabel  = 'TRUTH';
            reactEmoji   = '🔮';
        } else {
            content    = pick(DARES);
            headerEmoji  = '🎯';
            headerLabel  = 'DARE';
            reactEmoji   = '🎯';
        }

        const targetLine = targetStr
            ? `┃ 🎯 *For:* ${targetStr}\n`
            : '';

        await sock.sendMessage(chatId, { react: { text: reactEmoji, key: m.key } });

        return await sock.sendMessage(chatId, {
            text:
`╭━━━〔${headerEmoji} *TRUTH OR DARE* 〕━━━╮
┃
┃ 🃏 *Type:* ${headerLabel}
${targetLine}┃
┃ ❝ ${content} ❞
┃
┃ ─────────────────────
┃ 💡 *${PREFIX}tod* — random
┃ 💡 *${PREFIX}tod truth* — truth only
┃ 💡 *${PREFIX}tod dare* — dare only
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
            mentions: target ? [target] : []
        }, { quoted: m });
    }
};
