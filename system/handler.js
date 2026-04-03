import { canUseBot } from './configHelper.js';

// Import commands
import mode from './commands/mode.js';
import location from './commands/location.js';
import addsudo from './commands/addsudo.js';
import delsudo from './commands/delsudo.js';
import setmenuimage from './commands/setmenuimage.js';
import sudolist from './commands/sudolist.js';
import menuinfo from './commands/menuinfo.js';
import botinfo from './commands/botinfo.js';
import help from './commands/help.js';

const commands = { 
  mode, location, addsudo, delsudo, 
  setmenuimage, sudolist, menuinfo, 
  botinfo, help 
};

export async function handleMessage(client, msg) {
  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  if (!body.startsWith('.')) return;
  
  const args = body.slice(1).trim().split(' ');
  const cmd = args.shift().toLowerCase();
  const userNumber = (msg.key.participant || msg.key.remoteJid).split('@')[0];
  const jid = msg.key.remoteJid;
  
  // Check private mode
  const canUse = await canUseBot(userNumber);
  if (!canUse) {
    return await client.sendMessage(jid, {
      text: `🚫 Bot is in private mode. Contact owner: 254751228167`
    });
  }
  
  // Find command
  for (const cmdObj of Object.values(commands)) {
    if (cmdObj.name === cmd || cmdObj.alias?.includes(cmd)) {
      try {
        await cmdObj.execute(client, msg, args);
        return;
      } catch (error) {
        console.error(`Command ${cmd} error:`, error);
        await client.sendMessage(jid, { text: `❌ Error: ${error.message}` });
        return;
      }
    }
  }
}