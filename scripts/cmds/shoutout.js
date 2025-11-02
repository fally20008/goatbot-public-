module.exports = {
  config: {
    name: "shoutout",
    version: "1.0",
    author: "Camille 💙",
    role: 0,
    description: { en: "Give a shoutout to a member" },
    category: "fun",
    guide: { en: "{pn} <@user> [message]" }
  },

  onStart: async ({ args, message, event, usersData, api }) => {
    if (!args[0]) return message.reply("❌ Please mention a user to give a shoutout.");

    // Récupération de l'utilisateur mentionné
    const mentions = Object.keys(event.mentions);
    if (!mentions.length) return message.reply("❌ Please mention a valid user.");

    const userID = mentions[0];
    const userName = await usersData.getName(userID);
    const shoutMessage = args.slice(1).join(" ") || "Keep up the good work! ⚡";

    const msg = `╔════[ BLUE LOCK SHOUTOUT ]════╗
║ 🔥 @${userName} !
║ ${shoutMessage}
╚═════════════════════════════╝`;

    await message.reply({ body: msg, mentions: [{ id: userID, tag: userName }] });
  }
};
