import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const chestChannelId = "1343256884982976512"; // Replace with your channel ID

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

    client.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    client.on("disconnect", () => {
      console.warn("WebSocket disconnected. Attempting to reconnect...");
      client.login(process.env.BOT_TOKEN); // Reconnect the bot
    });

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;
    });

    // Send the first chest immediately
    await sendChest();
  },
};
