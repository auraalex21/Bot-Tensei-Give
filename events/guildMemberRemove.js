const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = async (client, member) => {
  const inviterId = await db.get(`invitedBy_${member.id}`);
  if (inviterId) {
    const currentInvites = (await db.get(`invites_${inviterId}`)) || 0;
    await db.set(`invites_${inviterId}`, currentInvites - 1);
  }

  const invitesAfter = await member.guild.invites.fetch();
  await db.set(
    `invites_${member.guild.id}`,
    invitesAfter.reduce((acc, invite) => {
      acc[invite.code] = invite.uses;
      return acc;
    }, {})
  );
};
