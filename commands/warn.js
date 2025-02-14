const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
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
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const reason = interaction.options.getString("raison");

    if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'avertir des membres.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({
        content: ":x: Utilisateur non trouvé.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const warnings = (await db.get(`warnings_${user.id}`)) || [];
    warnings.push({
      reason,
      date: new Date().toISOString(),
      moderatorId: interaction.user.id,
    });
    await db.set(`warnings_${user.id}`, warnings);

    interaction.reply(
      `✅ ${user.tag} a été averti pour la raison suivante : ${reason}`
    );
  },
};
