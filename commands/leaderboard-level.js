import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getLeaderboard } from "../config/levels.js";
import { createCanvas, loadImage } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("leaderboard-level")
  .setDescription("Afficher le classement des niveaux");

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const leaderboard = await getLeaderboard(guildId);

  if (leaderboard.length === 0) {
    return interaction.reply({
      content: "❌ Aucun utilisateur trouvé dans le classement.",
      ephemeral: true,
    });
  }

  const canvasWidth = 800;
  const canvasHeight = 600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fond bleu sombre avec bordures
  ctx.fillStyle = "#0b1622";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Titre du classement
  ctx.fillStyle = "#007BFF";
  ctx.font = "bold 36px Arial";
  ctx.fillText("🏆 Classement des Niveaux 🏆", 200, 50);

  // Dessin des joueurs avec un style proche de l'image fournie
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "28px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const yPosition = 100 + i * 50;

    // Nom du joueur
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${i + 1}. ${user.username}`, 50, yPosition);

    // Niveau
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, 300, yPosition);

    // Expérience
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`Exp: ${user.exp} XP`, 500, yPosition);

    // Barre d'expérience
    const barWidth = 200;
    const barHeight = 20;
    const progress = Math.min(user.exp / 100, 1);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(550, yPosition - 15, barWidth, barHeight);

    ctx.fillStyle = "#00FF00";
    ctx.fillRect(550, yPosition - 15, barWidth * progress, barHeight);
  }

  // Générer l'image
  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "leaderboard.png",
  });

  return interaction.reply({
    content: "Voici le classement des niveaux :",
    files: [attachment],
    ephemeral: false,
  });
}
