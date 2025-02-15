import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("add-invite")
  .setDescription("Ajouter une invitation")
  .addStringOption((option) =>
    option
      .setName("code")
      .setDescription("Le code de l'invitation")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("utilisations")
      .setDescription("Le nombre d'utilisations de l'invitation")
      .setRequired(true)
  );

export async function execute(interaction) {
  const code = interaction.options.getString("code");
  const uses = interaction.options.getInteger("utilisations");

  await db.set(`invite_${code}`, { uses });

  interaction.reply({
    content: `✅ Invitation ajoutée avec le code ${code} et ${uses} utilisations.`,
    ephemeral: true,
  });
}
