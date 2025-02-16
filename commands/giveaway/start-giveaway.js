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
    if (interaction.replied || interaction.deferred) {
      return;
    }
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

    const updateCanvas = async (winners = [], finished = false) => {
      const remainingTime = Math.max(0, endTime - Date.now());

      const width = 800;
      const height = 300;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0A192F");
      gradient.addColorStop(1, "#001F3F");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 8;
      ctx.roundRect(10, 10, width - 20, height - 20, 20);
      ctx.stroke();

      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`🎉 Giveaway Démarré`, 50, 60);

      ctx.font = "bold 26px Arial";
      ctx.fillStyle = "#FFFFFF";
      if (finished) {
        ctx.fillText(`🎉 Giveaway Terminé`, 50, 120);
        ctx.fillText(`🏆 Gagnants: ${winners.join(", ")}`, 50, 160);
        ctx.fillText(`⏰ Fin: ${new Date(endTime).toLocaleString()}`, 50, 200);
      } else {
        ctx.fillText(
          `⏳ Temps restant: ${ms(remainingTime, { long: true })}`,
          50,
          120
        );
        ctx.fillText(
          `👥 Participants: ${giveawayData.participants.length}`,
          50,
          160
        );
        ctx.fillText(`🎁 Prix: ${giveawayPrize}`, 50, 200);
        ctx.fillText(`🏆 Nombre de gagnants: ${giveawayWinnerCount}`, 50, 240);
      }

      const buffer = canvas.toBuffer();
      return new AttachmentBuilder(buffer, { name: "giveaway.png" });
    };

    const message = await giveawayChannel.send({
      files: [await updateCanvas()],
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
      if (!giveawayData.participants.includes(i.user.id)) {
        giveawayData.participants.push(i.user.id);
        await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);
        if (!i.replied && !i.deferred) {
          await i.reply({
            content: "🎉 Vous avez été ajouté au giveaway !",
            ephemeral: true,
          });
        }
      } else {
        if (!i.replied && !i.deferred) {
          await i.reply({
            content: "❌ Vous êtes déjà inscrit à ce giveaway.",
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", async () => {
      if (giveawayData.participants.length === 0) {
        await giveawayChannel.send({
          files: [await updateCanvas([], true)],
        });
        return;
      }

      const winners = [];
      for (let i = 0; i < giveawayWinnerCount; i++) {
        const winnerIndex = Math.floor(
          Math.random() * giveawayData.participants.length
        );
        const winnerId = giveawayData.participants.splice(winnerIndex, 1)[0];
        winners.push(`<@${winnerId}>`);
      }

      await message.edit({ files: [await updateCanvas(winners, true)] });

      // Save the winners to the database
      giveawayData.winners = winners;
      await db.set(`giveaway_${giveawayChannel.id}`, giveawayData);
    });

    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        return;
      }
      await message.edit({ files: [await updateCanvas()] });
    }, 1000);

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
