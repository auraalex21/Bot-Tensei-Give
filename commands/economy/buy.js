import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();
const economyTable = db.table("economy");

const items = [
  {
    name: "Nitro classique",
    price: 10500,
    description: "Profitez de Discord Nitro avec des avantages exclusifs.",
  },
  {
    name: "Nitro boosté",
    price: 30000,
    description:
      "Obtenez Discord Nitro avec des boosts de serveur supplémentaires.",
  },
  {
    name: "500 robux",
    price: 5000,
    description: "Achetez 500 Robux pour vos jeux préférés sur Roblox.",
  },
  {
    name: "1.000 robux",
    price: 10000,
    description: "Achetez 1.000 Robux pour vos jeux préférés sur Roblox.",
  },
  {
    name: "2.000 robux",
    price: 20000,
    description: "Achetez 2.000 Robux pour vos jeux préférés sur Roblox.",
  },
  {
    name: "5.000 robux",
    price: 50000,
    description: "Achetez 5.000 Robux pour vos jeux préférés sur Roblox.",
  },
  {
    name: "10.000 robux",
    price: 100000,
    description: "Achetez 10.000 Robux pour vos jeux préférés sur Roblox.",
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
