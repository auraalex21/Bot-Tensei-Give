import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  MessageFlags,
} from "discord.js";
import ms from "ms";
import { messages } from "../utils/messages.js"; // Ensure this path is correct
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("start-giveaway")
  .setDescription("Démarrer un giveaway")
  .addStringOption((option) =>
    option
      .setName("durée")
      .setDescription(
        "Combien de temps le giveaway doit durer (ex: 1m, 1h, 1d)"
      )
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("gagnants")
      .setDescription("Nombre de gagnants")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("prix").setDescription("Prix du giveaway").setRequired(true)
  )
  .addChannelOption((option) =>
    option
      .setName("canal")
      .setDescription("Salon pour le giveaway")
      .setRequired(true)
  );

export async function execute(interaction) {
  const client = interaction.client;

  // Vérification des permissions
  if (
    !interaction.member.permissions.has(
      PermissionsBitField.Flags.ManageMessages
    )
  ) {
    return interaction.reply({
      content:
        ":x: Vous devez avoir la permission `Gérer les messages` pour lancer un giveaway.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const giveawayChannel = interaction.options.getChannel("canal");
  const giveawayDuration = interaction.options.getString("durée");
  const giveawayWinnerCount = interaction.options.getInteger("gagnants");
  const giveawayPrize = interaction.options.getString("prix");

  // Vérification du type de salon
  console.log("Type de salon:", giveawayChannel.type);
  if (!giveawayChannel.isTextBased()) {
    return interaction.reply({
      content: ":x: Le canal sélectionné n'est pas un canal textuel valide.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Correction du hostedBy pour éviter l'erreur "not a snowflake"
  const hostedByText = interaction.user.toString();

  // Correction du footer pour éviter les erreurs de validation
  messages.footer = {
    text: `Giveaway organisé par ${interaction.user.username || "le serveur"}`,
  };

  // Envoi du message initial avec un bouton pour participer
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

  // ID du message de règlement et de l'emoji de validation
  const rulesMessageId = "1339253344853692416";
  const rulesEmoji = "✅";

  // Vérification de l'ID du message de règlement
  if (!/^\d+$/.test(rulesMessageId)) {
    console.error(
      "L'ID du message n'est pas un Snowflake valide :",
      rulesMessageId
    );
    return interaction.reply({
      content: ":x: L'ID du message de règlement est invalide.",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Gestion du temps restant du giveaway
  const endTime = Date.now() + ms(giveawayDuration);
  const updateInterval = setInterval(async () => {
    const remainingTime = endTime - Date.now();
    if (remainingTime <= 0) {
      clearInterval(updateInterval);
      return;
    }
    const formattedTime = new Date(remainingTime).toISOString().substr(11, 8);
    await giveawayMessage.edit({
      content: `🎉 **GIVEAWAY** 🎉\n\n**Prix:** ${giveawayPrize}\n**Durée:** ${formattedTime}\n**Nombre de gagnants:** ${giveawayWinnerCount}\n\nCliquez sur le bouton ci-dessous pour participer !`,
      components: giveawayMessage.components,
    });
  }, 1000);

  // Gestion des participations
  const filter = (i) =>
    i.customId === "participer-giveaway" && i.message.id === giveawayMessage.id;
  const collector = giveawayMessage.createMessageComponentCollector({
    filter,
    time: ms(giveawayDuration),
  });

  collector.on("collect", async (i) => {
    const rulesMessage = await giveawayChannel.messages.fetch(rulesMessageId);
    const userReactions = rulesMessage.reactions.cache.filter((reaction) =>
      reaction.users.cache.has(i.user.id)
    );

    if (!userReactions.has(rulesEmoji)) {
      return i.reply({
        content:
          ":x: Vous devez accepter le règlement pour participer à ce giveaway.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!i.member.roles.cache.has("1340087668616204471")) {
      return i.reply({
        content:
          ":x: Vous n'avez pas le rôle requis pour participer à ce giveaway.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await i.reply({
      content: "🎉 Vous avez été ajouté au giveaway !",
      flags: MessageFlags.Ephemeral,
    });
  });

  // Démarrer le giveaway
  client.giveawaysManager
    .start(giveawayMessage, {
      duration: ms(giveawayDuration),
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: hostedByText,
      messages,
      bonusEntries: [
        { role: "1339902720546439189", bonus: 5 }, // Bronze
        { role: "1339902718088577074", bonus: 10 }, // Argent
        { role: "1339902715165147166", bonus: 15 }, // Or
        { role: "1339902712724066406", bonus: 25 }, // Diamant
      ],
    })
    .then(() => {
      interaction.reply({
        content: `🎉 Giveaway démarré dans ${giveawayChannel}!`,
        flags: MessageFlags.Ephemeral,
      });
    })
    .catch((error) => {
      console.error("Failed to start giveaway:", error);
      interaction.reply({
        content: ":x: Une erreur s'est produite lors du démarrage du giveaway.",
        flags: MessageFlags.Ephemeral,
      });
    });

  db.set(`giveaway_${giveawayChannel.id}`, {
    prize: giveawayPrize,
    winnerCount: giveawayWinnerCount,
    hostedBy: interaction.user.id,
    duration: ms(giveawayDuration),
  });
}
