const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end-giveaway")
    .setDescription("Terminer un giveaway")
    .addStringOption((option) =>
      option
        .setName("giveaway")
        .setDescription(
          "Le giveaway à terminer (ID du message ou prix du giveaway)"
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    // Si le membre n'a pas les permissions nécessaires
    if (
      !interaction.member.permissions.has("MANAGE_MESSAGES") &&
      !interaction.member.roles.cache.some((r) => r.name === "Giveaways")
    ) {
      return interaction.reply({
        content:
          ":x: Vous devez avoir les permissions de gérer les messages pour terminer des giveaways.",
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("giveaway");

    // essayer de trouver le giveaway avec le prix puis avec l'ID
    const giveaway =
      // Rechercher avec le prix du giveaway
      client.giveawaysManager.giveaways.find(
        (g) => g.prize === query && g.guildId === interaction.guild.id
      ) ||
      // Rechercher avec l'ID du giveaway
      client.giveawaysManager.giveaways.find(
        (g) => g.messageId === query && g.guildId === interaction.guild.id
      );

    // Si aucun giveaway n'a été trouvé
    if (!giveaway) {
      return interaction.reply({
        content: "Impossible de trouver un giveaway pour `" + query + "`.",
        ephemeral: true,
      });
    }

    if (giveaway.ended) {
      return interaction.reply({
        content: "Ce giveaway est déjà terminé.",
        ephemeral: true,
      });
    }

    // Modifier le giveaway
    client.giveawaysManager
      .end(giveaway.messageId)
      // Message de succès
      .then(() => {
        // Message de succès
        interaction.reply("Giveaway terminé!");
        db.set(`giveaway_${giveaway.messageId}.ended`, true);
      })
      .catch((e) => {
        interaction.reply({
          content: e,
          ephemeral: true,
        });
      });
  },
};
