const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top-invite")
    .setDescription(
      "Afficher les 5 premiers utilisateurs ayant le plus d'invitations"
    ),

  async execute(client, interaction) {
    const allInvites = await db.all();
    const inviteData = allInvites
      .filter((entry) => entry.id.startsWith("invites_"))
      .map((entry) => ({
        userId: entry.id.split("_")[1],
        invites: entry.value,
      }))
      .sort((a, b) => b.invites - a.invites)
      .slice(0, 5);

    const embed = new Discord.EmbedBuilder()
      .setTitle("Top 5 des utilisateurs ayant le plus d'invitations")
      .setColor("#0099ff");

    for (const [index, data] of inviteData.entries()) {
      const user = await client.users.fetch(data.userId);
      embed.addFields({
        name: `${index + 1}. ${user.tag}`,
        value: `${data.invites} invitations`,
        inline: false,
      });
    }

    interaction.reply({
      embeds: [embed],
      flags: Discord.MessageFlags.Ephemeral,
    });
  },
};
