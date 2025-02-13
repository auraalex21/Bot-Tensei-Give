const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  description: "Relancer un giveaway",

  options: [
    {
      name: "giveaway",
      description: "Le giveaway à relancer (ID du message ou prix)",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "nombre",
      description: "Le nombre de gagnants à retirer",
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // If the member doesn't have enough permissions
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

    // try to found the giveaway with prize then with ID
    const giveaway =
      // Search with giveaway prize
      client.giveawaysManager.giveaways.find(
        (g) => g.prize === query && g.guildId === interaction.guild.id
      ) ||
      // Search with giveaway ID
      client.giveawaysManager.giveaways.find(
        (g) => g.messageId === query && g.guildId === interaction.guild.id
      );

    // If no giveaway was found
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

    // Reroll the giveaway
    client.giveawaysManager
      .reroll(giveaway.messageId, { winnerCount: number })
      .then(() => {
        // Success message
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
