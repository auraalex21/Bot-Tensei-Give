import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("money")
  .setDescription("Vérifier votre solde d'argent");

export async function execute(interaction) {
  if (!interaction.isCommand()) return;

  const userId = interaction.user.id;
  const balance = Number(await economyTable.get(`balance_${userId}`)) || 0;

  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("💰 Solde Bancaire")
    .setDescription(
      `💸 **${interaction.user.username}**, votre solde actuel est de **${balance}💸**.`
    );
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [embed] });
  } else {
    await interaction.reply({ embeds: [embed] });
  }
}
