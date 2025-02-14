const { SlashCommandBuilder } = require("discord.js");
const levels = require("../config/levels");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("refresh-exp")
    .setDescription(
      "Rafraîchir l'expérience d'un utilisateur et recalculer son niveau"
    )
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription(
          "L'utilisateur dont vous voulez rafraîchir l'expérience"
        )
        .setRequired(true)
    ),

  async execute(client, interaction) {
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

    // Recalculer le niveau
    let exp = userData.exp;
    let level = userData.level;
    const expNeeded = 5 * Math.pow(level, 2) + 50 * level + 100;

    if (exp >= expNeeded) {
      exp -= expNeeded;
      level++;
      await db.set(`levels_${guildId}_${user.id}`, {
        exp,
        level,
        lastExpTime: userData.lastExpTime,
      });

      interaction.reply({
        content: `✅ L'expérience de ${user.tag} a été rafraîchie et son niveau a été augmenté à ${level}.`,
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: `✅ L'expérience de ${user.tag} a été rafraîchie mais son niveau reste à ${level}.`,
        ephemeral: true,
      });
    }
  },
};
