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

  const canvasWidth = 900;
  const canvasHeight = 700;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fond avec gradient pour un meilleur rendu
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#0F172A");
  gradient.addColorStop(1, "#1E293B");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordure stylisée
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Titre du classement
  ctx.fillStyle = "#007BFF";
  ctx.font = "bold 42px Arial";
  ctx.fillText("🏆 Classement des Niveaux 🏆", 230, 70);

  // Dessin des joueurs avec un meilleur alignement
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "30px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const yPosition = 120 + i * 60;

    // Vérification du nom d'utilisateur
    const username = user.username ? user.username : "Inconnu";

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${i + 1}. ${username}`, 50, yPosition);

    // Niveau
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, 350, yPosition);

    // Expérience
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`Exp: ${user.exp} XP`, 550, yPosition);

    // Barre d'expérience améliorée
    const barWidth = 250;
    const barHeight = 25;
    const progress = Math.min(user.exp / 100, 1);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(700, yPosition - 20, barWidth, barHeight);

    ctx.fillStyle = "#00FF00";
    ctx.fillRect(700, yPosition - 20, barWidth * progress, barHeight);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(700, yPosition - 20, barWidth, barHeight);
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
