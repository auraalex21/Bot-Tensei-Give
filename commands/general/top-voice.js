import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getTopVoiceUsers } from "../../config/levels.js";
import { createCanvas } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("top-voice")
  .setDescription(
    "Afficher le classement des utilisateurs par activité vocale"
  );

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const topUsers = await getTopVoiceUsers(guildId);

  if (!topUsers.length) {
    return interaction.reply({
      content: "❌ Aucun utilisateur trouvé dans le classement vocal.",
      ephemeral: true,
    });
  }

  const canvasWidth = 900;
  const canvasHeight = 600;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0A192F";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#007BFF";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = "#00A2FF";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🏆 Classement Vocal", canvasWidth / 2, 60);

  ctx.font = "22px Arial";
  ctx.textAlign = "left";

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const baseY = 120 + i * 70;
    const rankIcon = ["🥇", "🥈", "🥉"][i] || `#${i + 1}`;

    const discordUser = await interaction.client.users
      .fetch(user.userId)
      .catch(() => null);
    const username = discordUser ? discordUser.username : "Utilisateur inconnu";

    const totalMinutes = Math.floor(user.voiceTime / 60000) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = `${hours}h ${minutes}min`;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${rankIcon} ${username}`, 50, baseY);
    ctx.fillStyle = "#00FF00";
    ctx.fillText(timeString, canvasWidth - 200, baseY);

    ctx.strokeStyle = "#0056B3";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, baseY + 35);
    ctx.lineTo(canvasWidth - 50, baseY + 35);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "top-voice.png",
  });

  return interaction.reply({
    content: "📊 Voici le classement des utilisateurs par activité vocale :",
    files: [attachment],
  });
}
