const { exec } = require("child_process");
const { bmbtz } = require("../devbmb/bmbtz");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const {
  ajouterOuMettreAJourJid,
  mettreAJourAction,
  verifierEtatJid
} = require('../lib/antilien');
const {
  atbajouterOuMettreAJourJid,
  atbverifierEtatJid
} = require('../lib/antibot');
const { search, download } = require('aptoide-scraper');
const fs = require('fs-extra');
const conf = require("../settings");
const { default: axios } = require("axios");
const {
  getBinaryNodeChild,
  getBinaryNodeChildren
} = require("@whiskeysockets/baileys")['default'];

// ADD COMMAND
bmbtz({
  nomCom: 'add',
  categorie: "Group",
  reaction: '🪄'
}, async (_id, sock, data) => {
  let {
    repondre,
    verifAdmin,
    msgRepondu,
    infosGroupe,
    auteurMsgRepondu,
    verifGroupe,
    auteurMessage,
    superUser,
    idBot,
    arg
  } = data;

  if (!verifGroupe) return repondre("*This command works in groups only!*");
  if (!superUser) return repondre("You are too weak to do that");
  if (!verifAdmin) return repondre("You are not an admin here!");

  let metadata;
  try {
    metadata = await sock.groupMetadata(_id);
  } catch {
    return repondre("Failed to fetch group metadata.");
  }

  let participants = metadata.participants;
  if (!arg[0]) return repondre("Provide number to be added. Example:\nadd 254XXXX");

  let input = arg.join(" ");
  const currentJids = participants.map(p => p.id);
  let alreadyInGroup = [], toAdd = [];

  try {
    const checks = await Promise.all(
      input.split(',').map(x => x.replace(/\D/g, ''))
        .filter(n => n.length > 4 && n.length < 14)
        .map(async num => [num, await sock.onWhatsApp(num + "@s.whatsapp.net")])
    );

    checks.forEach(([num, result]) => {
      const jid = num + "@s.whatsapp.net";
      if (currentJids.includes(jid)) alreadyInGroup.push(jid);
      else if (result[0]?.exists) toAdd.push(num + "@c.us");
    });
  } catch {
    return repondre("Error validating phone numbers.");
  }

  alreadyInGroup.forEach(jid => repondre("That user is already in this group!"));

  let addRes;
  try {
    if (toAdd.length > 0) {
      addRes = await sock.query({
        tag: 'iq',
        attrs: { type: 'settings', xmlns: "w:g2", to: _id },
        content: toAdd.map(jid => ({
          tag: "add",
          attrs: {},
          content: [{ tag: "participant", attrs: { jid } }]
        }))
      });
      for (const jid of toAdd) {
        repondre("Successfully added @" + jid.split('@')[0]);
      }
    }
  } catch {
    return repondre("Failed to add user to the group!");
  }

  let profilePic;
  try {
    profilePic = await sock.profilePictureUrl(_id, "image").catch(() =>
      "https://i.ibb.co/n6rw805/694affc7ca5a5fb0cb58c2b4533f962d.jpg"
    );
  } catch {
    profilePic = "https://i.ibb.co/n6rw805/694affc7ca5a5fb0cb58c2b4533f962d.jpg";
  }

  const failList = addRes?.content?.find(x => x.tag === "add")?.content?.filter(x => x.attrs.error == 403);
  let inviteCode;
  try {
    inviteCode = await sock.groupInviteCode(_id);
  } catch {
    return repondre("Failed to generate group invite code.");
  }

  for (const failed of failList || []) {
    const jid = failed.attrs.jid;
    const code = failed.content.find(c => c.tag === "add_request")?.attrs.code;
    const expiration = failed.content.find(c => c.tag === "add_request")?.attrs.expiration;

    await repondre("I cannot add @" + jid.split('@')[0] + " due to privacy settings, Let me send an invite link instead.");
    await sock.sendMessage(jid, {
      image: { url: profilePic },
      caption: `You have been invited to join the group ${metadata.subject}:\n\nhttps://chat.whatsapp.com/${inviteCode}\n\n*POWERED BY 𝗕.𝗠.𝗕-𝗧𝗘𝗖𝗛*`
    }, { quoted: msgRepondu });
  }
});

