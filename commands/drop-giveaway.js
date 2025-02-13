const Discord = require("discord.js");
const messages = require("../utils/messages");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  description: "Créer un drop giveaway",

  options: [
    {
      name: "gagnants",
      description: "Combien de gagnants le giveaway doit avoir",
      type: Discord.ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "prix",
      description: "Quel est le prix du giveaway",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "canal",
      description: "Le canal pour démarrer le giveaway",
      type: Discord.ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // Si le membre n'a pas les permissions nécessaires
    if (
      !interaction.member.permissions.has("MANAGE_MESSAGES") &&
      !interaction.member.roles.cache.some((r) => r.name === "Giveaways")
    ) {
      return interaction.reply({
        content:
          ":x: Vous devez avoir les permissions de gérer les messages pour démarrer des giveaways.",
        ephemeral: true,
      });
    }

    const giveawayChannel = interaction.options.getChannel("canal");
    const giveawayWinnerCount = interaction.options.getInteger("gagnants");
    const giveawayPrize = interaction.options.getString("prix");

    if (!giveawayChannel.isTextBased()) {
      return interaction.reply({
        content: ":x: Le canal sélectionné n'est pas basé sur du texte.",
        ephemeral: true,
      });
    }

    // Démarrer le giveaway
    client.giveawaysManager.start(giveawayChannel, {
      // Le nombre de gagnants pour ce drop
      winnerCount: giveawayWinnerCount,
      // Le prix du giveaway
      prize: giveawayPrize,
      // Qui organise ce giveaway
      hostedBy: client.config.hostedBy ? interaction.user : null,
      // spécifier drop
      isDrop: true,
      // Messages
      messages,
    });

    db.set(`giveaway_${giveawayChannel.id}`, {
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: interaction.user.id,
      isDrop: true,
    });

    interaction.reply(`Giveaway démarré dans ${giveawayChannel}!`);
  },
};
