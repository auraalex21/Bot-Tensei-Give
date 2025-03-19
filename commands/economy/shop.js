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
  {
    name: "Grade VIP",
    price: 300000,
    description: "Obtenez un grade VIP exclusif sur le serveur.",
    emoji: "👑",
  },
  {
    name: "Grade Perso",
    price: 400000,
    description: "Obtenez un grade personnalisé sur le serveur.",
    emoji: "🎨",
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

    const itemsPerPage = 5;
    let currentPage = 0;

    // Utility function to wrap text
    function wrapText(ctx, text, maxWidth) {
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + word + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine.trim());
      }

      return lines;
    }

    const renderPage = async (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = items.slice(start, end);

      const canvas = createCanvas(1000, 1200);
      const ctx = canvas.getContext("2d");

      // Load background image or fallback to a gradient
      try {
        const background = await loadImage(
          "https://your-image-link.com/background.jpg"
        );
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      } catch {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#1e3c72");
        gradient.addColorStop(1, "#2a5298");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw title section
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(30, 30, canvas.width - 60, 100);
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.fillText("🛍️ Boutique des Rat", canvas.width / 2, 90);

      // Draw item cards
      const cardWidth = 910; // Increased by 10px
      const cardHeight = 160; // Increased by 10px
      const cardPadding = 20;
      const cardX = (canvas.width - cardWidth) / 2;

      pageItems.forEach((item, index) => {
        const cardY = 150 + index * (cardHeight + cardPadding);

        // Card background
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

        // Item emoji
        ctx.font = "bold 45px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "left";
        ctx.fillText(item.emoji, cardX + 20, cardY + 60);

        // Item name
        ctx.font = "bold 45px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.fillText(item.name, cardX + 80, cardY + 50);

        // Item description with wrapping
        ctx.font = "italic 35px Arial";
        ctx.fillStyle = "#CCCCCC";
        const descriptionLines = wrapText(
          ctx,
          item.description,
          cardWidth - 100
        );
        descriptionLines.forEach((line, lineIndex) => {
          ctx.fillText(line, cardX + 80, cardY + 90 + lineIndex * 40);
        });

        // Item price
        ctx.font = "bold 35px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "right";
        ctx.fillText(
          `💰 ${item.price.toLocaleString()}💸`,
          cardX + cardWidth - 20,
          cardY + 50
        );
      });

      // Footer text
      ctx.font = "italic 22px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.fillText(
        "Utilisez les boutons ci-dessous pour naviguer ou acheter.",
        canvas.width / 2,
        canvas.height - 30
      );

      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "shop.png",
      });

      // Generate buttons dynamically
      const buttonRows = [];
      for (let i = 0; i < pageItems.length; i += 3) {
        const row = new ActionRowBuilder();
        pageItems.slice(i, i + 3).forEach((item, index) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`buy_${start + i + index}`)
              .setLabel(`${item.emoji} ${item.name}`)
              .setStyle(ButtonStyle.Success)
          );
        });
        buttonRows.push(row);
      }

      // Add pagination buttons
      const paginationRow = new ActionRowBuilder();
      if (page > 0) {
        paginationRow.addComponents(
          new ButtonBuilder()
            .setCustomId("prev_page")
            .setLabel("⬅️ Page précédente")
            .setStyle(ButtonStyle.Primary)
        );
      }
      if (end < items.length) {
        paginationRow.addComponents(
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("➡️ Page suivante")
            .setStyle(ButtonStyle.Primary)
        );
      }
      buttonRows.push(paginationRow);

      await interaction.editReply({
        files: [attachment],
        components: buttonRows,
      });
    };

    await renderPage(currentPage);

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === interaction.user.id &&
        (i.customId === "prev_page" || i.customId === "next_page"),
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "prev_page") currentPage--;
      if (i.customId === "next_page") currentPage++;
      await renderPage(currentPage);
      if (!i.deferred && !i.replied) {
        await i.deferUpdate();
      }
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] });
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
export async function validateInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isChatInputCommand())
    return false;
  return true;
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
    let userBalance = await economyTable.get(`balance_${userId}`);
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
    await economyTable.set(`balance_${userId}`, userBalance - item.price);

    // Notify the user about the purchase
    await interaction.followUp({
      content: `✅ Vous avez acheté **${
        item.name
      }** pour **${item.price.toLocaleString()}💸**. Votre nouveau solde est de **${(
        userBalance - item.price
      ).toLocaleString()}💸**.`,
      ephemeral: true,
    });

    // Send a DM to the specified user with purchase details
    const adminUserId = "378998346712481812";
    const adminUser = await interaction.client.users.fetch(adminUserId);
    if (adminUser) {
      await adminUser.send(
        `🛒 **${interaction.user.tag}** (ID: ${
          interaction.user.id
        }) a acheté **${item.name}** pour **${item.price.toLocaleString()}💸**.`
      );
    }
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
