// AutoRecordType — toggles autorecording + autotyping together
const path = require('path');

const recordingCmd = require(path.join(__dirname, '4b209047.js'));
const typingCmd    = require(path.join(__dirname, '../proto-util/b55d9dff.js'));

module.exports = {
    name: 'autorecordtype',
    alias: ['recordtype', 'typingrecord', 'art'],
    category: 'owner',
    description: 'Turn autorecording and autotyping on or off at the same time',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;

        if (!jidManager.isOwner(m)) {
            return await sock.sendMessage(chatId, {
                react: { text: '👑', key: m.key }
            });
        }

        const arg = (args[0] || '').toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
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

        // React first
        await sock.sendMessage(chatId, {
            react: { text: arg === 'on' ? '✅' : '❌', key: m.key }
        });

        await sock.sendMessage(chatId, {
            text: `⏳ Turning ${arg.toUpperCase()} both autorecording and autotyping...`
        }, { quoted: m });

        // Fire both sub-commands
        await recordingCmd.execute(sock, m, [arg], PREFIX, extra);
        await typingCmd.execute(sock, m, [arg], PREFIX, extra);
    }
};
