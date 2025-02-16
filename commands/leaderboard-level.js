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

  const canvasWidth = 800;
  const canvasHeight = 600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 🔹 Fond avec effet gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#10172A");
  gradient.addColorStop(1, "#182848");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🔹 Bordure bleue moderne
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // 🔹 Titre du classement
  ctx.fillStyle = "#00A2FF";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🏆 Classement des Niveaux", canvasWidth / 2, 60);

  // 🔹 Séparateur
  ctx.strokeStyle = "#00A2FF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 80);
  ctx.lineTo(canvasWidth - 50, 80);
  ctx.stroke();

  // 🔹 Affichage des joueurs
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "22px Arial";
  ctx.textAlign = "left";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const baseY = 120 + i * 70; // Espacement amélioré

    // 🏅 Icônes pour le podium
    let rankIcon = "";
    if (i === 0) rankIcon = "🥇";
    else if (i === 1) rankIcon = "🥈";
    else if (i === 2) rankIcon = "🥉";

    // 🔹 Pseudo
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `${rankIcon} ${i + 1}. ${user.username || "Inconnu"}`,
      50,
      baseY
    );

    // 🔹 XP à droite du pseudo
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.exp} XP`, 300, baseY);

    // 🔹 Niveau aligné à droite
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "right";
    ctx.fillText(`Niveau ${user.level}`, canvasWidth - 50, baseY);

    // 🔹 Barre de progression sous le pseudo
    const progressBarWidth = 250;
    const progressBarHeight = 14;
    const progress = Math.min(user.exp / (user.level * 100), 1);

    ctx.fillStyle = "#333";
    ctx.fillRect(50, baseY + 10, progressBarWidth, progressBarHeight);

    // 🔸 Barre dynamique (couleur selon l'avancement)
    ctx.fillStyle =
      progress > 0.7 ? "#00FF00" : progress > 0.4 ? "#FFA500" : "#FF0000";
    ctx.fillRect(
      50,
      baseY + 10,
      progressBarWidth * progress,
      progressBarHeight
    );
  }

  // 🔹 Générer l'image
  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "leaderboard.png",
  });

  return interaction.reply({
    content: "Voici le classement des niveaux :",
    files: [attachment],
    ephemeral: false,
  });
}
