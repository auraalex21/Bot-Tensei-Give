import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas } from "canvas";

const activeInteractions = new Set();

export const data = new SlashCommandBuilder()
  .setName("candidature")
  .setDescription("Envoyer une candidature de staff");

export async function execute(interaction) {
  if (activeInteractions.has(interaction.user.id)) return;
  activeInteractions.add(interaction.user.id);

  try {
    const modal = new ModalBuilder()
      .setCustomId("candidatureModal")
      .setTitle("📩 Candidature de Staff ");

    const pseudoInput = new TextInputBuilder()
      .setCustomId("pseudoInput")
      .setLabel("Votre Pseudo")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const experienceInput = new TextInputBuilder()
      .setCustomId("experienceInput")
      .setLabel("Expérience en modération")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const motivationInput = new TextInputBuilder()
      .setCustomId("motivationInput")
      .setLabel("Pourquoi devenir staff ?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pseudoInput),
      new ActionRowBuilder().addComponents(experienceInput),
      new ActionRowBuilder().addComponents(motivationInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Erreur d'affichage du modal:", error);
  } finally {
    setTimeout(() => activeInteractions.delete(interaction.user.id), 5000);
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && i > 0) {
      context.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

export async function handleModalSubmit(interaction) {
  try {
    const pseudo = interaction.fields.getTextInputValue("pseudoInput");
    const experience = interaction.fields.getTextInputValue("experienceInput");
    const motivation = interaction.fields.getTextInputValue("motivationInput");

    const width = 900,
      height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(50, 50, width - 100, height - 100);
    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("📩 Candidature de Staff", width / 2, 100);

    ctx.textAlign = "left";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Pseudo:", 80, 180);
    ctx.font = "24px Arial";
    ctx.fillText(pseudo, 300, 180);

    ctx.font = "bold 28px Arial";
    ctx.fillText("Expérience:", 80, 260);
    ctx.font = "24px Arial";
    wrapText(ctx, experience, 80, 300, 720, 30);

    ctx.font = "bold 28px Arial";
    ctx.fillText("Motivation:", 80, 380);
    ctx.font = "24px Arial";
    wrapText(ctx, motivation, 80, 420, 720, 30);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "candidature.png",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("acceptCandidature")
        .setLabel("✅ Accepter")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("rejectCandidature")
        .setLabel("❌ Refuser")
        .setStyle(ButtonStyle.Danger)
    );

    const channel = interaction.client.channels.cache.get(
      "1340014452451315722"
    );
    if (channel) {
      await channel.send({ files: [attachment], components: [row] });
      await interaction.reply({
        content: "Votre candidature a été envoyée avec succès.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Erreur: Salon introuvable.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Erreur soumission candidature:", error);
    await interaction.reply({
      content: "Erreur lors de l'envoi de votre candidature.",
      ephemeral: true,
    });
  }
}
