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

  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // Fond noir
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Titre
  ctx.fillStyle = "#007BFF";
  ctx.font = "bold 40px Arial";
  ctx.fillText("🏆 Classement des Niveaux 🏆", 150, 50);

  // Dessin des joueurs
  const topUsers = leaderboard.slice(0, 10);
  ctx.font = "30px Arial";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `${i + 1}. ${user.username} - Niveau ${user.level} (${user.exp} XP)`,
      50,
      100 + i * 50
    );
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
