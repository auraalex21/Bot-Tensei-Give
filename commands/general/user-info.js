import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { QuickDB } from "quick.db";
import { getUserLevel, roleRewards } from "../../config/levels.js";

const db = new QuickDB();
const economyTable = db.table("economy");

export const data = new SlashCommandBuilder()
  .setName("user-info")
  .setDescription("Affiche un profil stylisé à la Solo Leveling")
  .addUserOption((option) =>
    option.setName("target").setDescription("L'utilisateur ciblé")
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply(); // Prévenir Discord d'un délai dans la réponse

    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserDataFromDB(user.id, guildId);

    // 🖼️ Configuration du canvas
    const width = 900,
      height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🎨 Arrière-plan style Solo Leveling
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#000814");
    gradient.addColorStop(1, "#001D3D");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 🖼️ Avatar avec effet lumineux
    const avatarURL = user.displayAvatarURL({ format: "png", size: 256 });
    let avatar;

    try {
      avatar = await loadImage(avatarURL); // Charger l'avatar
    } catch (err) {
      console.error("Erreur de chargement de l'avatar : ", err);
      avatar = await loadImage(
        "https://media.discordapp.net/attachments/1339309785400737853/1341659383326838845/Tensei.png?ex=67b6cd2b&is=67b57bab&hm=c280002d08d57a501506ca3656fe98409aad99b21ae628cb15af33779b6dd92c&=&format=webp&quality=lossless&width=534&height=519"
      );
    }

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

    // 💰 Argent
    ctx.fillStyle = "#1E90FF";
    ctx.font = "24px 'Arial'";
    ctx.fillText(`💰 Argent: ${userData.money}€`, 220, 160);

    // 🏅 Badges
    ctx.fillStyle = "#A0C4FF";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      220,
      190
    );

    // 📜 Séparation lumineuse
    ctx.strokeStyle = "#1E90FF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 220);
    ctx.lineTo(850, 220);
    ctx.stroke();

    // 🏆 Niveau et rang sous la barre séparatrice
    ctx.fillStyle = "#1E90FF";
    ctx.font = "bold 30px 'Arial'";
    ctx.fillText(`LVL ${userData.level} (${userData.rank})`, 220, 270);

    // 🔵 Barre d'XP stylisée
    const xpX = 220,
      xpY = 320,
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

    // 📤 Envoi de l'image générée
    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "user-info.png",
    });
    await interaction.editReply({ files: [attachment] });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du user-info :", error);

    // Gérer les erreurs
    if (error.message === "Unsupported image type") {
      // Fallback image pour les erreurs
      const fallbackCanvas = createCanvas(900, 550);
      const fallbackCtx = fallbackCanvas.getContext("2d");

      fallbackCtx.fillStyle = "#FF0000";
      fallbackCtx.fillRect(0, 0, 900, 550);

      fallbackCtx.fillStyle = "#FFFFFF";
      fallbackCtx.font = "bold 36px 'Arial'";
      fallbackCtx.fillText(
        "❌ Erreur lors de la génération de l'image",
        50,
        275
      );

      const fallbackBuffer = fallbackCanvas.toBuffer();
      const fallbackAttachment = new AttachmentBuilder(fallbackBuffer, {
        name: "error.png",
      });

      await interaction.editReply({
        content:
          "❌ Une erreur s'est produite lors de la génération de l'image.",
        files: [fallbackAttachment],
        flags: 64,
      });
    } else {
      await interaction.reply({
        content: "❌ Une erreur s'est produite.",
        ephemeral: true,
      });
    }
  }
}

// ✅ Fonction de récupération des données utilisateur
async function getUserDataFromDB(userId, guildId) {
  const money = (await economyTable.get(`balance_${userId}`)) || 0;
  const badges = (await db.get(`badges_${guildId}_${userId}`)) || [];
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
