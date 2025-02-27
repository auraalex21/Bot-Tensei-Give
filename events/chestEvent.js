import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const chestChannelId = "1343256884982976512"; // Replace with your channel ID

const chestMessages = [
  "🎉 Félicitations {user}, vous avez trouvé un coffre rempli de trésors !",
  "✨ Incroyable {user}, vous avez ouvert un coffre magique !",
  "💎 Bravo {user}, vous avez découvert un coffre légendaire !",
  "🏆 Super {user}, vous avez mis la main sur un coffre rare !",
  "🎁 Génial {user}, vous avez trouvé un coffre surprise !",
];

export default {
  name: "chestEvent",
  async execute(client) {
    const sendChest = async () => {
      const channel = client.channels.cache.get(chestChannelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle("🎁 Un coffre est apparu !")
          .setDescription(
            "Cliquez sur le bouton ci-dessous pour ouvrir le coffre et recevoir une récompense."
          )
          .setColor("#FFD700");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_chest")
            .setLabel("Ouvrir")
            .setStyle(ButtonStyle.Primary)
        );

        const message = await channel.send({
          embeds: [embed],
          components: [row],
        });
        await db.set("chestMessageId", message.id); // Store the message ID
      }

      // Schedule the next chest spawn
      const minInterval = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
      const maxInterval = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const nextInterval =
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
        minInterval;
      setTimeout(sendChest, nextInterval);
    };

    // Send the first chest immediately
    await sendChest();

    client.on("messageCreate", async (message) => {
      if (message.content.toLowerCase() === "!openchest") {
        const userId = message.author.id;
        const guildId = message.guild.id;

        // Vérifiez si l'utilisateur a un coffre à ouvrir
        const chestKey = `chest_${guildId}_${userId}`;
        const hasChest = await db.get(chestKey);

        if (!hasChest) {
          return message.reply("❌ Vous n'avez pas de coffre à ouvrir.");
        }

        // Supprimez le coffre de l'utilisateur
        await db.delete(chestKey);

        // Sélectionnez un message personnalisé aléatoire
        const randomMessage =
          chestMessages[Math.floor(Math.random() * chestMessages.length)];

        // Remplacez {user} par le nom de l'utilisateur
        const personalizedMessage = randomMessage.replace(
          "{user}",
          message.author.username
        );

        // Envoyez le message personnalisé
        const embed = new EmbedBuilder()
          .setTitle("Coffre Ouvert !")
          .setDescription(personalizedMessage)
          .setColor("#FFD700");

        message.channel.send({ embeds: [embed] });
      }
    });
  },
};
