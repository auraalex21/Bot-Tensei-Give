import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import Discord from "discord.js";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Bannir un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à bannir")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("raison")
      .setDescription("La raison du bannissement")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const reason =
    interaction.options.getString("raison") || "Aucune raison fournie";

  if (!interaction.member.permissions.has("BAN_MEMBERS")) {
    return interaction.reply({
      content: ":x: Vous n'avez pas la permission de bannir des membres.",
      flags: Discord.MessageFlags.Ephemeral,
    });
  }

  const member = interaction.guild.members.cache.get(user.id);
  if (!member) {
    return interaction.reply({
      content: ":x: Utilisateur non trouvé.",
      flags: Discord.MessageFlags.Ephemeral,
    });
  }

  await member.ban({ reason });
  const bans = (await db.get(`bans_${user.id}`)) || [];
  bans.push({
    reason,
    date: new Date().toISOString(),
    moderatorId: interaction.user.id,
  });
  await db.set(`bans_${user.id}`, bans);

  interaction.reply(
    `✅ ${user.tag} a été banni pour la raison suivante : ${reason}`
  );
}
