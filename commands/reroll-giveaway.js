const { SlashCommandBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reroll-giveaway")
    .setDescription("Relancer un giveaway")
    .addStringOption((option) =>
      option
        .setName("giveaway")
        .setDescription(
          "Le giveaway à relancer (ID du message ou prix du giveaway)"
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("nombre")
        .setDescription("Le nombre de gagnants à retirer")
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
          ":x: Vous devez avoir les permissions de gérer les messages pour relancer des giveaways.",
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("giveaway");
    const number = interaction.options.getInteger("nombre");

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

    if (!giveaway.ended) {
      return interaction.reply({
        content: "Le giveaway n'est pas encore terminé.",
        ephemeral: true,
      });
    }

    // Relancer le giveaway
    client.giveawaysManager
      .reroll(giveaway.messageId, { winnerCount: number })
      .then(() => {
        // Message de succès
        interaction.reply(
          `Giveaway relancé avec ${number} gagnant(s) retiré(s)!`
        );
        db.set(`giveaway_${giveaway.messageId}.rerolled`, true);
      })
      .catch((e) => {
        interaction.reply({
          content: e,
          ephemeral: true,
        });
      });
  },
};
