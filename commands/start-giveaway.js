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
    const client = interaction.client;

    // Vérification des permissions de l'utilisateur
    if (
      !interaction.member.permissions.has(
        Discord.PermissionsBitField.Flags.ManageMessages
      ) &&
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
        content: ":x: Le canal sélectionné n'est pas un canal textuel.",
        ephemeral: true,
      });
    }

    // Correction de l'erreur avec setFooter() et hostedBy
    messages.embedFooter = {
      text: `Giveaway organisé par ${
        interaction.user.username || "le serveur"
      }`,
    };

    const hostedByText =
      process.env.HOSTED_BY && process.env.HOSTED_BY.trim() !== ""
        ? process.env.HOSTED_BY
        : `Organisé par ${interaction.user.username}`;

    // Démarrer le giveaway
    client.giveawaysManager.start(giveawayChannel, {
      duration: ms(giveawayDuration),
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: hostedByText,
      messages,
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

    interaction.reply(`🎉 Giveaway démarré dans ${giveawayChannel}!`);
  },
};
