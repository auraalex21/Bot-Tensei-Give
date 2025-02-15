import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { sendMessage, messages } from "../utils/messages.js"; // Ensure this path is correct

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("drop-giveaway")
    .setDescription("Créer un drop giveaway")
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

    if (giveawayChannel.type !== "GUILD_TEXT") {
      return interaction.reply({
        content: ":x: Le canal sélectionné n'est pas basé sur du texte.",
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
      // Le nombre de gagnants pour ce drop
      winnerCount: giveawayWinnerCount,
      // Le prix du giveaway
      prize: giveawayPrize,
      // Qui organise ce giveaway
      hostedBy: hostedByText,
      // spécifier drop
      isDrop: true,
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

    db.set(`giveaway_${giveawayChannel.id}`, {
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: interaction.user.id,
      isDrop: true,
    });

    interaction.reply(`Giveaway démarré dans ${giveawayChannel}!`);
  },
};
