import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { roleRewards } from "../../config/levels.js"; // Ensure this path is correct

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("add-roles")
  .setDescription(
    "Ajouter les rôles aux utilisateurs ayant atteint le niveau requis"
  );

export async function execute(interaction) {
  const allowedUserId = "378998346712481812";

  if (interaction.user.id !== allowedUserId) {
    return interaction.reply({
      content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
  }

  const guildId = interaction.guild.id;
  const client = interaction.client;

  await interaction.deferReply({ ephemeral: true });

  const keys = await db.all();
  const users = [];

  for (const { id, value } of keys) {
    if (id.startsWith(`levels_${guildId}_`)) {
      const userId = id.split("_")[2];
      users.push({ userId, ...value });
    }
  }

  for (const user of users) {
    const reward = roleRewards.find((r) => r.level === user.level);
    if (reward) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const member = guild.members.cache.get(user.userId);
      if (!member) continue;

      const role = guild.roles.cache.get(reward.roleId);
      if (!role) continue;

      await member.roles.add(role);
      console.log(`🎉 [ROLE] ${user.userId} a reçu le rôle ${role.name}`);
    }
  }

  await interaction.editReply({
    content: `✅ Les rôles ont été attribués aux utilisateurs ayant atteint le niveau requis.`,
    ephemeral: true,
  });
}
