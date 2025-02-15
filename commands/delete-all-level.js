import { SlashCommandBuilder } from "discord.js";
import { deleteAllLevels } from "../config/levels.js";

export const data = new SlashCommandBuilder()
  .setName("delete-all-level")
  .setDescription(
    "Supprimer tous les niveaux (réservé à l'utilisateur 378998346712481812)"
  );

export async function execute(interaction) {
  if (interaction.user.id !== "378998346712481812") {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  await deleteAllLevels();
  return interaction.reply({
    content: "✅ Tous les niveaux ont été supprimés.",
    ephemeral: true,
  });
}
