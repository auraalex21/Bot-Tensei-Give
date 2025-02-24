import { QuickDB } from "quick.db";
import { EmbedBuilder } from "discord.js";

const db = new QuickDB();
const economyTable = db.table("economy");

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
        `🎉 ${interaction.user.username} a ouvert le coffre et ${
          isAddition ? "reçu" : "perdu"
        } **${rewardAmount}💸** !`
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

    await interaction.reply({
      content: `🎉 Vous avez ouvert le coffre et ${
        isAddition ? "reçu" : "perdu"
      } **${rewardAmount}💸** ! Votre nouveau solde est de **${balance}💸**.`,
      ephemeral: true,
    });
  }
}
