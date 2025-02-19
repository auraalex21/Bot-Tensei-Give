import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { QuickDB } from "quick.db";

// Initialisation des bases de données
const db = new QuickDB();
const economyTable = db.table("economy");
const levelTable = db.table("levels_");

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription(
    "Affiche les informations de l'utilisateur sous forme de carte"
  )
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("L'utilisateur dont vous voulez voir les infos")
  );

export async function execute(interaction) {
  try {
    const user = interaction.options.getUser("target") || interaction.user;
    const userData = await getUserDataFromDB(user.id);

    // 📏 Dimensions du canvas
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 Dégradé de fond inspiré de Solo Leveling
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A0F2C");
    gradient.addColorStop(0.5, "#161D4E");
    gradient.addColorStop(1, "#1A1F4A");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 🔵 Effet de glow autour du cadre
    ctx.shadowColor = "rgba(50, 100, 255, 0.7)";
    ctx.shadowBlur = 25;
    ctx.strokeStyle = "rgba(50, 100, 255, 0.9)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    // 🖼️ Charger et afficher l'avatar de l'utilisateur
    const avatar = await loadImage(
      user.displayAvatarURL({ format: "jpg", size: 256 })
    );
    const avatarX = 40,
      avatarY = 40,
      avatarSize = 120;
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // 🏆 Bordure dorée autour de l'avatar
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 5,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // ✍️ Texte : Nom de l'utilisateur et ID
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px SoloLeveling, sans-serif";
    ctx.fillText(user.username, 200, 70);

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#A9A9A9";
    ctx.fillText(`🆔 ID: ${user.id}`, 200, 100);

    // 📈 Affichage du niveau
    ctx.font = "28px SoloLeveling, sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`LVL ${userData.level}`, 650, 70);

    // 🔷 Barre d'XP stylisée
    const xpBarWidth = 450;
    const xpBarHeight = 18;
    const xpProgress = userData.xp / userData.xpNeeded;
    const filledWidth = xpBarWidth * xpProgress;

    ctx.fillStyle = "#222"; // Fond de la barre d'XP
    ctx.fillRect(200, 120, xpBarWidth, xpBarHeight);

    ctx.fillStyle = "#FFD700"; // Barre remplie (dorée)
    ctx.fillRect(200, 120, filledWidth, xpBarHeight);

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`XP: ${userData.xp} / ${userData.xpNeeded}`, 220, 135);

    // 💰 Argent de l'utilisateur
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`💰 Argent: ${userData.money} Coins`, 200, 180);

    // 🏅 Badges
    ctx.fillStyle = "#87CEEB";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      200,
      220
    );

    // 📜 Ligne de séparation lumineuse
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 260);
    ctx.lineTo(750, 260);
    ctx.stroke();

    // 📤 Envoi de l'image générée
    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "user-info.png",
    });
    await interaction.reply({ files: [attachment] });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du user-info :", error);
    await interaction.reply({
      content: "❌ Une erreur s'est produite.",
      ephemeral: true,
    });
  }
}

// 📌 Fonction pour récupérer les données utilisateur depuis la BDD
async function getUserDataFromDB(userId) {
  const money = (await economyTable.get(`balance_${userId}`)) || 0;
  const badges = (await db.get(`badges_${userId}`)) || [];
  const levelData = (await levelTable.get(`levels_${userId}`)) || {
    level: 1,
    xp: 0,
  };
  const xpNeeded = levelData.level * 100; // Progression d'XP

  return { money, badges, level: levelData.level, xp: levelData.xp, xpNeeded };
}
