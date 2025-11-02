const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

module.exports = {
  config: {
    name: "callad",
    version: "2.0",
    author: "Camille 💙",
    countDown: 5,
    role: 0,
    description: {
      en: "Send report, feedback, bug,... to admin bot"
    },
    category: "utility",
    guide: { en: "{pn} <message>" }
  },

  langs: {
    en: {
      missingMessage: "❌ Please enter the message you want to send to admin",
      noAdmin: "⚠️ Bot has no admin at the moment",
      success: "✅ Your message was sent successfully to %1 admin(s):\n%2",
      failed: "❌ Failed to send your message to %1 admin(s):\n%2\nCheck console for details",
      replyUserSuccess: "📤 Your reply was sent to the user successfully!",
      replySuccess: "📤 Your reply was sent to the admin successfully!",
      sendByGroup: "\n🏟️ Sent from group: %1\n- Thread ID: %2",
      sendByUser: "\n👤 Sent from user",
      content: "\n📝 Content:\n─────────────────\n%1\n─────────────────\nReply to this message to respond",
      reply: "📍 Reply from admin %1:\n─────────────────\n%2\n─────────────────\nReply to this message to continue sending message to admin",
      feedback: "📬 Feedback from user %1:\n- User ID: %2%3\n\n📝 Content:\n─────────────────\n%4\n─────────────────\nReply this message to respond to user"
    }
  },

  onStart: async function({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
    const { config } = global.GoatBot;
    if (!args[0]) return message.reply(getLang("missingMessage"));
    const { senderID, threadID, isGroup } = event;
    if (config.adminBot.length === 0) return message.reply(getLang("noAdmin"));

    const senderName = await usersData.getName(senderID);
    const threadName = isGroup ? (await threadsData.get(threadID)).threadName : null;

    const header = `╔════════════════════╗\n║ ⚽ BLUE LOCK REPORT ⚽ ║\n╠════════════════════╣\n`;
    const userInfo = `💌 From: ${senderName}\n👤 User ID: ${senderID}${isGroup ? getLang("sendByGroup", threadName, threadID) : getLang("sendByUser")}\n`;
    const content = getLang("content", args.join(" "));
    const formMessage = {
      body: header + userInfo + content + "\n╚════════════════════╝",
      mentions: [{ id: senderID, tag: senderName }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])].filter(a => mediaTypes.includes(a.type))
      )
    };

    const successIDs = [];
    const failedIDs = [];
    const adminNames = await Promise.all(config.adminBot.map(async id => ({ id, name: await usersData.getName(id) })));

    for (const uid of config.adminBot) {
      try {
        const messageSend = await api.sendMessage(formMessage, uid);
        successIDs.push(uid);
        global.GoatBot.onReply.set(messageSend.messageID, {
          commandName,
          messageID: messageSend.messageID,
          threadID,
          messageIDSender: event.messageID,
          type: "userCallAdmin"
        });
      } catch (err) {
        failedIDs.push({ adminID: uid, error: err });
      }
    }

    let msg2 = "";
    if (successIDs.length) {
      msg2 += getLang("success", successIDs.length,
        adminNames.filter(a => successIDs.includes(a.id)).map(a => ` <@${a.id}> (${a.name})`).join("\n")
      );
    }
    if (failedIDs.length) {
      msg2 += "\n" + getLang("failed", failedIDs.length,
        failedIDs.map(a => ` <@${a.adminID}> (${adminNames.find(x => x.id === a.adminID)?.name || a.adminID})`).join("\n")
      );
      log.err("CALL ADMIN", failedIDs);
    }

    return message.reply({
      body: msg2,
      mentions: adminNames.map(a => ({ id: a.id, tag: a.name }))
    });
  },

  onReply: async function({ args, event, api, message, Reply, usersData, commandName, getLang }) {
    const { type, threadID, messageIDSender } = Reply;
    const senderName = await usersData.getName(event.senderID);
    const isGroup = event.isGroup;

    switch(type) {
      case "userCallAdmin": {
        const formMessage = {
          body: `╔════════════════════╗\n║ 📍 Reply from ${senderName} ║\n╠════════════════════╣\n${args.join(" ")}\n╚════════════════════╝`,
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(event.attachments.filter(a => mediaTypes.includes(a.type)))
        };
        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err) return message.err(err);
          message.reply(getLang("replyUserSuccess"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID,
            type: "adminReply"
          });
        }, messageIDSender);
        break;
      }
      case "adminReply": {
        let sendByGroup = "";
        if (isGroup) {
          const { thread
