import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { QuickDB } from "quick.db";
import { getUserLevel, roleRewards } from "../../config/levels.js";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription(
    "Affiche les informations de l'utilisateur dans un style Solo Leveling"
  )
  .addUserOption((option) =>
    option.setName("target").setDescription("L'utilisateur ciblé")
  );

export async function execute(interaction) {
  try {
    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserDataFromDB(user.id, guildId);

    const width = 900,
      height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 Arrière-plan mystique façon Solo Leveling
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#020617");
    gradient.addColorStop(1, "#1E293B");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 🖼️ Avatar avec effet lumineux
    const avatar = await loadImage(
      user.displayAvatarURL({ format: "jpg", size: 256 })
    );
    const avatarX = 50,
      avatarY = 50,
      avatarSize = 130;

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

    // 🔵 Aura lumineuse autour de l'avatar
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 7,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#0EA5E9";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#0EA5E9";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 📝 Texte stylisé pour le pseudo
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 36px 'Arial'";
    ctx.fillText(user.username, 220, 90);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "22px 'Arial'";
    ctx.fillText(`🆔 ID: ${user.id}`, 220, 125);

    // 🏆 Affichage du niveau et rang
    ctx.fillStyle = "#FACC15";
    ctx.font = "bold 30px 'Arial'";
    ctx.fillText(`LVL ${userData.level} (${userData.rank})`, 220, 200);

    // 🔵 Barre d'XP stylisée
    const xpX = 220,
      xpY = 250,
      xpWidth = 500,
      xpHeight = 20;
    const progress = userData.exp / userData.expToNext;

    ctx.fillStyle = "#1E40AF";
    ctx.fillRect(xpX, xpY, xpWidth, xpHeight);
    ctx.fillStyle = "#FACC15";
    ctx.fillRect(xpX, xpY, xpWidth * progress, xpHeight);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 20px 'Arial'";
    ctx.fillText(
      `XP: ${userData.exp} / ${userData.expToNext}`,
      xpX + 10,
      xpY + 15
    );

    // 💰 Affichage des pièces
    ctx.fillStyle = "#FACC15";
    ctx.font = "24px 'Arial'";
    ctx.fillText(`💰 Argent: ${userData.money} Coins`, 220, 300);

    // 🏅 Badges
    ctx.fillStyle = "#38BDF8";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      220,
      340
    );

    // 📜 Séparation lumineuse
    ctx.strokeStyle = "#0EA5E9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 380);
    ctx.lineTo(850, 380);
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
