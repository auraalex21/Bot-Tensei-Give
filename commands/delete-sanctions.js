import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("delete-sanctions")
  .setDescription("Supprimer les sanctions d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez supprimer les sanctions")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  await db.delete(`sanctions_${user.id}`);

  interaction.reply({
    content: `✅ Les sanctions de ${user.tag} ont été supprimées.`,
    ephemeral: true,
  });
}
