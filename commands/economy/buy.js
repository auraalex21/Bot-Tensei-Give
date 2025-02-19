import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

const items = [
  {
    name: "Nitro Classique",
    price: 13000,
    description: "Profitez de Discord Nitro avec des avantages exclusifs.",
    emoji: "✨",
  },
  {
    name: "Nitro Boosté",
    price: 40000,
    description:
      "Obtenez Discord Nitro avec des boosts de serveur supplémentaires.",
    emoji: "🚀",
  },
  {
    name: "500 Robux",
    price: 7000,
    description: "Achetez 500 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "1.000 Robux",
    price: 14000,
    description: "Achetez 1.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "2.000 Robux",
    price: 28000,
    description: "Achetez 2.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "5.000 Robux",
    price: 70000,
    description: "Achetez 5.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
  {
    name: "10.000 Robux",
    price: 140000,
    description: "Achetez 10.000 Robux pour vos jeux préférés sur Roblox.",
    emoji: "💎",
  },
];

export const data = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Acheter un article de la boutique")
  .addIntegerOption((option) =>
    option
      .setName("item")
      .setDescription("Le numéro de l'article à acheter")
      .setRequired(true)
  );

export async function execute(interaction) {
  const itemIndex = interaction.options.getInteger("item") - 1;

  if (itemIndex < 0 || itemIndex >= items.length) {
    return interaction.reply({
      content: "❌ Article invalide.",
      ephemeral: true,
    });
  }

  const item = items[itemIndex];
  const userId = interaction.user.id;
  const balance = (await economyTable.get(`balance_${userId}`)) || 0;

  if (balance < item.price) {
    return interaction.reply({
      content: "❌ Vous n'avez pas assez d'argent pour acheter cet article.",
      ephemeral: true,
    });
  }

  await economyTable.set(`balance_${userId}`, balance - item.price);

  const embed = new EmbedBuilder()
    .setColor("#00FF00")
    .setTitle("🛒 Achat réussi")
    .setDescription(
      `Vous avez acheté **${item.name}** pour **${
        item.price
      }💸**.\nVotre nouveau solde : **${balance - item.price}💸**.`
    )
    .setFooter({ text: "Merci pour votre achat !" });

  await interaction.reply({ embeds: [embed] });
}
