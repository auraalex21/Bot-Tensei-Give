import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("money")
  .setDescription("Vérifier votre solde d'argent");

export async function execute(interaction) {
  const userId = interaction.user.id;
  const balance = (await economyTable.get(`balance_${userId}`)) || 0;

  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("💰 Solde Bancaire")
    .setDescription(
      `💸 **${interaction.user.username}**, votre solde actuel est de **${balance}💸**.`
    )
    .setFooter({ text: "Utilisez /earn pour gagner plus d'argent." });

  await interaction.reply({ embeds: [embed] });
}
