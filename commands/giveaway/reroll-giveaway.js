import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const name = "reroll-giveaway";

export const data = new SlashCommandBuilder()
  .setName("reroll-giveaway")
  .setDescription("Relancer un giveaway")
  .addStringOption((option) =>
    option
      .setName("giveaway_id")
      .setDescription("L'ID du giveaway à relancer")
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

  try {
    await interaction.client.giveawaysManager.reroll(giveawayId);
    interaction.reply({
      content: `✅ Le giveaway avec l'ID ${giveawayId} a été relancé.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Erreur lors du reroll du giveaway :", error);
    interaction.reply({
      content: `❌ Une erreur s'est produite lors du reroll du giveaway : ${error.message}`,
      ephemeral: true,
    });
  }
}
