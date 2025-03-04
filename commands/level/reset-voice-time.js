import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("reset-voice-time")
  .setDescription(
    "Réinitialiser le temps vocal d'un utilisateur ou de tous les utilisateurs"
  )
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription(
        "L'utilisateur dont vous voulez réinitialiser le temps vocal"
      )
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("all")
      .setDescription("Réinitialiser le temps vocal de tous les utilisateurs")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const resetAll = interaction.options.getBoolean("all");
  const guildId = interaction.guild.id;

  if (resetAll) {
    const keys = await db.keys(`voiceTime_${guildId}_*`);
    for (const key of keys) {
      await db.delete(key);
    }
    interaction.reply({
      content: `✅ Le temps vocal de tous les utilisateurs a été réinitialisé.`,
      ephemeral: true,
    });
  } else if (user) {
    const key = `voiceTime_${guildId}_${user.id}`;
    await db.delete(key);
    interaction.reply({
      content: `✅ Le temps vocal de ${user.tag} a été réinitialisé.`,
      ephemeral: true,
    });
  } else {
    interaction.reply({
      content: `❌ Vous devez spécifier un utilisateur ou choisir l'option "all".`,
      ephemeral: true,
    });
  }
}
