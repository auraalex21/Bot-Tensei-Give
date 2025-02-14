const { SlashCommandBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulser un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur à expulser")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("raison")
        .setDescription("La raison de l'expulsion")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const reason =
      interaction.options.getString("raison") || "Aucune raison fournie";

    if (!interaction.member.permissions.has("KICK_MEMBERS")) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'expulser des membres.",
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

    await member.kick(reason);
    const kicks = (await db.get(`kicks_${user.id}`)) || [];
    kicks.push({
      reason,
      date: new Date().toISOString(),
      moderatorId: interaction.user.id,
    });
    await db.set(`kicks_${user.id}`, kicks);

    interaction.reply(
      `✅ ${user.tag} a été expulsé pour la raison suivante : ${reason}`
    );
  },
};
