import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getLeaderboard } from "../config/levels.js";
import { createCanvas, loadImage } from "canvas";
import path from "path";
import fs from "fs";

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
  const canvasHeight = 600;
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

  // 🔹 Affichage des joueurs
  const topUsers = leaderboard.slice(0, 10);
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
    const text = `${rankIcon} ${i + 1}. ${username}`;
    const parts = text.split(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu);

    let x = 50;
    for (const part of parts) {
      if (/\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u.test(part)) {
        const emojiPath = path.resolve(
          __dirname,
          `../assets/twemoji/${part.codePointAt(0).toString(16)}.svg`
        );
        if (fs.existsSync(emojiPath)) {
          const img = await loadImage(emojiPath);
          ctx.drawImage(img, x, baseY - 20, 20, 20);
          x += 20;
        }
      } else {
        ctx.fillText(part, x, baseY);
        x += ctx.measureText(part).width;
      }
    }

    // 🔹 Barre de séparation avant l'XP
    ctx.strokeStyle = "#007BFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 370, baseY - 15);
    ctx.lineTo(canvasWidth - 370, baseY + 5);
    ctx.stroke();

    // 🔹 XP bien alignée
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.exp} XP`, canvasWidth - 350, baseY);

    // 🔹 Séparateur entre XP et Niveau
    ctx.strokeStyle = "#007BFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 250, baseY - 15);
    ctx.lineTo(canvasWidth - 250, baseY + 5);
    ctx.stroke();

    // 🔹 Niveau aligné à droite
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

    // 🔹 Séparateur horizontal moderne entre chaque joueur
    ctx.strokeStyle = "#0056B3";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, baseY + 35);
    ctx.lineTo(canvasWidth - 50, baseY + 35);
    ctx.stroke();
    ctx.setLineDash([]); // Réinitialiser après utilisation
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
