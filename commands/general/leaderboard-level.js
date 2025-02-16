import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getLeaderboard } from "../../config/levels.js";
import { createCanvas, loadImage } from "canvas";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const canvasHeight = 700; // Hauteur ajustée pour ajouter les infos de l'utilisateur
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 🔹 Fond avec effet gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#10172A");
  gradient.addColorStop(1, "#1E2A47");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🔹 Bordure bleue moderne
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // 🔹 Titre du classement
  ctx.fillStyle = "#00A2FF";
  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🏆 Classement des Niveaux", canvasWidth / 2, 60);

  // 🔹 Séparateur titre
  ctx.strokeStyle = "#00A2FF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 80);
  ctx.lineTo(canvasWidth - 50, 80);
  ctx.stroke();

  // 🔹 Affichage des 5 premiers joueurs
  const topUsers = leaderboard.slice(0, 5);
  ctx.font = "22px Arial";
  ctx.textAlign = "left";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const baseY = 120 + i * 70; // Espacement optimisé

    // 🏅 Icônes pour le podium
    let rankIcon = "⬜";
    if (i === 0) rankIcon = "🥇";
    else if (i === 1) rankIcon = "🥈";
    else if (i === 2) rankIcon = "🥉";

    // Fetch user information
    const discordUser = await interaction.client.users
      .fetch(user.userId)
      .catch(() => null);
    const username = discordUser ? discordUser.username : "Inconnu";

    // 🔹 Affichage du rang + pseudo
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${rankIcon} ${i + 1}. ${username}`, 50, baseY);

    // 🔹 XP et Niveau
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.exp} XP`, canvasWidth - 350, baseY);
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, canvasWidth - 230, baseY);

    // 🔹 Barre de progression SOUS le pseudo
    const progressBarWidth = 300;
    const progressBarHeight = 14;
    const progress = Math.min(user.exp / (user.level * 100), 1);

    ctx.fillStyle = "#333";
    ctx.fillRect(50, baseY + 10, progressBarWidth, progressBarHeight);

    // 🔸 Barre dynamique (couleur selon avancement)
    ctx.fillStyle =
      progress > 0.7 ? "#00FF00" : progress > 0.4 ? "#FFA500" : "#FF0000";
    ctx.fillRect(
      50,
      baseY + 10,
      progressBarWidth * progress,
      progressBarHeight
    );

    // 🔹 Séparateur horizontal entre chaque joueur
    ctx.strokeStyle = "#0056B3";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, baseY + 35);
    ctx.lineTo(canvasWidth - 50, baseY + 35);
    ctx.stroke();
    ctx.setLineDash([]); // Réinitialiser après utilisation
  }

  // 🔹 Récupérer les infos de l'utilisateur exécutant la commande
  const commandUserId = interaction.user.id;
  const commandUserData = leaderboard.find((u) => u.userId === commandUserId);

  if (commandUserData) {
    const baseY = 500; // Position en dessous du top 5

    // 🔹 Titre section utilisateur
    ctx.fillStyle = "#00A2FF";
    ctx.font = "bold 30px Arial";
    ctx.fillText("📌 Tes Informations :", 50, baseY);

    // 🔹 Infos utilisateur
    ctx.font = "22px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 ${interaction.user.username}`, 50, baseY + 40);
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`XP: ${commandUserData.exp}`, 300, baseY + 40);
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau: ${commandUserData.level}`, 500, baseY + 40);

    // 🔹 Barre de progression utilisateur
    const progressBarWidth = 400;
    const progressBarHeight = 18;
    const progress = Math.min(
      commandUserData.exp / (commandUserData.level * 100),
      1
    );

    ctx.fillStyle = "#333";
    ctx.fillRect(50, baseY + 60, progressBarWidth, progressBarHeight);

    ctx.fillStyle =
      progress > 0.7 ? "#00FF00" : progress > 0.4 ? "#FFA500" : "#FF0000";
    ctx.fillRect(
      50,
      baseY + 60,
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
