import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  AttachmentBuilder,
} from "discord.js";
import ms from "ms";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

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
  try {
    if (!interaction.isRepliable()) return;
    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.editReply({
        content:
          "❌ Vous devez avoir la permission `Gérer les messages` pour organiser un giveaway.",
        ephemeral: true,
      });
    }

    const giveawayChannel = interaction.options.getChannel("canal");
    const giveawayDuration = interaction.options.getString("durée");
    const giveawayWinnerCount = interaction.options.getInteger("gagnants");
    const giveawayPrize = interaction.options.getString("prix");

    if (!giveawayChannel.isTextBased()) {
      return interaction.editReply({
        content: "❌ Le canal sélectionné n'est pas un canal textuel valide.",
        ephemeral: true,
      });
    }

    const endTime = Date.now() + ms(giveawayDuration);
    const giveawayData = {
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      hostedBy: interaction.user.id,
      endTime,
      participants: [],
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("participate")
        .setLabel("Participer")
        .setStyle(ButtonStyle.Primary)
    );

    const message = await giveawayChannel.send({
      content: `🎉 **Giveaway Démarré !** 🎁 Prix: **${giveawayPrize}**\n👥 Participants: 0\n⏳ Fin: <t:${Math.floor(
        endTime / 1000
      )}:R>`,
      components: [row],
    });

    giveawayData.messageId = message.id;
    await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);

    await interaction.editReply({
      content: "✅ Giveaway démarré avec succès !",
      ephemeral: true,
    });

    const collector = message.createMessageComponentCollector({
      time: ms(giveawayDuration),
    });

    collector.on("collect", async (i) => {
      try {
        await i.deferUpdate(); // Empêche l'expiration de l'interaction

        if (!giveawayData.participants.includes(i.user.id)) {
          giveawayData.participants.push(i.user.id);
          await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);
          await i.followUp({
            content: "🎉 Vous avez été ajouté au giveaway !",
            ephemeral: true,
          });
        } else {
          await i.followUp({
            content: "❌ Vous êtes déjà inscrit à ce giveaway.",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(
          "Erreur lors de la gestion de l'interaction du giveaway:",
          err
        );
      }
    });

    collector.on("end", async () => {
      if (giveawayData.participants.length === 0) {
        await giveawayChannel.send("⛔ Aucun participant, giveaway annulé.");
        return;
      }

      const winners = [];
      for (let i = 0; i < giveawayWinnerCount; i++) {
        if (giveawayData.participants.length === 0) break;
        const winnerIndex = Math.floor(
          Math.random() * giveawayData.participants.length
        );
        const winnerId = giveawayData.participants.splice(winnerIndex, 1)[0];
        winners.push(`<@${winnerId}>`);
      }

      await giveawayChannel.send(
        `🎉 **Félicitations aux gagnants !** 🎊\n🏆 ${winners.join(
          ", "
        )}\n🎁 Prix: **${giveawayPrize}**`
      );
      giveawayData.winners = winners;
      await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);
    });

    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        return;
      }
      await message.edit({
        content: `🎉 **Giveaway en cours !** 🎁 Prix: **${giveawayPrize}**\n👥 Participants: ${
          giveawayData.participants.length
        }\n⏳ Fin: <t:${Math.floor(endTime / 1000)}:R>`,
      });
    }, 60000);

    console.log(`✅ Giveaway démarré dans ${giveawayChannel.name}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande start-giveaway :",
      error
    );
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        ephemeral: true,
      });
    }
  }
}
