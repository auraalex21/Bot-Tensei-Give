import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";

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
    name: "Nitro Booste",
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
  .setDescription("Afficher la boutique avec les articles disponibles.");

export async function execute(interaction) {
  try {
    if (interaction.replied || interaction.deferred) return; // Empêche une double réponse
    await interaction.deferReply(); // Évite l'expiration de l'interaction

    const width = 800;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Arrière-plan
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#141E30");
    gradient.addColorStop(1, "#243B55");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Titre du shop
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("🛒 Boutique", 50, 50);

    // Affichage des items
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#FFFFFF";
    items.forEach((item, index) => {
      const y = 100 + index * 90;
      ctx.fillText(`${item.emoji} ${index + 1}. ${item.name}`, 50, y);
      ctx.fillText(`Prix: ${item.price}💸`, 400, y);
      ctx.fillText(item.description, 50, y + 25);
    });

    // Message footer
    ctx.font = "italic 18px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(
      "Utilisez les boutons ci-dessous pour acheter un article.",
      50,
      height - 30
    );

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "shop.png" });

    // Création des boutons
    const rows = [];
    for (let i = 0; i < items.length; i += 5) {
      const row = new ActionRowBuilder();
      items.slice(i, i + 5).forEach((_, index) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_${i + index}`)
            .setLabel(`${items[i + index].name}`)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    await interaction.editReply({ files: [attachment], components: rows });
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du shop :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur s'est produite lors de l'affichage du shop.",
        ephemeral: true,
      });
    }
  }
}

// Gestion des boutons d'achat
export async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;

  console.log(`🔹 Bouton cliqué : ${interaction.customId}`); // Débogage

  try {
    if (interaction.replied || interaction.deferred) return; // Évite une double réponse
    await interaction.deferUpdate(); // Évite l'expiration de l'interaction

    const customId = interaction.customId;
    if (customId.startsWith("buy_")) {
      const itemIndex = parseInt(customId.split("_")[1]);
      const item = items[itemIndex];

      if (!item) {
        return interaction.followUp({
          content: "❌ Article invalide.",
          ephemeral: true,
        });
      }

      // Demande de confirmation
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_${itemIndex}`)
          .setLabel(`Confirmer l'achat de ${item.name}`)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_${itemIndex}`)
          .setLabel("Annuler")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.followUp({
        content: `Voulez-vous vraiment acheter **${item.name}** pour **${item.price}💸** ?`,
        components: [confirmRow],
        ephemeral: true,
      });
    } else if (customId.startsWith("confirm_")) {
      const itemIndex = parseInt(customId.split("_")[1]);
      const item = items[itemIndex];

      const userId = interaction.user.id;
      let userBalance = (await economyTable.get(`balance_${userId}`)) || 0;

      if (userBalance >= item.price) {
        userBalance -= item.price;
        await economyTable.set(`balance_${userId}`, userBalance);

        await interaction.followUp({
          content: `✅ Vous avez acheté **${item.name}** pour **${item.price}💸**.\n💰 **Nouveau solde**: ${userBalance}💸`,
          ephemeral: true,
        });

        // Notification à l'administrateur
        const admin = await interaction.client.users.fetch(
          "378998346712481812"
        );
        await admin.send(
          `💸 **Transaction réalisée**\n**Utilisateur**: <@${userId}>\n**Article**: ${item.name}\n**Prix**: ${item.price}💸`
        );
      } else {
        await interaction.followUp({
          content: "❌ Vous n'avez pas assez d'argent.",
          ephemeral: true,
        });
      }
    } else if (customId.startsWith("cancel_")) {
      await interaction.followUp({
        content: "❌ Achat annulé.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'achat :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur s'est produite lors de l'achat.",
        ephemeral: true,
      });
    }
  }
}
