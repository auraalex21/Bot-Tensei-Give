import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { addExperience } from "../../config/levels.js"; // Ensure this path is correct

const db = new QuickDB();

export const name = "refresh-exp";

export const data = new SlashCommandBuilder()
  .setName("refresh-exp")
  .setDescription("Rafraîchir l'expérience d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez rafraîchir l'expérience")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("exp")
      .setDescription("Le montant d'expérience à ajouter")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const exp = interaction.options.getInteger("exp");
  const guildId = interaction.guild.id;
  const client = interaction.client;

  // Check if the user has the required role
  if (!member.roles.cache.has("1339295239059410974")) {
    return interaction.reply({
      content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const success = await addExperience(user.id, guildId, exp, client);

  if (success) {
    interaction.reply({
      content: `✅ ${user.tag} a gagné ${exp} points d'expérience et a monté de niveau!`,
      ephemeral: true,
    });
  } else {
    interaction.reply({
      content: `✅ ${user.tag} a gagné ${exp} points d'expérience.`,
      ephemeral: true,
    });
  }
}
