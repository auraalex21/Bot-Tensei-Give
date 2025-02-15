import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import synchronizeSlashCommands from "discord-sync-commands";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 📌 CHARGEMENT AUTOMATIQUE DES COMMANDES
const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith(".js")) {
      import(pathToFileURL(filePath).href)
        .then((command) => {
          if (command.data) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Commande chargée : ${command.data.name}`);
          }
        })
        .catch((error) =>
          console.error(`❌ Erreur chargement commande ${filePath} :`, error)
        );
    }
  }
};

const registeredEvents = new Set();

const loadEvents = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file.endsWith(".js")) {
      import(pathToFileURL(filePath).href)
        .then((event) => {
          if (event.default && typeof event.default.execute === "function") {
            const eventName = event.default.name;
            if (!registeredEvents.has(eventName)) {
              console.log(`👌 Événement chargé : ${eventName}`);
              client.on(eventName, (...args) =>
                event.default.execute(client, ...args)
              );
              registeredEvents.add(eventName);
            } else {
              console.warn(`⚠️ Événement déjà enregistré : ${eventName}`);
            }
          } else {
            console.error(
              `❌ Erreur : L'événement ${filePath} n'a pas de fonction 'execute' valide.`
            );
          }
        })
        .catch((error) => {
          console.error(
            `❌ Erreur lors du chargement de l'événement ${filePath} :`,
            error
          );
        });
    }
  }
};

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(pathToFileURL(filePath).href);
  if (event.default && typeof event.default.execute === "function") {
    if (event.default.once) {
      client.once(event.default.name, (...args) =>
        event.default.execute(client, ...args)
      );
    } else {
      client.on(event.default.name, (...args) =>
        event.default.execute(client, ...args)
      );
    }
  } else {
    console.error(
      `❌ Erreur : L'événement ${filePath} n'a pas de fonction 'execute' valide.`
    );
  }
}

loadCommands(path.resolve(__dirname, "./commands"));
loadEvents(path.resolve(__dirname, "./events"));

client.once("ready", async () => {
  console.log(`Prêt en tant que ${client.user.tag}`);
  const { GiveawaysManager } = await import("discord-giveaways");

  client.giveawaysManager = new GiveawaysManager(client, {
    storage: path.resolve(__dirname, "./giveaways.json"),
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
      `Le tirage au sort #${
        giveaway.messageId
      } est terminé ! Gagnants : ${winners
        .map((member) => member.user.username)
        .join(", ")}`
    );
  });

  // Vérifiez si le bot est présent dans la guilde
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error(
      `❌ Le bot n'est pas présent dans la guilde avec l'ID ${process.env.GUILD_ID}`
    );
  } else {
    console.log(`✅ Le bot est présent dans la guilde : ${guild.name}`);
  }

  // Vérifiez si le bot a les permissions nécessaires
  const botMember = guild.members.cache.get(client.user.id);
  if (!botMember.permissions.has("ADMINISTRATOR")) {
    console.error(
      "❌ Le bot n'a pas les permissions administratives nécessaires."
    );
  } else {
    console.log("✅ Le bot a les permissions administratives nécessaires.");
  }

  // Synchroniser les commandes
  try {
    await synchronizeSlashCommands(
      client,
      client.commands.map((c) => c.data.toJSON()),
      {
        debug: true,
        guildId: process.env.GUILD_ID,
      }
    );
    console.log("✅ Commandes synchronisées avec succès.");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la synchronisation des commandes :",
      error
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
