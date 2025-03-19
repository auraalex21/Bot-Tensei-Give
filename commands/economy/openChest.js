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

    if (randomChance <= 1) {
      // 1% chance to win a Nitro
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
    } else if (randomChance <= 21) {
      // 20% chance to win money
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
    } else if (randomChance <= 58) {
      // 37% chance to either get nothing or lose money
      const subChance = Math.random() * 100; // Generate a sub-chance for this block
      if (subChance <= 50) {
        // 50% of 37% = 18.5% chance to get nothing
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
      } else {
        // 50% of 37% = 18.5% chance to lose money
        const minLoss = 50;
        const maxLoss = 500;
        const lossAmount =
          Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;

        let balance = (await economyTable.get(`balance_${userId}`)) || 0;
        balance = Math.max(0, balance - lossAmount); // Ensure balance doesn't go below 0
        await economyTable.set(`balance_${userId}`, balance);

        const loseMoneyMessages = [
          `😢 ${interaction.user.username} a perdu **${lossAmount}💸** en ouvrant le coffre.`,
          `💸 Oups... Vous avez perdu **${lossAmount}💸**.`,
          `🙁 Pas de chance, vous perdez **${lossAmount}💸**.`,
        ];
        const randomLoseMoneyMessage =
          loseMoneyMessages[
            Math.floor(Math.random() * loseMoneyMessages.length)
          ];

        embed = new EmbedBuilder()
          .setTitle("🎁 Coffre ouvert !")
          .setDescription(randomLoseMoneyMessage)
          .setColor("#FF0000");
      }
    } else {
      // 42% chance to lose money
      const minLoss = 50;
      const maxLoss = 500;
      const lossAmount =
        Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;

      let balance = (await economyTable.get(`balance_${userId}`)) || 0;
      balance = Math.max(0, balance - lossAmount); // Ensure balance doesn't go below 0
      await economyTable.set(`balance_${userId}`, balance);

      const loseMoneyMessages = [
        `😢 ${interaction.user.username} a perdu **${lossAmount}💸** en ouvrant le coffre.`,
        `💸 Oups... Vous avez perdu **${lossAmount}💸**.`,
        `🙁 Pas de chance, vous perdez **${lossAmount}💸**.`,
      ];
      const randomLoseMoneyMessage =
        loseMoneyMessages[Math.floor(Math.random() * loseMoneyMessages.length)];

      embed = new EmbedBuilder()
        .setTitle("🎁 Coffre ouvert !")
        .setDescription(randomLoseMoneyMessage)
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

// Simulation to test probabilities
if (process.env.TEST_PROBABILITIES) {
  const results = { nitro: 0, money: 0, nothing: 0, loss: 0 };
  const iterations = 100000;

  for (let i = 0; i < iterations; i++) {
    const randomChance = Math.random() * 100;

    if (randomChance <= 1) {
      results.nitro++;
    } else if (randomChance <= 21) {
      results.money++;
    } else if (randomChance <= 58) {
      results.nothing++;
    } else {
      results.loss++;
    }
  }

  console.log("Simulation Results:", results);
  console.log("Percentages:", {
    nitro: (results.nitro / iterations) * 100,
    money: (results.money / iterations) * 100,
    nothing: (results.nothing / iterations) * 100,
    loss: (results.loss / iterations) * 100,
  });
}
