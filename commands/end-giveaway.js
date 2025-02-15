import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("end-giveaway")
    .setDescription("Terminer un giveaway")
    .addStringOption((option) =>
      option
        .setName("giveaway_id")
        .setDescription("L'ID du giveaway à terminer")
        .setRequired(true)
    ),

  async execute(interaction) {
    const giveawayId = interaction.options.getString("giveaway_id");
    const giveaway = await db.get(`giveaways.${giveawayId}`);

    if (!giveaway) {
      return interaction.reply({
        content: ":x: Giveaway non trouvé.",
        ephemeral: true,
      });
    }

    // Terminer le giveaway
    interaction.client.giveawaysManager.end(giveawayId);

    interaction.reply({
      content: `✅ Le giveaway avec l'ID ${giveawayId} a été terminé.`,
      ephemeral: true,
    });
  },
};
