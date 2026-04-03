const FACTS = [
  "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
  "Octopuses have three hearts. Two pump blood to the gills, while the third pumps it to the rest of the body.",
  "A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.",
  "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
  "Bananas are berries, but strawberries aren't. In botanical terms, berries are defined by having seeds inside.",
  "The inventor of the microwave Percy Spencer got the idea when a chocolate bar melted in his pocket from radar waves.",
  "There are more possible iterations of a game of chess than there are atoms in the known universe.",
  "A group of flamingos is called a 'flamboyance'.",
  "The first computer virus was created in 1983 and was called the 'Elk Cloner'.",
  "The total weight of all the ants on Earth is about the same as the total weight of all the humans.",
  "WhatsApp was founded in 2009 by Jan Koum and Brian Acton, both former Yahoo employees.",
  "The first message ever sent over the internet was 'LO' – an attempt to send 'LOGIN' that crashed the system."
];

export default {
  name: "fact",
  alias: ["foxfact", "didyouknow"],
  description: "Get a random interesting fact",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
    
    const factMsg = `📚 *DID YOU KNOW?*\n\n` +
                   `${fact}\n\n` +
                   `💡 Another fact? Use ${PREFIX}fact again!`;
    
    return sock.sendMessage(jid, {
      text: factMsg
    }, { quoted: m });
  }
};