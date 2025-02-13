const Discord = require("discord.js");
const ms = require("ms");
const messages = require("../utils/messages");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  description: "Démarrer un giveaway",

  options: [
    {
      name: "durée",
      description:
        "Combien de temps le giveaway doit durer. Exemples: 1m, 1h, 1d",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
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
    const giveawayDuration = interaction.options.getString("durée");
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
      // La durée du giveaway
      duration: ms(giveawayDuration),
      // Le prix du giveaway
      prize: giveawayPrize,
      // Le nombre de gagnants du giveaway
      winnerCount: giveawayWinnerCount,
      // Qui organise ce giveaway
      hostedBy: client.config.hostedBy ? interaction.user : null,
      // Messages
      messages,
    });

    // Stocker les données du giveaway dans quick.db
    await db.set(`giveaway_${giveawayChannel.id}`, {
      duration: giveawayDuration,
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: interaction.user.id,
    });

    interaction.reply(`Giveaway démarré dans ${giveawayChannel}!`);
  },
};
