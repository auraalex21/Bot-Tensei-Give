import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("delete-sanctions")
    .setDescription("Supprimer toutes les sanctions d'un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription(
          "L'utilisateur dont vous voulez supprimer les sanctions"
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");

    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content:
          ":x: Vous n'avez pas la permission de supprimer les sanctions des utilisateurs.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    await db.delete(`warnings_${user.id}`);
    await db.delete(`kicks_${user.id}`);
    await db.delete(`timeouts_${user.id}`);
    await db.delete(`bans_${user.id}`);

    interaction.reply(
      `✅ Toutes les sanctions de ${user.tag} ont été supprimées.`
    );
  },
};
