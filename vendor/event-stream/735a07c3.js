// AutoRecordType — toggles autorecording + autotyping together
import recordingCmd from './4b209047.js';
import typingCmd from '../proto-util/b55d9dff.js';

export default {
    name: 'autorecordtype',
    alias: ['recordtype', 'typingrecord', 'art'],
    category: 'owner',
    description: 'Turn autorecording and autotyping on or off at the same time',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;

        if (!jidManager.isOwner(m)) {
            return await sock.sendMessage(chatId, { react: { text: '👑', key: m.key } });
        }

        const arg = (args[0] || '').toLowerCase();

        if (!['on', 'off'].includes(arg)) {
            return await sock.sendMessage(chatId, {
                text:
`┌─⧭ *FOXY AUTO-RECORD-TYPE* 🎤⌨️ ⧭─┐
│
├─⧭ Toggles autorecording AND autotyping together
│
├─⧭ *Commands:*
│ • ${PREFIX}autorecordtype on
│ • ${PREFIX}autorecordtype off
│
└─⧭🦊`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: arg === 'on' ? '✅' : '❌', key: m.key } });
        await sock.sendMessage(chatId, {
            text: `⏳ Turning ${arg.toUpperCase()} both autorecording and autotyping...`
        }, { quoted: m });

        await recordingCmd.execute(sock, m, [arg], PREFIX, extra);
        await typingCmd.execute(sock, m, [arg], PREFIX, extra);
    }
};
