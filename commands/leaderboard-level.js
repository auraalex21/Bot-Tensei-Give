import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getLeaderboard } from "../config/levels.js";
import { createCanvas } from "canvas";

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

  const canvasWidth = 700;
  const canvasHeight = 600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fond avec dégradé bleu foncé pour un effet plus moderne
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#182848");
  gradient.addColorStop(1, "#0F172A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordure plus fine et nette
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Titre du classement avec effet ombre
  ctx.fillStyle = "#007BFF";
  ctx.font = "bold 32px Arial";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.fillText("🏆 Classement des Niveaux", 200, 50);
  ctx.shadowBlur = 0;

  // Séparateur
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 70);
  ctx.lineTo(canvasWidth - 50, 70);
  ctx.stroke();

  // Affichage des joueurs
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "20px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const yPosition = 120 + i * 50;

    // Icônes pour les meilleurs
    let rankIcon = "";
    if (i === 0) rankIcon = "🥇";
    else if (i === 1) rankIcon = "🥈";
    else if (i === 2) rankIcon = "🥉";

    // Nom d'utilisateur
    const username = user.username ? user.username : "Inconnu";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${rankIcon} ${i + 1}. ${username}`, 50, yPosition);

    // Niveau en doré
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, 450, yPosition);

    // Barre de progression XP plus esthétique
    const progressBarWidth = 180;
    const progressBarHeight = 12;
    const progress = Math.min(user.exp / (user.level * 100), 1);

    ctx.fillStyle = "#333";
    ctx.fillRect(50, yPosition + 8, progressBarWidth, progressBarHeight);

    ctx.fillStyle =
      progress > 0.7 ? "#00FF00" : progress > 0.4 ? "#FFA500" : "#FF0000";
    ctx.fillRect(
      50,
      yPosition + 8,
      progressBarWidth * progress,
      progressBarHeight
    );

    // XP affiché en vert
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.exp} XP`, 260, yPosition + 20);
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
