import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("unpause-giveaway")
  .setDescription("Reprendre un giveaway en pause")
  .addStringOption((option) =>
    option
      .setName("giveaway_id")
      .setDescription("L'ID du giveaway à reprendre")
      .setRequired(true)
  );

export async function execute(interaction) {
  const giveawayId = interaction.options.getString("giveaway_id");
  const giveaway = await db.get(`giveaways.${giveawayId}`);

  if (!giveaway) {
    return interaction.reply({
      content: ":x: Giveaway non trouvé.",
      ephemeral: true,
    });
  }

  // Reprendre le giveaway
  interaction.client.giveawaysManager.unpause(giveawayId);

  interaction.reply({
    content: `✅ Le giveaway avec l'ID ${giveawayId} a été repris.`,
    ephemeral: true,
  });
}
