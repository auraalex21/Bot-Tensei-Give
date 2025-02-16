import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
const db = new QuickDB();

export const name = "reset-level";

export const data = new SlashCommandBuilder()
  .setName("reset-level")
  .setDescription(
    "Réinitialiser le niveau d'un utilisateur à un niveau spécifié"
  )
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez réinitialiser le niveau")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("niveau")
      .setDescription("Le niveau auquel réinitialiser l'utilisateur")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const level = interaction.options.getInteger("niveau");
  const guildId = interaction.guild.id;
  const member = interaction.guild.members.cache.get(interaction.user.id);

  // Check if the user has the required role
  if (!member.roles.cache.has("1339230710501736468")) {
    return interaction.reply({
      content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  // Récupérer les données de l'utilisateur
  const userData = await db.get(`levels_${guildId}_${user.id}`);
  if (!userData) {
    return interaction.reply({
      content: `:x: Aucune donnée trouvée pour ${user.tag}.`,
      ephemeral: true,
    });
  }

  // Réinitialiser le niveau
  userData.level = level;
  userData.exp = 0; // Réinitialiser l'expérience pour le nouveau niveau

  // Mettre à jour les données de l'utilisateur
  await db.set(`levels_${guildId}_${user.id}`, userData);

  interaction.reply({
    content: `✅ Le niveau de ${user.tag} a été réinitialisé à ${level}.`,
    ephemeral: true,
  });
}
