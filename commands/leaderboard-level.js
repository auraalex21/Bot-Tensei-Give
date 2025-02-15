import { SlashCommandBuilder } from "discord.js";
import { getLeaderboard } from "../config/levels.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard-level")
  .setDescription("Afficher le classement des niveaux");

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const leaderboard = await getLeaderboard(guildId);

  if (leaderboard.length === 0) {
    return interaction.reply({
      content: "❌ Aucun utilisateur trouvé dans le classement.",
      ephemeral: true,
    });
  }

  const topUsers = leaderboard.slice(0, 10);
  const leaderboardMessage = topUsers
    .map(
      (user, index) =>
        `${index + 1}. <@${user.userId}> - Niveau ${user.level} (${
          user.exp
        } XP)`
    )
    .join("\n");

  return interaction.reply({
    content: `🏆 **Classement des niveaux** 🏆\n\n${leaderboardMessage}`,
    ephemeral: true,
  });
}
