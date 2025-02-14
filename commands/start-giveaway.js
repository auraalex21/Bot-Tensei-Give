const Discord = require("discord.js");
const ms = require("ms");
const messages = require("../utils/messages");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start-giveaway")
    .setDescription("Démarrer un giveaway")
    .addStringOption((option) =>
      option
        .setName("durée")
        .setDescription(
          "Combien de temps le giveaway doit durer. Exemples: 1m, 1h, 1d"
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("gagnants")
        .setDescription("Combien de gagnants le giveaway doit avoir")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("prix")
        .setDescription("Quel est le prix du giveaway")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Le canal pour démarrer le giveaway")
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
          ":x: Vous devez avoir les permissions de gérer les messages pour démarrer des giveaways.",
        ephemeral: true,
      });
    }

    const giveawayChannel = interaction.options.getChannel("canal");
    const giveawayDuration = interaction.options.getString("durée");
    const giveawayWinnerCount = interaction.options.getInteger("gagnants");
    const giveawayPrize = interaction.options.getString("prix");

    if (giveawayChannel.type !== Discord.ChannelType.GuildText) {
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
      // Attribuer des taux de chance supplémentaires en fonction des rôles
      bonusEntries: [
        {
          role: "1339902720546439189", // Bronze
          bonus: 5,
        },
        {
          role: "1339902718088577074", // Argent
          bonus: 10,
        },
        {
          role: "1339902715165147166", // Or
          bonus: 15,
        },
        {
          role: "1339902712724066406", // Diamant
          bonus: 25,
        },
      ],
    });

    interaction.reply(`Giveaway démarré dans ${giveawayChannel}!`);
  },
};
