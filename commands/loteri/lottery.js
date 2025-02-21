import { QuickDB } from "quick.db";
import { SlashCommandBuilder } from "discord.js";

const db = new QuickDB();
const LOTTERY_PRICE = 100; // Prix d'un ticket

export default {
  data: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription("🎟️ Acheter un ticket de loterie"),
  async execute(interaction) {
    let userId = interaction.user.id;
    let userBalance = (await db.get(`balance_${userId}`)) || 0;

    if (userBalance < LOTTERY_PRICE) {
      return interaction.reply({
        content: "❌ Tu n'as pas assez d'argent pour acheter un ticket !",
        ephemeral: true,
      });
    }

    // Déduire le coût du ticket
    await db.sub(`balance_${userId}`, LOTTERY_PRICE);

    // Ajouter un ticket au joueur
    let userTickets = (await db.get(`tickets_${userId}`)) || 0;
    await db.set(`tickets_${userId}`, userTickets + 1);

    return interaction.reply({
      content: `🎟️ Tu as acheté un ticket ! Tu en as maintenant **${
        userTickets + 1
      }**.`,
      ephemeral: false,
    });
  },
};
