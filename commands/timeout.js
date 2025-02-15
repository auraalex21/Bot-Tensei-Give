import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Mettre un utilisateur en timeout")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur à mettre en timeout")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("durée")
      .setDescription("La durée du timeout (en minutes)")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("raison")
      .setDescription("La raison du timeout")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("utilisateur");
  const duration = interaction.options.getInteger("durée");
  const reason =
    interaction.options.getString("raison") || "Aucune raison fournie";

  if (!interaction.member.permissions.has("MODERATE_MEMBERS")) {
    return interaction.reply({
      content:
        ":x: Vous n'avez pas la permission de mettre des membres en timeout.",
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

  await member.timeout(duration * 60 * 1000, reason);
  const timeouts = (await db.get(`timeouts_${user.id}`)) || [];
  timeouts.push({
    reason,
    date: new Date().toISOString(),
    moderatorId: interaction.user.id,
  });
  await db.set(`timeouts_${user.id}`, timeouts);

  interaction.reply(
    `✅ ${user.tag} a été mis en timeout pour ${duration} minute(s) pour la raison suivante : ${reason}`
  );
}
