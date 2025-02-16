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

  // Fond avec un dégradé moderne
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#1E1E2E"); // Bleu foncé
  gradient.addColorStop(1, "#131322"); // Noir bleuté
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordure arrondie
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Titre du classement
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px Arial";
  ctx.fillText("🏆 Classement des Niveaux 🏆", 180, 50);

  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "20px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const yPosition = 100 + i * 50;

    let rankIcon = "";
    if (i === 0) rankIcon = "🥇";
    else if (i === 1) rankIcon = "🥈";
    else if (i === 2) rankIcon = "🥉";

    const username = user.username ? user.username : "Inconnu";

    // Affichage du rang et du nom d'utilisateur
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${rankIcon} ${i + 1}. ${username}`, 50, yPosition);

    // Niveau affiché à droite
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, 500, yPosition);

    // Barre de progression XP
    const progressBarWidth = 200;
    const progressBarHeight = 10;
    const progress = Math.min(user.exp / (user.level * 100), 1);

    ctx.fillStyle = "#444";
    ctx.fillRect(50, yPosition + 10, progressBarWidth, progressBarHeight);

    ctx.fillStyle = "#00FF00";
    ctx.fillRect(
      50,
      yPosition + 10,
      progressBarWidth * progress,
      progressBarHeight
    );

    // XP affiché à droite
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
