//====================//
// ⚽ Blue Lock PvP compact
// Auteur : Meguru Bachira
//====================//

const fs = require("fs");
const path = require("path");

// Création automatique du dossier et fichier
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const FILE = path.join(DATA_DIR, "bluelock.json");
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");

// Helpers
const load = () => JSON.parse(fs.readFileSync(FILE));
const save = d => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));

// Commande principale
module.exports = {
  config: {
    name: "bluelock",
    author: "Meguru Bachira",
    version: "2.0",
    role: 0,
    shortDescription: "Jeu Blue Lock PvP",
    longDescription: "Affronte d'autres joueurs et deviens le meilleur attaquant !",
    category: "🎮 Jeux",
    guide: "{p}bluelock pvp @joueur | stats"
  },

  onStart: async ({ api, event, args }) => {
    const data = load();
    const id = event.senderID;
    const name = event.senderName || "Joueur";

    if (!data[id]) data[id] = { name, xp: 0, rank: "D", wins: 0, energy: 5, coins: 50 };
    const p = data[id];
    const sub = args[0];
    const ranks = ["D","C","B","A","S"];

    // Stats joueur
    if (sub === "stats") return api.sendMessage(
      `⚽ ${p.name}\n📈 Rang: ${p.rank}\n⭐ XP: ${p.xp}\n🏅 Victoires: ${p.wins}\n⚡ Énergie: ${p.energy}\n💰 Coins: ${p.coins}`, 
      event.threadID
    );

    // PvP
    if (sub === "pvp") {
      const mention = Object.keys(event.mentions || {})[0];
      if (!mention) return api.sendMessage("⚠️ Mentionne un joueur à défier !", event.threadID);
      const opponent = mention;

      if (!data[opponent]) data[opponent] = { name: event.mentions[opponent], xp:0, rank:"D", wins:0, energy:5, coins:50 };
      const o = data[opponent];

      if (p.energy <= 0) return api.sendMessage("😴 Tu n’as plus d’énergie !", event.threadID);
      if (o.energy <= 0) return api.sendMessage(`${o.name} est trop fatigué pour jouer !`, event.threadID);

      p.energy--; o.energy--;

      // Tirage aléatoire du vainqueur
      const win = Math.random() < 0.5 ? id : opponent;
      const winner = data[win], loser = data[win===id?opponent:id];
      winner.wins++; winner.xp += 20; winner.coins += 15;
      loser.xp += 5;

      // Progression rang
      if (winner.xp >= 100) {
        const idx = ranks.indexOf(winner.rank);
        if (idx < ranks.length-1) winner.rank = ranks[idx+1];
        winner.xp = 0;
      }

      save(data);
      return api.sendMessage(
        `⚔️ Match Blue Lock !\n${p.name} vs ${o.name}\n🏆 Vainqueur : ${winner.name}\n📈 Rang : ${winner.rank}\n💰 +15 coins | ⚡ Énergie -1`, 
        event.threadID
      );
    }

    return api.sendMessage("⚽ Utilise : bluelock pvp @joueur | bluelock stats", event.threadID);
  }
};
