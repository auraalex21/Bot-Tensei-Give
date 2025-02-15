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
  ],
});

client.commands = new Collection();

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
            console.log(`👌 Commande chargée : ${command.data.name}`);
          } else {
            console.error(
              `❌ La commande dans ${filePath} n'a pas de nom défini.`
            );
          }
        })
        .catch((error) => {
          console.error(
            `❌ Erreur lors du chargement de la commande ${filePath} :`,
            error
          );
        });
    }
  }
};

loadCommands(path.resolve(__dirname, "./commands"));

client.once("ready", async () => {
  console.log(`Prêt en tant que ${client.user.tag}`);

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

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
