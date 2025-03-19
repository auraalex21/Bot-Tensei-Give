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
    price: 200000,
    description: "Profitez de Discord Nitro avec des avantages exclusifs.",
    emoji: "✨",
  },
  {
    name: "Nitro Boost",
    price: 380000,
    description:
      "Obtenez Discord Nitro avec des boosts de serveur supplémentaires.",
    emoji: "🚀",
  },
  {
    name: "500 Robux",
    price: 340000,
    description: "Achetez 500 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "1.000 Robux",
    price: 460000,
    description: "Achetez 1.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "2.000 Robux",
    price: 750000,
    description: "Achetez 2.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "5.000 Robux",
    price: 1400000,
    description: "Achetez 5.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "10.000 Robux",
    price: 2400000,
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

    const canvas = createCanvas(1000, 1200);
    const ctx = canvas.getContext("2d");

    // Load background image or fallback to a solid color
    try {
      const background = await loadImage(
        "https://your-image-link.com/background.jpg"
      );
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw overlay and title
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 20;
    ctx.fillText("🛍️ Boutique des Rat", 50, 90);
    ctx.shadowBlur = 0;

    // Render items
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

    // Footer text
    ctx.font = "italic 26px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(
      "Cliquez sur un bouton ci-dessous pour acheter un article.",
      50,
      canvas.height - 50
    );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "shop.png",
    });

    // Generate buttons dynamically
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

    const userId = interaction.user.id;

    // Fetch user balance
    let userBalance = await economyTable.get(`${userId}.balance`);
    if (!userBalance) userBalance = 0;

    // Check if user has enough money
    if (userBalance < item.price) {
      return await interaction.followUp({
        content: `❌ Vous n'avez pas assez d'argent pour acheter **${
          item.name
        }**. Votre solde actuel est de **${userBalance.toLocaleString()}💸**.`,
        ephemeral: true,
      });
    }

    // Deduct item price from user balance
    await economyTable.set(`${userId}.balance`, userBalance - item.price);

    // Confirm purchase
    await interaction.followUp({
      content: `✅ Vous avez acheté **${
        item.name
      }** pour **${item.price.toLocaleString()}💸**. Votre nouveau solde est de **${(
        userBalance - item.price
      ).toLocaleString()}💸**.`,
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
