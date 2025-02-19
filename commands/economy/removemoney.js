import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("removemoney")
  .setDescription("Retirer de l'argent à un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à qui retirer de l'argent")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("montant")
      .setDescription("Le montant d'argent à retirer")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const allowedUserId = "378998346712481812";

  if (interaction.user.id !== allowedUserId) {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("utilisateur");
  const amount = interaction.options.getInteger("montant");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ Le montant doit être positif.",
      ephemeral: true,
    });
  }

  let balance = (await economyTable.get(`balance_${user.id}`)) || 0;
  balance = Math.max(0, balance - amount);

  await economyTable.set(`balance_${user.id}`, balance);
  await interaction.reply(
    `💸 ${amount} a été retiré à **${user.username}**. Nouveau solde: **${balance}💸**.`
  );
}
