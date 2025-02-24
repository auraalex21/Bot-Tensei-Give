import { QuickDB } from "quick.db";
import { Events } from "discord.js";
import { addInvite } from "../config/invites.js";

const db = new QuickDB();

export default {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    console.log(`Nouveau membre ajouté : ${member.user.tag}`);
    const invitesBefore = (await db.get(`invites_${member.guild.id}`)) || {};
    const invitesAfter = await member.guild.invites.fetch();

    const invite = invitesAfter.find(
      (i) => invitesBefore[i.code] && invitesBefore[i.code] < i.uses
    );

    if (invite) {
      const inviter = invite.inviter;
      await addInvite(inviter.id, member.guild.id);
      await db.set(`invitedBy_${member.id}`, inviter.id); // Enregistrer qui a invité le membre
    }

    await db.set(
      `invites_${member.guild.id}`,
      invitesAfter.reduce((acc, invite) => {
        acc[invite.code] = invite.uses;
        return acc;
      }, {})
    );

    // Vérifiez si le bot a les permissions nécessaires
    const botMember = member.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has("MANAGE_ROLES")) {
      console.error(
        `❌ Le bot n'a pas les permissions nécessaires pour gérer les rôles.`
      );
      return;
    }
  },
};
