import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("addmoney")
  .setDescription("Ajouter de l'argent à un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à qui ajouter de l'argent")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("montant")
      .setDescription("Le montant d'argent à ajouter")
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true }); // Évite l'expiration de l'interaction

  const authorizedUserId = "378998346712481812";
  if (interaction.user.id !== authorizedUserId) {
    await interaction.editReply(
      "❌ Vous n'avez pas la permission d'utiliser cette commande."
    );
    return;
  }

  const user = interaction.options.getUser("utilisateur");
  const amount = interaction.options.getInteger("montant");

  try {
    let balance = (await economyTable.get(`balance_${user.id}`)) || 0;
    balance += amount;

    await economyTable.set(`balance_${user.id}`, balance); // Mise à jour correcte

    await interaction.editReply(
      `✅ **${amount}💸** ont été ajoutés à **${user.username}**.\n💰 **Nouveau solde**: ${balance}💸`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout d'argent :", error);
    await interaction.editReply("❌ Une erreur est survenue.");
  }
}
