const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = async (client, member) => {
  const invitesBefore = (await db.get(`invites_${member.guild.id}`)) || {};
  const invitesAfter = await member.guild.invites.fetch();

  const invite = invitesAfter.find(
    (i) => invitesBefore[i.code] && invitesBefore[i.code] < i.uses
  );

  if (invite) {
    const inviter = invite.inviter;
    const currentInvites = (await db.get(`invites_${inviter.id}`)) || 0;
    await db.set(`invites_${inviter.id}`, currentInvites + 1);
    await db.set(`invitedBy_${member.id}`, inviter.id); // Enregistrer qui a invité le membre
  }

  await db.set(
    `invites_${member.guild.id}`,
    invitesAfter.reduce((acc, invite) => {
      acc[invite.code] = invite.uses;
      return acc;
    }, {})
  );

  // Add role to the new member
  const roleId = "1339298936099442759";
  const role = member.guild.roles.cache.get(roleId);
  if (role) {
    await member.roles.add(role);
  }
};
