import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import synchronizeSlashCommands from "discord-sync-commands";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";
import ms from "ms";

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
const db = new QuickDB();

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

const reloadGiveaways = async () => {
  const giveaways = await db.all();
  for (const { id, value } of giveaways) {
    if (id.startsWith("giveaway_")) {
      const giveawayData = value;
      const remainingTime = giveawayData.endTime - Date.now();
      if (remainingTime > 0) {
        const giveawayChannel = client.channels.cache.get(id.split("_")[1]);
        if (giveawayChannel) {
          const message = await giveawayChannel.messages.fetch(
            giveawayData.messageId
          );
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("participate")
              .setLabel("Participer")
              .setStyle(ButtonStyle.Primary)
          );

          const updateCanvas = async (winners = [], finished = false) => {
            const remainingTime = Math.max(
              0,
              giveawayData.endTime - Date.now()
            );

            const width = 800;
            const height = 300;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#0A192F");
            gradient.addColorStop(1, "#001F3F");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 8;
            ctx.roundRect(10, 10, width - 20, height - 20, 20);
            ctx.stroke();

            ctx.font = "bold 32px Arial";
            ctx.fillStyle = "#FFD700";
            ctx.fillText(`🎉 Giveaway Démarré`, 50, 60);

            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#FFFFFF";
            if (finished) {
              ctx.fillText(`🎉 Giveaway Terminé`, 50, 120);
              ctx.fillText(`🏆 Gagnants: ${winners.join(", ")}`, 50, 160);
              ctx.fillText(
                `⏰ Fin: ${new Date(giveawayData.endTime).toLocaleString()}`,
                50,
                200
              );
            } else {
              ctx.fillText(
                `⏳ Temps restant: ${ms(remainingTime, { long: true })}`,
                50,
                120
              );
              ctx.fillText(
                `👥 Participants: ${giveawayData.participants.length}`,
                50,
                160
              );
              ctx.fillText(`🎁 Prix: ${giveawayData.prize}`, 50, 200);
              ctx.fillText(
                `🏆 Nombre de gagnants: ${giveawayData.winnerCount}`,
                50,
                240
              );
            }

            const buffer = canvas.toBuffer();
            return new AttachmentBuilder(buffer, { name: "giveaway.png" });
          };

          const collector = message.createMessageComponentCollector({
            time: remainingTime,
          });

          collector.on("collect", async (i) => {
            if (!giveawayData.participants.includes(i.user.id)) {
              giveawayData.participants.push(i.user.id);
              await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);
              if (!i.replied && !i.deferred) {
                await i.reply({
                  content: "🎉 Vous avez été ajouté au giveaway !",
                  flags: 64,
                });
              }
            } else {
              if (!i.replied && !i.deferred) {
                await i.reply({
                  content: "❌ Vous êtes déjà inscrit à ce giveaway.",
                  flags: 64,
                });
              }
            }
          });

          collector.on("end", async () => {
            if (giveawayData.participants.length === 0) {
              await giveawayChannel.send({
                files: [await updateCanvas([], true)],
              });
              return;
            }

            const winners = [];
            for (let i = 0; i < giveawayData.winnerCount; i++) {
              const winnerIndex = Math.floor(
                Math.random() * giveawayData.participants.length
              );
              const winnerId = giveawayData.participants.splice(
                winnerIndex,
                1
              )[0];
              winners.push(`<@${winnerId}>`);
            }

            await message.edit({ files: [await updateCanvas(winners, true)] });
          });

          const interval = setInterval(async () => {
            if (Date.now() >= giveawayData.endTime) {
              clearInterval(interval);
              return;
            }
            await message.edit({ files: [await updateCanvas()] });
          }, 1000);

          console.log(`✅ Giveaway reloaded in ${giveawayChannel.name}`);
        }
      }
    }
  }
};

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

  // Reload active giveaways
  await reloadGiveaways();
});

client.login(process.env.DISCORD_TOKEN);
