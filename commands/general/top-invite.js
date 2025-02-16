import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

const db = new QuickDB();

export const name = "top-invite";

export const data = new SlashCommandBuilder()
  .setName("top-invite")
  .setDescription("Afficher le classement des invitations");

export async function execute(interaction) {
  console.log(
    `📩 Commande reçue : top-invite - Interaction ID: ${interaction.id}`
  );

  try {
    await interaction.deferReply({ flags: 64 }); // Use flags instead of ephemeral

    const invites = await db.all();
    let sortedInvites = invites
      .filter((invite) => invite.id.startsWith("invites_"))
      .sort((a, b) => b.value - a.value);

    // Filter out unknown users
    sortedInvites = await Promise.all(
      sortedInvites.map(async (invite) => {
        const userId = invite.id.split("_")[1];
        try {
          const user = await interaction.client.users.fetch(userId);
          if (user) {
            return { ...invite, username: user.tag };
          }
        } catch (error) {
          console.warn(`⚠️ Utilisateur inconnu : ${userId}`);
        }
        return null;
      })
    );

    sortedInvites = sortedInvites.filter((invite) => invite !== null);

    let page = 1;
    const itemsPerPage = 5;

    const generateCanvas = (page) => {
      const startIndex = (page - 1) * itemsPerPage;
      const displayedInvites = sortedInvites.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond avec un dégradé bleu foncé
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0A192F");
      gradient.addColorStop(1, "#001F3F");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Bordure stylisée
      ctx.strokeStyle = "#00A2FF";
      ctx.lineWidth = 8;
      ctx.roundRect(10, 10, width - 20, height - 20, 20);
      ctx.stroke();

      // Texte principal
      ctx.font = "bold 32px Arial"; // Use a default font
      ctx.fillStyle = "#00A2FF";
      ctx.fillText(`🏆 Classement des Invitations - Page ${page}`, 50, 60);

      ctx.font = "bold 24px Arial"; // Use a default font
      ctx.fillStyle = "#FFFFFF";

      displayedInvites.forEach((invite, index) => {
        const { username, value: inviteCount } = invite;
        ctx.fillText(
          `${startIndex + index + 1}. ${username} - ${inviteCount} invitations`,
          50,
          120 + index * 50
        );
      });

      return canvas.toBuffer();
    };

    const buffer = generateCanvas(page);
    const attachment = new AttachmentBuilder(buffer, {
      name: "top-invite.png",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prevPage")
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId("nextPage")
        .setLabel("Next ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page * itemsPerPage >= sortedInvites.length)
    );

    const reply = await interaction.editReply({
      files: [attachment],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) return;

      if (buttonInteraction.customId === "prevPage" && page > 1) {
        page--;
      } else if (
        buttonInteraction.customId === "nextPage" &&
        page * itemsPerPage < sortedInvites.length
      ) {
        page++;
      }

      const updatedBuffer = generateCanvas(page);
      const updatedAttachment = new AttachmentBuilder(updatedBuffer, {
        name: "top-invite.png",
      });

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prevPage")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId("nextPage")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page * itemsPerPage >= sortedInvites.length)
      );

      await buttonInteraction.update({
        files: [updatedAttachment],
        components: [updatedRow],
      });
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande top-invite :",
      error
    );

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: "🚨 Une erreur s'est produite, merci de réessayer.",
          flags: 64, // Use flags instead of ephemeral
        });
      } catch (replyError) {
        console.error(
          "❌ Impossible d'envoyer un message d'erreur :",
          replyError
        );
      }
    }
  }
}
