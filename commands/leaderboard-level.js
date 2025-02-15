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

  // Fond avec une couleur sobre
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordure
  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Titre du classement
  ctx.fillStyle = "#007BFF";
  ctx.font = "bold 36px Arial";
  ctx.fillText("🏆 Classement des Niveaux 🏆", 200, 50);

  // Dessin des joueurs
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "28px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const yPosition = 100 + i * 50;

    const username = user.username ? user.username : "Inconnu";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${i + 1}. ${username}`, 50, yPosition);

    ctx.fillStyle = "#FFD700";
    ctx.fillText(`Niveau ${user.level}`, 350, yPosition);

    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.exp} XP`, 550, yPosition);
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
