import { QuickDB } from "quick.db";
import { EmbedBuilder } from "discord.js";

const db = new QuickDB();
const economyTable = db.table("economy");

const additionPhrases = [
  "a découvert un trésor légendaire et a reçu",
  "a bravé les dangers et a gagné",
  "a trouvé un coffre caché et a obtenu",
  "a été béni par les dieux et a reçu",
];

const withdrawalPhrases = [
  "a été frappé par la malédiction et a perdu",
  "a dépensé une fortune pour un artefact rare et a sacrifié",
  "a été volé par des bandits et a égaré",
  "a parié et a perdu",
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
