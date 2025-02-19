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

    // 🎨 Arrière-plan style Solo Leveling
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#000814");
    gradient.addColorStop(1, "#001D3D");
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

    // 🔵 Aura bleue autour de l'avatar
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 7,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#1E90FF";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#1E90FF";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 📝 Texte stylisé
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 36px 'Arial'";
    ctx.fillText(user.username, 220, 90);

    ctx.fillStyle = "#A0C4FF";
    ctx.font = "22px 'Arial'";
    ctx.fillText(`🆔 ID: ${user.id}`, 220, 125);

    // 🏆 Niveau et rang
    ctx.fillStyle = "#1E90FF";
    ctx.font = "bold 30px 'Arial'";
    ctx.fillText(`LVL ${userData.level} (${userData.rank})`, 220, 200);

    // 🔵 Barre d'XP stylisée
    const xpX = 220,
      xpY = 250,
      xpWidth = 500,
      xpHeight = 25;
    const progress = userData.exp / userData.expToNext;

    ctx.fillStyle = "#0A192F";
    ctx.fillRect(xpX, xpY, xpWidth, xpHeight);

    const xpGradient = ctx.createLinearGradient(xpX, xpY, xpX + xpWidth, xpY);
    xpGradient.addColorStop(0, "#00A6FB");
    xpGradient.addColorStop(1, "#0582CA");
    ctx.fillStyle = xpGradient;
    ctx.fillRect(xpX, xpY, xpWidth * progress, xpHeight);

    ctx.strokeStyle = "#1E90FF";
    ctx.lineWidth = 3;
    ctx.strokeRect(xpX, xpY, xpWidth, xpHeight);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px 'Arial'";
    ctx.fillText(
      `XP: ${userData.exp} / ${userData.expToNext}`,
      xpX + xpWidth / 2 - 50,
      xpY + 18
    );

    // 💰 Argent
    ctx.fillStyle = "#1E90FF";
    ctx.font = "24px 'Arial'";
    ctx.fillText(`💰 Argent: ${userData.money} Coins`, 220, 300);

    // 🏅 Badges
    ctx.fillStyle = "#A0C4FF";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      220,
      340
    );

    // 📜 Séparation lumineuse
    ctx.strokeStyle = "#1E90FF";
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

// ✅ Ajout de la fonction manquante pour récupérer les données utilisateur
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
