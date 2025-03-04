import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Réclamez votre récompense quotidienne.");

export async function execute(interaction) {
  const userId = interaction.user.id;
  const minAmount = 1000;
  const maxAmount = 6500;
  const dailyAmount =
    Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
  const cooldown = 24 * 60 * 60 * 1000;

  const lastClaimed = (await economyTable.get(`daily_${userId}`)) || 0;
  const now = Date.now();

  if (now - lastClaimed < cooldown) {
    const timeLeft = cooldown - (now - lastClaimed);
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Récompense quotidienne")
      .setDescription(
        `❌ Vous avez déjà réclamé votre récompense quotidienne. Réessayez dans ${hours} heures et ${minutes} minutes.`
      );
    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  let balance = (await economyTable.get(`balance_${userId}`)) || 0;
  balance += dailyAmount;

  await economyTable.set(`balance_${userId}`, balance);
  await economyTable.set(`daily_${userId}`, now);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Récompense quotidienne")
    .setDescription(
      `✅ Vous avez réclamé votre récompense quotidienne de **${dailyAmount}💸**. Votre nouveau solde est de **${balance}💸**.`
    );
  await interaction.reply({ embeds: [embed] });
}
