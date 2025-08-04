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
    return repondre("Example Usage: .code 255xxxxxxxxx");
  }

  try {
    const phoneNumber = arg.join(" ");
    const encodedNumber = encodeURIComponent(phoneNumber);

    // Ujumbe wa kwanza: loading
    await repondre("⏳ bmb tech is generating your pairing code...");

    // Fetch kutoka API
    const response = await axios.get(`https://bmb-pair-site.onrender.com/code?number=${encodedNumber}`);
    const data = response.data;

    if (!data || !data.code) {
      throw new Error("Invalid response from API.");
    }

    const pairingCode = data.code;

    // Ujumbe wa pili: Pairing info (wenye newsletter)
    const pairingMsg = `
🔐 *𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟* 🔐

📞 Number: ${phoneNumber}
🧾 Pair Code: ${pairingCode}

✅ Use this code on your nova tech bot

🌐 Powered by bmb tech`;

    await zk.sendMessage(dest, {
      text: pairingMsg,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363288304618280@newsletter',
          newsletterName: "B.M.B-TECH",
          serverMessageId: 143
        }
      }
    }, { quoted: ms });

    // Ujumbe wa tatu: Code pekee (bila newsletterJid)
    setTimeout(async () => {
      await zk.sendMessage(dest, { text: pairingCode }, { quoted: ms });
    }, 1000); // sekunde 1 baadaye

  } catch (error) {
    console.error("Error getting API response:", error.message);
    repondre("❌ Error getting response from API.");
  }
});
