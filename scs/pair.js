const { bmbtz } = require('../devbmb/bmbtz');
const axios = require('axios');

bmbtz({
  nomCom: "pair",
  aliases: ["session", "code", "paircode", "qrcode"],
  reaction: '☘️',
  categorie: 'system'
}, async (dest, zk, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;

  if (!arg || arg.length === 0) {
    return repondre("Example Usage: .code 2541111xxxxx.");
  }

  try {
    await repondre("Queen-M is generating your pairing code ✅...");

    const encodedNumber = encodeURIComponent(arg.join(" "));
    const response = await axios.get(`https://bmb-pair-site.onrender.com/code?number=${encodedNumber}`);
    const data = response.data;

    if (data && data.code) {
      const pairingCode = data.code;

      // Tuma kwanza PAIR CODE yenye context ya newsletter
      await zk.sendMessage(dest, {
        text: pairingCode,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363288304618280@newsletter',
            newsletterName: "Queen-M",
            serverMessageId: 143
          },
          forwardingScore: 999
        }
      }, { quoted: ms });

      // Kisha tuma PICHA PEKE YAKE bila contextInfo
      await zk.sendMessage(dest, {
        image: { url: 'https://files.catbox.moe/7tmps9.jpg' },
        caption: "Scan this image if required to pair manually."
      }, { quoted: ms });

      await repondre("Here is your pair code, copy and paste it above or use the image if needed.");
    } else {
      throw new Error("Invalid response from API.");
    }

  } catch (error) {
    console.error("Error getting API response:", error.message);
    repondre("❌ Error getting response from API.");
  }
});
