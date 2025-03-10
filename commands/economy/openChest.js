import { QuickDB } from "quick.db";
import { EmbedBuilder } from "discord.js";

const db = new QuickDB();
const economyTable = db.table("economy");

const additionPhrases = [
  "a mis la main sur un trésor oublié et s'est enrichi de",
  "a triomphé des épreuves du destin et a remporté",
  "a percé les mystères d'un coffre ancien et a mis la main sur",
  "a reçu la bénédiction des divinités et s'est vu offrir",
];

const withdrawalPhrases = [
  "a succombé à une sombre malédiction et s'est vu dépouillé de",
  "a troqué sa fortune contre un artefact mythique, sacrifiant ainsi",
  "a été pris en embuscade par des voleurs de l'ombre et a perdu",
  "a tenté sa chance dans un pari audacieux… et a tout misé sur",
];

export async function execute(interaction) {
  if (interaction.customId === "open_chest") {
    const userId = interaction.user.id;
    const minAmount = 100;
    const maxAmount = 1000;
    const rewardAmount =
      Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

    let balance = (await economyTable.get(`balance_${userId}`)) || 0;

    // Determine if the reward is an addition or a withdrawal
    const isAddition = Math.random() < 0.4; // 40% chance for addition

    const phrase = isAddition
      ? additionPhrases[Math.floor(Math.random() * additionPhrases.length)]
      : withdrawalPhrases[Math.floor(Math.random() * withdrawalPhrases.length)];

    if (isAddition) {
      balance += rewardAmount;
    } else {
      balance -= rewardAmount;
      if (balance < 0) balance = 0; // Ensure balance doesn't go negative
    }

    await economyTable.set(`balance_${userId}`, balance);

    const embed = new EmbedBuilder()
      .setTitle("🎁 Coffre ouvert !")
      .setDescription(
        `🎉 ${interaction.user.username} a ouvert le coffre et ${phrase} **${rewardAmount}💸** !`
      )
      .setColor("#FFD700");

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

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `🎉 Vous avez ouvert le coffre et ${phrase} **${rewardAmount}💸** ! Votre nouveau solde est de **${balance}💸**.`,
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: `🎉 Vous avez ouvert le coffre et ${phrase} **${rewardAmount}💸** ! Votre nouveau solde est de **${balance}💸**.`,
        });
      }
    } catch (error) {
      console.error("Error handling interaction:", error);
    }
  }
}
