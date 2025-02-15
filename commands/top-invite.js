import { SlashCommandBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { EmbedBuilder, MessageFlags } from "discord.js";

const db = new QuickDB();

export default {
  data: new SlashCommandBuilder()
    .setName("top-invite")
    .setDescription("Afficher le top des invitations"),

  async execute(interaction) {
    const guild = interaction.guild;
    const invites = await guild.invites.fetch();

    const inviteCounts = {};

    invites.forEach((invite) => {
      const inviter = invite.inviter;
      if (inviter) {
        if (!inviteCounts[inviter.id]) {
          inviteCounts[inviter.id] = 0;
        }
        inviteCounts[inviter.id] += invite.uses;
      }
    });

    const sortedInvites = Object.entries(inviteCounts).sort(
      (a, b) => b[1] - a[1]
    );

    const topInvites = sortedInvites.slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("Top 10 des invitations")
      .setColor("#0099ff");

    topInvites.forEach(([userId, count], index) => {
      const user = guild.members.cache.get(userId);
      if (user) {
        embed.addFields({
          name: `${index + 1}. ${user.user.tag}`,
          value: `${count} invitations`,
          inline: false,
        });
      }
    });

    interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
