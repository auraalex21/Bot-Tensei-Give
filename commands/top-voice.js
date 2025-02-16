import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getTopVoiceUsers } from "../config/levels.js";
import { createCanvas } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("top-voice")
  .setDescription(
    "Afficher le classement des utilisateurs par activité vocale"
  );

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const topUsers = await getTopVoiceUsers(guildId);

  if (topUsers.length === 0) {
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
  ctx.fillText("🏆 Classement des Voix", canvasWidth / 2, 60);

  // 🔹 Séparateur titre
  ctx.strokeStyle = "#00A2FF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 80);
  ctx.lineTo(canvasWidth - 50, 80);
  ctx.stroke();

  // 🔹 Affichage des joueurs
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

    // 🔹 Temps vocal bien aligné
    ctx.fillStyle = "#00FF00";
    ctx.fillText(`${user.voice} minutes`, canvasWidth - 350, baseY);

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
    name: "top-voice.png",
  });

  return interaction.reply({
    content: "Voici le classement des utilisateurs par activité vocale :",
    files: [attachment],
    ephemeral: false,
  });
}
