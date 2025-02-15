import { QuickDB } from "quick.db";
const db = new QuickDB();

export default async (client, member) => {
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