// REJECT COMMAND
bmbtz({
  nomCom: "reject",
  aliases: ["rejectall", "rej", "reject-all"],
  categorie: "Group",
  reaction: '😇'
}, async (_id, sock, data) => {
  const { repondre, verifGroupe, verifAdmin } = data;

  if (!verifGroupe) return repondre("This command works in groups only");
  if (!verifAdmin) return repondre("You are not an admin here!");

  const pending = await sock.groupRequestParticipantsList(_id);
  if (pending.length === 0) return repondre("There are no pending join requests for this group.");

  for (const user of pending) {
    await sock.groupRequestParticipantsUpdate(_id, [user.jid], "reject");
  }

  repondre("All pending join requests have been rejected.");
});

// APPROVE COMMAND
bmbtz({
  nomCom: 'approve',
  aliases: ["approve-all", "accept"],
  categorie: "Group",
  reaction: '🔎'
}, async (_id, sock, data) => {
  const { repondre, verifGroupe, verifAdmin } = data;

  if (!verifGroupe) return repondre("This command works in groups only");
  if (!verifAdmin) return repondre("You are not an admin here!");

  const pending = await sock.groupRequestParticipantsList(_id);
  if (pending.length === 0) return repondre("There are no pending join requests.");

  for (const user of pending) {
    await sock.groupRequestParticipantsUpdate(_id, [user.jid], 'approve');
  }

  repondre("All pending participants have been approved to join by popkid md.");
});

// VCF COMMAND
bmbtz({
  nomCom: "vcf",
  aliases: ["savecontact", "savecontacts"],
  categorie: "Group",
  reaction: '♻️'
}, async (_id, sock, data) => {
  const { repondre, verifGroupe, verifAdmin, ms } = data;
  const fs = require('fs');

  if (!verifAdmin) return repondre("You are not an admin here!");
  if (!verifGroupe) return repondre("This command works in groups only");

  try {
    const meta = await sock.groupMetadata(_id);
    const members = meta.participants;
    let vcfData = '';

    for (let member of members) {
      let num = member.id.split('@')[0];
      let name = member.name || member.notify || "[B.M.B-TECH] +" + num;
      vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD\n`;
    }

    repondre(`A moment, *B.M.B-TECH* is compiling ${members.length} contacts into a vcf...`);
    fs.writeFileSync("./contacts.vcf", vcfData.trim());
    await sock.sendMessage(_id, {
      document: fs.readFileSync("./contacts.vcf"),
      mimetype: "text/vcard",
      fileName: meta.subject + '.Vcf',
      caption: `VCF for ${meta.subject}\nTotal Contacts: ${members.length}\n*𝚃𝙷𝙰𝙽𝙺𝚂 𝙵𝙾𝚁 𝚄𝚂𝙸𝙽𝙶 𝙱.𝙼.𝙱-𝚃𝙴𝙲𝙷*`
    }, {
      ephemeralExpiration: 86400,
      quoted: ms
    });
    fs.unlinkSync('./contacts.vcf');
  } catch (err) {
    console.error("Error while creating or sending VCF:", err.message || err);
    repondre("An error occurred while creating or sending the VCF. Please try again.");
  }
});

// INVITE COMMAND
bmbtz({
  nomCom: 'invite',
  aliases: ["link"],
  categorie: 'Group',
  reaction: '🪄'
}, async (_id, sock, data) => {
  const { repondre, nomGroupe, nomAuteurMessage, verifGroupe } = data;

  if (!verifGroupe) return repondre("*This command works in groups only!*");

  try {
    const code = await sock.groupInviteCode(_id);
    const inviteLink = `https://chat.whatsapp.com/${code}`;
    const msg = `Hello ${nomAuteurMessage}, here is the group link of ${nomGroupe}:\n\nClick Here To Join: ${inviteLink}`;
    repondre(msg);
  } catch (err) {
    console.error("Error fetching group invite link:", err.message || err);
    repondre("An error occurred while fetching the group invite link. Please try again.");
  }
});

// REVOKE COMMAND
bmbtz({
  nomCom: 'revoke',
  categorie: 'Group'
}, async (_id, sock, data) => {
  const { arg, repondre, verifGroupe, verifAdmin } = data;

  if (!verifAdmin) return repondre("for admins.");
  if (!verifGroupe) return repondre("This command is only allowed in groups.");

  await sock.groupRevokeInvite(_id);
  repondre("group link revoked.");
});
