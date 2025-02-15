import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Avertir un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur à avertir")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("raison")
        .setDescription("La raison de l'avertissement")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const reason =
      interaction.options.getString("raison") || "Aucune raison fournie";

    if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    const warnings = (await db.get(`warnings_${user.id}`)) || [];
    warnings.push({ reason, date: new Date().toISOString() });
    await db.set(`warnings_${user.id}`, warnings);

    interaction.reply({
      content: `✅ ${user.tag} a été averti. Raison: ${reason}`,
      ephemeral: true,
    });
  },
};
