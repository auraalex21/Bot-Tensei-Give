import { QuickDB } from "quick.db";
import { Events } from "discord.js";
import { getInvites, addInvite } from "../config/invites.js";

const db = new QuickDB();

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    console.log(`Membre supprimé : ${member.user.tag}`);
    try {
      const inviterId = await db.get(`invitedBy_${member.id}`);
      if (inviterId) {
        const currentInvites = await getInvites(inviterId, member.guild.id);
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
    } catch (error) {
      console.error(`Failed to process member leave: ${error.message}`);
    }
  },
};
