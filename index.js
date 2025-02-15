import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
// @ts-ignore
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
      import(pathToFileURL(filePath).href).then((command) => {
        if (command.data) {
          client.commands.set(command.data.name, command);
          console.log(`👌 Commande chargée : ${command.data.name}`);
        } else {
          console.error(
            `❌ La commande dans ${filePath} n'a pas de nom défini.`
          );
        }
      });
    }
  }
};

loadCommands(path.resolve(__dirname, "./commands"));

synchronizeSlashCommands(
  client,
  client.commands.map((c) => c.data.toJSON()),
  {
    debug: true,
    guildId: process.env.GUILD_ID,
  }
)
  .then(() => {
    console.log("✅ Commandes synchronisées avec succès.");
  })
  .catch((error) => {
    console.error(
      "❌ Erreur lors de la synchronisation des commandes :",
      error
    );
  });

fs.readdir(path.resolve(__dirname, "./events/"), (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    import(
      pathToFileURL(path.resolve(__dirname, `./events/${file}`)).href
    ).then((event) => {
      let eventName = file.split(".")[0];
      console.log(`👌 Événement chargé : ${eventName}`);
      client.on(eventName, event.default.bind(null, client));
    });
  });
});

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

  // Forcer l'enregistrement des commandes si aucune n'est trouvée
  if (client.commands.size === 0) {
    console.log(
      "⚠️ Aucune commande trouvée, enregistrement forcé des commandes."
    );
    await client.application.commands.set([]);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    console.log(`Commande reçue : ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      try {
        await interaction.followUp({
          content: "Il y a eu une erreur en exécutant cette commande.",
          ephemeral: true,
        });
      } catch (followUpError) {
        console.error("Erreur lors de l'envoi du follow-up :", followUpError);
      }
    } else {
      try {
        await interaction.reply({
          content: "Il y a eu une erreur en exécutant cette commande.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error("Erreur lors de l'envoi de la réponse :", replyError);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
