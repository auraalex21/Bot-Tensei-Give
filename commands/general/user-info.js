import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { QuickDB } from "quick.db";
import { getUserLevel, roleRewards } from "../../config/levels.js"; // ✅ Import du système de niveaux

// Initialisation de la base de données
const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription("Affiche les informations de l'utilisateur sur un canvas")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("L'utilisateur dont vous voulez voir les informations")
  );

export async function execute(interaction) {
  try {
    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserDataFromDB(user.id, guildId);

    // 📏 Dimensions du canvas
    const width = 850;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 Dégradé de fond
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#090D22");
    gradient.addColorStop(1, "#12193C");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 🖼️ Charger l'avatar
    const avatar = await loadImage(
      user.displayAvatarURL({ format: "jpg", size: 256 })
    );

    // 🔵 Avatar avec effet lumineux
    const avatarX = 50,
      avatarY = 50,
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

    // 🏆 Effet de bordure lumineuse dorée
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 5,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.stroke();

    // ✍️ Texte Stylisé (Nom d'utilisateur & Level)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(user.username, 200, 80);

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`LVL ${userData.level} (${userData.rank})`, 200, 120);

    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#A9A9A9";
    ctx.fillText(`🆔 ID: ${user.id}`, 200, 120);

    // 🔵 Barre d'XP
    const xpWidth = 500;
    const xpHeight = 15;
    const xpX = 200,
      xpY = 140;
    const progress = userData.exp / userData.expToNext;

    ctx.fillStyle = "#222A56";
    ctx.fillRect(xpX, xpY, xpWidth, xpHeight);

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(xpX, xpY, xpWidth * progress, xpHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      `XP: ${userData.exp} / ${userData.expToNext}`,
      xpX + 10,
      xpY + 12
    );

    // 💰 Argent de l'utilisateur
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`💰 Argent: ${userData.money} Coins`, 200, 190);

    // 🏅 Badges
    ctx.fillStyle = "#87CEEB";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      200,
      230
    );

    // 📜 Ligne de séparation
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 270);
    ctx.lineTo(800, 270);
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
async function getUserDataFromDB(userId, guildId) {
  const money = (await economyTable.get(`balance_${userId}`)) || 0;
  const badges = (await db.get(`badges_${userId}`)) || [];
  const levelData = await getUserLevel(userId, guildId);

  // 🔥 Trouver le rang basé sur le niveau
  let rank = "Débutant";
  for (const reward of roleRewards) {
    if (levelData.level >= reward.level) {
      rank = reward.nom;
    }
  }

  return {
    money,
    badges,
    level: levelData.level,
    exp: levelData.exp,
    expToNext: levelData.level * 100,
    rank,
  };
}
