import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";

const db = new QuickDB();
const economyTable = db.table("economy");

const items = [
  {
    name: "Nitro Classique",
    price: 100000,
    description: "Profitez de Discord Nitro avec des avantages exclusifs.",
    emoji: "✨",
  },
  {
    name: "Nitro Boost",
    price: 180000,
    description:
      "Obtenez Discord Nitro avec des boosts de serveur supplémentaires.",
    emoji: "🚀",
  },
  {
    name: "500 Robux",
    price: 80000,
    description: "Achetez 500 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "1.000 Robux",
    price: 140000,
    description: "Achetez 1.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "2.000 Robux",
    price: 280000,
    description: "Achetez 2.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "5.000 Robux",
    price: 700000,
    description: "Achetez 5.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "10.000 Robux",
    price: 1400000,
    description: "Achetez 10.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
];

export const data = new SlashCommandBuilder()
  .setName("shop")
  .setDescription(
    "Afficher la boutique avec un design inspiré de Solo Leveling."
  );

export async function execute(interaction) {
  try {
    if (interaction.replied || interaction.deferred) return;
    await interaction.deferReply();

    const width = 1000,
      height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    try {
      const background = await loadImage(
        "https://your-image-link.com/background.jpg"
      );
      ctx.drawImage(background, 0, 0, width, height);
    } catch (err) {
      console.error("❌ Impossible de charger l'image d'arrière-plan :", err);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(30, 30, width - 60, height - 60);

    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 20;
    ctx.fillText("🛍️ Boutique des Chasseurs", 50, 90);
    ctx.shadowBlur = 0;

    ctx.font = "30px Arial";
    ctx.fillStyle = "#FFFFFF";
    items.forEach((item, index) => {
      const y = 160 + index * 130;
      ctx.fillText(`${item.emoji} ${index + 1}. ${item.name}`, 50, y);
      ctx.fillText(`💰 ${item.price.toLocaleString()}💸`, 750, y);
      ctx.font = "italic 24px Arial";
      ctx.fillText(item.description, 50, y + 35);
      ctx.font = "30px Arial";
    });

    ctx.font = "italic 26px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(
      "Cliquez sur un bouton ci-dessous pour acheter un article.",
      50,
      height - 50
    );

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "shop.png" });

    const buttonRows = [];
    for (let i = 0; i < items.length; i += 3) {
      const row = new ActionRowBuilder();
      items.slice(i, i + 3).forEach((item, index) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_${i + index}`)
            .setLabel(`${item.emoji} ${item.name}`)
            .setStyle(ButtonStyle.Success)
        );
      });
      buttonRows.push(row);
    }

    await interaction.editReply({
      files: [attachment],
      components: buttonRows,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du shop :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.followUp({
        content: "❌ Une erreur s'est produite.",
        ephemeral: true,
      });
    }
  }
}

export async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;

  try {
    await interaction.deferUpdate();
    const customId = interaction.customId;

    if (!customId.startsWith("buy_")) return;

    const itemIndex = parseInt(customId.split("_")[1]);
    const item = items[itemIndex];
    if (!item) return;

    await interaction.followUp({
      content: `Vous avez sélectionné **${
        item.name
      }** pour **${item.price.toLocaleString()}💸**.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la gestion du bouton :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur s'est produite.",
        ephemeral: true,
      });
    }
  }
}
