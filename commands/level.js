import { SlashCommandBuilder } from "discord.js";
import levels from "../config/levels";
import { createCanvas, loadImage } from "canvas";
import Discord from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Afficher le niveau et l'expérience d'un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont vous voulez voir le niveau")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const userLevel = await levels.getUserLevel(user.id, interaction.guild.id);

    const width = 700;
    const height = 250;
    const padding = 30;
    const avatarSize = 100;
    const progressBarWidth = 400;
    const progressBarHeight = 20;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Dégradé de fond amélioré
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#141E30");
    gradient.addColorStop(1, "#243B55");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Chargement de l'avatar
    const avatarURL = user.displayAvatarURL({ format: "png", size: 128 });
    let avatar;
    try {
      avatar = await loadImage(avatarURL);
    } catch (err) {
      console.error("Failed to load avatar image:", err);
      avatar = await loadImage(
        "https://cdn.discordapp.com/embed/avatars/0.png"
      );
    }

    // Dessiner l'avatar avec bordure et lumière
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      padding + avatarSize / 2,
      height / 2,
      avatarSize / 2 + 5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      avatar,
      padding,
      height / 2 - avatarSize / 2,
      avatarSize,
      avatarSize
    );
    ctx.restore();

    // Nom d'utilisateur avec effet ombré
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 5;
    ctx.fillText(user.tag, padding * 2 + avatarSize, height / 4);
    ctx.shadowBlur = 0;

    // Niveau en gras
    ctx.font = "24px Arial";
    ctx.fillStyle = "#dddddd";
    ctx.fillText(
      `Niveau ${userLevel.level}`,
      padding * 2 + avatarSize,
      height / 2
    );

    // Barre de progression avec bords arrondis
    ctx.fillStyle = "#444";
    ctx.fillRect(
      padding * 2 + avatarSize,
      height - padding - progressBarHeight,
      progressBarWidth,
      progressBarHeight
    );
    ctx.fillStyle = "#00ccff";
    const progress = userLevel.exp / (userLevel.level * 100); // Progression sur 100 * niveau
    ctx.beginPath();
    ctx.moveTo(padding * 2 + avatarSize, height - padding - progressBarHeight);
    ctx.lineTo(
      padding * 2 + avatarSize + progressBarWidth * progress,
      height - padding - progressBarHeight
    );
    ctx.lineTo(
      padding * 2 + avatarSize + progressBarWidth * progress,
      height - padding
    );
    ctx.lineTo(padding * 2 + avatarSize, height - padding);
    ctx.closePath();
    ctx.fill();

    // Expérience en blanc avec ombrage
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `Exp: ${userLevel.exp} / ${userLevel.level * 100}`,
      padding * 2 + avatarSize,
      height - padding - 5
    );

    // Convertir le canvas en buffer
    const buffer = canvas.toBuffer();
    const attachment = new Discord.AttachmentBuilder(buffer, {
      name: "level-info.png",
    });

    // Envoyer l'image
    interaction.reply({
      files: [attachment],
      flags: Discord.MessageFlags.Ephemeral,
    });
  },
};
