const { bmbtz } = require('../devbmb/bmbtz');
const axios = require("axios")
let { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("../lib/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("../lib/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("../lib/onlyAdmin");
const {removeSudoNumber,addSudoNumber,issudo} = require("../lib/sudo");
//const conf = require("../settings");
//const fs = require('fs');
const sleep =  (ms) =>{
  return new Promise((resolve) =>{ setTimeout (resolve, ms)})
  
  } ;

bmbtz({ nomCom: "crew", categorie: "Mods" }, async (dest, zk, commandeOptions) => {
  const { ms, repondre, arg, auteurMessage, superUser, auteurMsgRepondu, msgRepondu } = commandeOptions;

  if (!superUser) { repondre("only modds can use this command"); return };

  if (!arg[0]) { repondre('Please enter the name of the group to create'); return };
  if (!msgRepondu) { repondre('Please mention a member added '); return; }

  const name = arg.join(" ")

  const group = await zk.groupCreate(name, [auteurMessage, auteurMsgRepondu])
  console.log("created group with id: " + group.gid)
  zk.sendMessage(group.id, { text: `Bienvenue dans ${name}` })

});

bmbtz({ nomCom: "left", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { ms, repondre, verifGroupe, msgRepondu, verifAdmin, superUser, auteurMessage } = commandeOptions;
  if (!verifGroupe) { repondre("group only"); return };
  if (!superUser) {
    repondre("order reserved for the owner");
    return;
  }

  await zk.groupLeave(dest)
});

bmbtz({ nomCom: "join", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { arg, ms, repondre, verifGroupe, msgRepondu, verifAdmin, superUser, auteurMessage } = commandeOptions;

  if (!superUser) {
    repondre("command reserved for the bot owner");
    return;
  }
  let result = arg[0].split('https://chat.whatsapp.com/')[1] ;
 await zk.groupAcceptInvite(result) ;
  
      repondre(`Succes`).catch((e)=>{
  repondre('Unknown error')
})

})


bmbtz({ nomCom: "jid", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { arg, ms, repondre, verifGroupe, msgRepondu, verifAdmin, superUser, auteurMessage,auteurMsgRepondu } = commandeOptions;

         if (!superUser) {
    repondre("command reserved for the bot owner");
    return;
  }
              if(!msgRepondu) {
                jid = dest
              } else {
                jid = auteurMsgRepondu
              } ;
   zk.sendMessage(dest,{text : jid },{quoted:ms});

        }) ;

  

bmbtz({ nomCom: "block", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { arg, ms, repondre, verifGroupe, msgRepondu, verifAdmin, superUser, auteurMessage,auteurMsgRepondu } = commandeOptions;

         if (!superUser) {
    repondre("command reserved for the bot owner");
    return;
  }
             
              if(!msgRepondu) { 
                if(verifGroupe) {
                  repondre('Be sure to mention the person to block'); return
                } ;
                jid = dest

                 await zk.updateBlockStatus(jid, "block")
    .then( repondre('succes')) 
              } else {
                jid = auteurMsgRepondu
             await zk.updateBlockStatus(jid, "block")
    .then( repondre('succes'))   } ;

  });

bmbtz({ nomCom: "unblock", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { arg, ms, repondre, verifGroupe, msgRepondu, verifAdmin, superUser, auteurMessage,auteurMsgRepondu } = commandeOptions;

         if (!superUser) {
    repondre("command reserved for the bot owner");
    return;
  }
              if(!msgRepondu) { 
                if(verifGroupe) {
                  repondre('Please mention the person to be unlocked'); return
                } ;
                jid = dest

                 await zk.updateBlockStatus(jid, "unblock")
    .then( repondre('succes')) 
              } else {
                jid = auteurMsgRepondu
             await zk.updateBlockStatus(jid, "unblock")
    .then( repondre('succes'))   } ;
  
    });

bmbtz({ nomCom: "kickall", categorie: 'Group', reaction: "📣" }, async (dest, zk, commandeOptions) => {

  const { auteurMessage ,ms, repondre, arg, verifGroupe, nomGroupe, infosGroupe, nomAuteurMessage, verifAdmin, superUser,prefixe } = commandeOptions

  const metadata = await zk.groupMetadata(dest) ;
 

  if (!verifGroupe) { repondre("✋🏿 ✋🏿this command is reserved for groups ❌"); return; }
  if (superUser || auteurMessage == metadata.owner) { 
  
   repondre('No_admin members will be removed from the group. You have 5 seconds to reclaim your choice by restarting the bot.') ;
   await sleep(5000)
  let membresGroupe = verifGroupe ? await infosGroupe.participants : "";
try {
  let users = membresGroupe.filter((member) => !member.admin)

  for (const membre of users) {

    

   
    
await zk.groupParticipantsUpdate(
        dest, 
        [membre.id],
        "remove" 
    ) 
    await sleep(500)
    
  }  
} catch (e) {repondre("I need administration rights")} } else {
  repondre("Order reserved for the group owner for security reasons"); return
}
});


bmbtz({ nomCom: "save", categorie: "Mods" }, async (dest, zk, commandeOptions) => {

  const { repondre , msgRepondu , superUser, auteurMessage } = commandeOptions;
  
    if ( superUser) { 
  
      if(msgRepondu) {

        console.log(msgRepondu) ;

        let msg ;
  
        if (msgRepondu.imageMessage) {
  
          
  
       let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.imageMessage) ;
       // console.log(msgRepondu) ;
       msg = {
  
         image : { url : media } ,
         caption : msgRepondu.imageMessage.caption,
         
       }
      
  
        } else if (msgRepondu.videoMessage) {
  
          let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.videoMessage) ;
  
          msg = {
  
            video : { url : media } ,
            caption : msgRepondu.videoMessage.caption,
            
          }
  
        } else if (msgRepondu.audioMessage) {
      
          let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.audioMessage) ;
         
          msg = {
     
            audio : { url : media } ,
            mimetype:'audio/mp4',
             }     
          
        } else if (msgRepondu.stickerMessage) {
  
      
          let media  = await zk.downloadAndSaveMediaMessage(msgRepondu.stickerMessage)
  
          let stickerMess = new Sticker(media, {
            pack: 'B.M.B-TECH',
            type: StickerTypes.CROPPED,
            categories: ["🤩", "🎉"],
            id: "12345",
            quality: 70,
            background: "transparent",
          });
          const stickerBuffer2 = await stickerMess.toBuffer();
         
          msg = { sticker: stickerBuffer2}
  
  
        }  else {
            msg = {
               text : msgRepondu.conversation,
            }
        }
  
      zk.sendMessage(auteurMessage,msg)
  
      } else { repondre('Mention the message that you want to save') }
  
  } else {
    repondre('only mods can use this command')
  }
  

  })
;
            
