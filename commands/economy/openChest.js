import { QuickDB } from "quick.db";
import { EmbedBuilder } from "discord.js";

const db = new QuickDB();
const economyTable = db.table("economy");
const nitroTable = db.table("nitro");

export async function execute(interaction) {
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
      const loseMessages = [
        `😢 ${interaction.user.username} a ouvert le coffre, mais il était vide.`,
        `💨 Pas de chance... Le coffre ne contenait rien.`,
        `🙁 Vous avez ouvert le coffre, mais il n'y avait rien à l'intérieur.`,
      ];
      const randomLoseMessage =
        loseMessages[Math.floor(Math.random() * loseMessages.length)];

      embed = new EmbedBuilder()
        .setTitle("🎁 Coffre ouvert !")
        .setDescription(randomLoseMessage)
        .setColor("#FF0000");
    }

    const chestMessageId = await db.get("chestMessageId");
    const channel = interaction.channel;

    if (chestMessageId && channel) {
      const message = await channel.messages.fetch(chestMessageId);
      if (message) {
        await message.edit({
          embeds: [embed],
          components: [], // Remove the button
        });
      }
    }
  }
}
