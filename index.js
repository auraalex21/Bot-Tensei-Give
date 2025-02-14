const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const synchronizeSlashCommands = require("discord-sync-commands");

// Init discord giveaways
const { GiveawaysManager } = require("discord-giveaways");
client.giveawaysManager = new GiveawaysManager(client, {
  storage: "./giveaways.json",
  default: {
    botsCanWin: false,
    embedColor: "#FF0000",
    reaction: "🎉",
    lastChance: {
      enabled: true,
      content: "⚠️ **DERNIÈRE CHANCE POUR PARTICIPER !** ⚠️",
      threshold: 10000,
      embedColor: "#FF0000",
    },
  },
});
// We now have a client.giveawaysManager property to manage our giveaways!

client.giveawaysManager.on(
  "giveawayReactionAdded",
  (giveaway, member, reaction) => {
    console.log(
      `${member.user.tag} a participé au tirage au sort #${giveaway.messageId} (${reaction.emoji.name})`
    );
  }
);

client.giveawaysManager.on(
  "giveawayReactionRemoved",
  (giveaway, member, reaction) => {
    console.log(
      `${member.user.tag} a retiré sa réaction du tirage au sort #${giveaway.messageId} (${reaction.emoji.name})`
    );
  }
);

client.giveawaysManager.on("giveawayEnded", (giveaway, winners) => {
  console.log(
    `Le tirage au sort #${giveaway.messageId} est terminé ! Gagnants : ${winners
      .map((member) => member.user.username)
      .join(", ")}`
  );
});

/* Load all commands */
client.commands = new Collection();

const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith(".js")) {
      const command = require(path.resolve(filePath));
      if (command.data) {
        client.commands.set(command.data.name, command);
        console.log(`👌 Commande chargée : ${command.data.name}`);
      } else {
        console.error(`❌ La commande dans ${filePath} n'a pas de nom défini.`);
      }
    }
  }
};

loadCommands(path.resolve("./commands"));

synchronizeSlashCommands(
  client,
  client.commands.map((c) => c.data.toJSON()),
  {
    debug: true,
    guildId: process.env.GUILD_ID,
  }
);

/* Load all events */
fs.readdir("./events/", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(path.resolve(`./events/${file}`));
    let eventName = file.split(".")[0];
    console.log(`👌 Événement chargé : ${eventName}`);
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(path.resolve(`./events/${file}`))];
  });
});

// Login
client.once("ready", () => {
  console.log(`Prêt en tant que ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
