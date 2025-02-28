import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");
const authorizedUserId = "378998346712481812";

export const data = new SlashCommandBuilder()
  .setName("deleteuser")
  .setDescription("Supprimer un utilisateur de la base de données")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("L'utilisateur à supprimer")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.isCommand()) return;

  const executorId = interaction.user.id;
  if (executorId !== authorizedUserId) {
    return interaction.reply(
      "Vous n'êtes pas autorisé à utiliser cette commande."
    );
  }

  const targetUser = interaction.options.getUser("target");
  if (!targetUser) {
    return interaction.reply("Utilisateur non trouvé.");
  }

  await economyTable.delete(`balance_${targetUser.id}`);
  return interaction.reply(
    `L'utilisateur ${targetUser.username} a été supprimé de la base de données.`
  );
}
