const { SlashCommandBuilder } = require("discord.js");
const levels = require("../config/levels");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level-up")
    .setDescription("Faire passer un niveau à un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont vous voulez augmenter le niveau")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur");
    const guildId = interaction.guild.id;
    const member = interaction.guild.members.cache.get(interaction.user.id);

    // Check if the user has the required role
    if (!member.roles.cache.has("1339230333953904751")) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    // Récupérer les données de l'utilisateur
    const userData = await db.get(`levels_${guildId}_${user.id}`);
    if (!userData) {
      return interaction.reply({
        content: `:x: Aucune donnée trouvée pour ${user.tag}.`,
        ephemeral: true,
      });
    }

    // Augmenter le niveau
    userData.level++;
    userData.exp = 0; // Réinitialiser l'expérience pour le nouveau niveau

    // Mettre à jour les données de l'utilisateur
    await db.set(`levels_${guildId}_${user.id}`, userData);

    interaction.reply({
      content: `✅ ${user.tag} a été augmenté au niveau ${userData.level}.`,
      ephemeral: true,
    });
  },
};
