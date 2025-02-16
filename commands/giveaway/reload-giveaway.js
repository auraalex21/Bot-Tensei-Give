import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";
import ms from "ms";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("reload-giveaway")
  .setDescription("Recharger un giveaway et mettre à jour le temps restant")
  .addStringOption((option) =>
    option
      .setName("giveaway_id")
      .setDescription("L'ID du giveaway à recharger")
      .setRequired(true)
  );

export async function execute(interaction) {
  const giveawayId = interaction.options.getString("giveaway_id");
  const giveaway = await db.get(`giveaways.${giveawayId}`);

  if (!giveaway) {
    return interaction.reply({
      content: ":x: Giveaway non trouvé.",
      ephemeral: true,
    });
  }

  const remainingTime = giveaway.endTime - Date.now();
  if (remainingTime <= 0) {
    return interaction.reply({
      content: ":x: Le giveaway est déjà terminé.",
      ephemeral: true,
    });
  }

  const giveawayChannel = interaction.client.channels.cache.get(
    giveawayId.split("_")[1]
  );
  if (!giveawayChannel) {
    return interaction.reply({
      content: ":x: Canal du giveaway non trouvé.",
      ephemeral: true,
    });
  }

  const message = await giveawayChannel.messages.fetch(giveaway.messageId);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("participate")
      .setLabel("Participer")
      .setStyle(ButtonStyle.Primary)
  );

  const updateCanvas = async (winners = [], finished = false) => {
    const remainingTime = Math.max(0, giveaway.endTime - Date.now());

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
      ctx.fillText(
        `⏰ Fin: ${new Date(giveaway.endTime).toLocaleString()}`,
        50,
        200
      );
    } else {
      ctx.fillText(
        `⏳ Temps restant: ${ms(remainingTime, { long: true })}`,
        50,
        120
      );
      ctx.fillText(`👥 Participants: ${giveaway.participants.length}`, 50, 160);
      ctx.fillText(`🎁 Prix: ${giveaway.prize}`, 50, 200);
      ctx.fillText(`🏆 Nombre de gagnants: ${giveaway.winnerCount}`, 50, 240);
    }

    const buffer = canvas.toBuffer();
    return new AttachmentBuilder(buffer, { name: "giveaway.png" });
  };

  const collector = message.createMessageComponentCollector({
    time: remainingTime,
  });

  collector.on("collect", async (i) => {
    if (!giveaway.participants.includes(i.user.id)) {
      giveaway.participants.push(i.user.id);
      await db.set(`giveaway_${giveawayChannel.id}`, giveaway);
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
    if (giveaway.participants.length === 0) {
      await giveawayChannel.send({
        files: [await updateCanvas([], true)],
      });
      return;
    }

    const winners = [];
    for (let i = 0; i < giveaway.winnerCount; i++) {
      const winnerIndex = Math.floor(
        Math.random() * giveaway.participants.length
      );
      const winnerId = giveaway.participants.splice(winnerIndex, 1)[0];
      winners.push(`<@${winnerId}>`);
    }

    await message.edit({ files: [await updateCanvas(winners, true)] });

    // Save the winners to the database
    giveaway.winners = winners;
    await db.set(`giveaway_${giveawayChannel.id}`, giveaway);
  });

  const interval = setInterval(async () => {
    if (Date.now() >= giveaway.endTime) {
      clearInterval(interval);
      return;
    }
    await message.edit({ files: [await updateCanvas()] });
  }, 1000);

  await interaction.reply({
    content: "✅ Giveaway rechargé avec succès !",
    ephemeral: true,
  });

  console.log(`✅ Giveaway rechargé dans ${giveawayChannel.name}`);
}
