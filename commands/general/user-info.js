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
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply();

    const user = interaction.options.getUser("target") || interaction.user;
    const guildId = interaction.guild.id;
    const userData = await getUserDataFromDB(user.id, guildId);

    if (!interaction.isRepliable()) return;

    const width = 900,
      height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#000814");
    gradient.addColorStop(1, "#001D3D");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const avatarURL = user.displayAvatarURL({
      format: "png",
      dynamic: false,
      size: 256,
    });
    let avatar;

    try {
      avatar = await loadImage(avatarURL);
    } catch (err) {
      console.error("❌ Erreur de chargement de l'avatar :", err);
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

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 36px 'Arial'";
    ctx.fillText(user.username, 220, 90);

    ctx.fillStyle = "#A0C4FF";
    ctx.font = "22px 'Arial'";
    ctx.fillText(`🆔 ID: ${user.id}`, 220, 125);

    ctx.fillStyle = "#1E90FF";
    ctx.font = "24px 'Arial'";
    ctx.fillText(`💰 Argent: ${userData.money}€`, 220, 160);

    ctx.fillStyle = "#A0C4FF";
    ctx.fillText(
      `🏆 Badges: ${userData.badges.join(", ") || "Aucun"}`,
      220,
      190
    );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "user-info.png",
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ files: [attachment] });
    } else {
      await interaction.editReply({ files: [attachment] });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du user-info :", error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "❌ Une erreur est survenue.",
      });
    } else {
      await interaction.reply({
        content: "❌ Une erreur est survenue.",
      });
    }
  }
}

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
