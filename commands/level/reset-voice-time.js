import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("reset-voice-time")
  .setDescription("Réinitialiser le temps vocal d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription(
        "L'utilisateur dont vous voulez réinitialiser le temps vocal"
      )
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const guildId = interaction.guild.id;

  const key = `voiceTime_${guildId}_${user.id}`;
  await db.delete(key);

  interaction.reply({
    content: `✅ Le temps vocal de ${user.tag} a été réinitialisé.`,
    ephemeral: true,
  });
}
