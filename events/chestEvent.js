import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");
const nitroTable = db.table("nitro");
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
      //const minInterval = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
      //const maxInterval = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const minInterval = 10 * 1000; // 10 secondes en millisecondes
      const maxInterval = 10 * 1000; // 10 secondes en millisecondes
      const nextInterval =
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
        minInterval;
      setTimeout(sendChest, nextInterval);
    };

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "open_chest") {
        const userId = interaction.user.id;
        const randomChance = Math.random() * 100; // Generate a random number between 0 and 100
        let embed;

        if (randomChance <= 5) {
          // 5% chance to win a Nitro
          const nitroStock = (await nitroTable.get("stock")) || 0;
          const nitroCode = await nitroTable.get("code"); // Retrieve the Nitro code from the database
          if (nitroStock > 0 && nitroCode) {
            await nitroTable.set("stock", nitroStock - 1);
            await nitroTable.delete("code"); // Remove the used Nitro code from the database

            embed = new EmbedBuilder()
              .setTitle("🎉 Félicitations !")
              .setDescription(
                `🎁 ${interaction.user.username} a ouvert le coffre et a gagné un **Nitro** !`
              )
              .setColor("#00FF00");

            // Send a DM to the user with the Nitro code
            try {
              await interaction.user.send(
                `🎉 Félicitations ! Vous avez gagné un **Nitro** ! Voici votre code : **${nitroCode}**`
              );
            } catch (error) {
              console.error("Failed to send DM to the user:", error);
            }
          } else {
            embed = new EmbedBuilder()
              .setTitle("😢 Pas de chance...")
              .setDescription(
                `🎁 ${interaction.user.username} a ouvert le coffre, mais il n'y a plus de Nitro en stock.`
              )
              .setColor("#FF0000");
          }
        } else if (randomChance <= 50) {
          // 45% chance to win money
          const minAmount = 100;
          const maxAmount = 1000;
          const rewardAmount =
            Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

          let balance = (await economyTable.get(`balance_${userId}`)) || 0;
          balance += rewardAmount;
          await economyTable.set(`balance_${userId}`, balance);

          const winMessages = [
            `🎉 ${interaction.user.username} a gagné **${rewardAmount}💸** !`,
            `💰 Jackpot ! Vous avez reçu **${rewardAmount}💸** !`,
            `✨ Quelle chance ! Vous obtenez **${rewardAmount}💸** !`,
          ];
          const randomWinMessage =
            winMessages[Math.floor(Math.random() * winMessages.length)];

          embed = new EmbedBuilder()
            .setTitle("🎁 Coffre ouvert !")
            .setDescription(randomWinMessage)
            .setColor("#FFD700");
        } else {
          // 60% chance to lose
          const minLoss = 50;
          const maxLoss = 500;
          const lossAmount =
            Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;

          let balance = (await economyTable.get(`balance_${userId}`)) || 0;
          balance = Math.max(0, balance - lossAmount); // Ensure balance doesn't go below 0
          await economyTable.set(`balance_${userId}`, balance); // Mise à jour correcte du solde

          const loseMessages = [
            `😢 ${interaction.user.username} a perdu **${lossAmount}💸** en ouvrant le coffre.`,
            `💸 Oups... Vous avez perdu **${lossAmount}💸**.`,
            `🙁 Pas de chance, vous perdez **${lossAmount}💸**.`,
          ];
          const randomLoseMessage =
            loseMessages[Math.floor(Math.random() * loseMessages.length)];

          embed = new EmbedBuilder()
            .setTitle("🎁 Coffre ouvert !")
            .setDescription(randomLoseMessage)
            .setColor("#FF0000");
        }

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
