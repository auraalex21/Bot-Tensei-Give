const Discord = require("discord.js");
const ms = require("ms");
const messages = require("../utils/messages");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

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
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const giveawayChannel = interaction.options.getChannel("canal");
    const giveawayDuration = interaction.options.getString("durée");
    const giveawayWinnerCount = interaction.options.getInteger("gagnants");
    const giveawayPrize = interaction.options.getString("prix");

    if (giveawayChannel.type !== Discord.ChannelType.GuildText) {
      return interaction.reply({
        content: ":x: Le canal sélectionné n'est pas un canal textuel.",
        flags: Discord.MessageFlags.Ephemeral,
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
    const giveawayMessage = await giveawayChannel.send({
      content: `🎉 **GIVEAWAY** 🎉\n\n**Prix:** ${giveawayPrize}\n**Durée:** ${giveawayDuration}\n**Nombre de gagnants:** ${giveawayWinnerCount}\n\nCliquez sur le bouton ci-dessous pour participer !`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("participer-giveaway")
            .setLabel("Participer")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });

    client.giveawaysManager.start(giveawayMessage, {
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

    interaction.reply({
      content: `🎉 Giveaway démarré dans ${giveawayChannel}!`,
      flags: Discord.MessageFlags.Ephemeral,
    });
  },
};
