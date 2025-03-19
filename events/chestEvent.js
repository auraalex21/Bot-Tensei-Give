import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");
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
          .setColor("#FFD700")
          .setThumbnail("https://example.com/chest.png") // Add a thumbnail image
          .setFooter({ text: "Dépêchez-vous avant qu'il ne disparaisse !" });

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
        await economyTable.set("chestMessageId", message.id); // Store the message ID
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

      if (interaction.customId === "open_chest") {
        const userId = interaction.user.id;
        const minAmount = 100;
        const maxAmount = 1000;
        const rewardAmount =
          Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

        console.log(
          `User ${userId} is opening the chest. Reward: ${rewardAmount}`
        );

        let balance = (await economyTable.get(`balance_${userId}`)) || 0;
        console.log(`Current balance for user ${userId}: ${balance}`);

        balance += rewardAmount;
        await economyTable.set(`balance_${userId}`, balance);
        console.log(`New balance for user ${userId}: ${balance}`);

        const embed = new EmbedBuilder()
          .setTitle("🎁 Coffre ouvert !")
          .setDescription(
            `🎉 ${interaction.user.username} a ouvert le coffre et a reçu **${rewardAmount}💸** !`
          )
          .setColor("#FFD700");

        const chestMessageId = await economyTable.get("chestMessageId");
        const channel = interaction.channel;

        if (chestMessageId && channel) {
          try {
            const message = await channel.messages.fetch(chestMessageId);
            if (message) {
              await message.edit({
                embeds: [embed],
                components: [], // Remove the button
              });
            }
          } catch (error) {
            console.error("Failed to edit chest message:", error);
          }
        }
      }
    });

    // Send the first chest immediately
    await sendChest();
  },
};
