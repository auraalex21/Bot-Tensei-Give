import { QuickDB } from "quick.db";
import pkg from "discord.js";
const { Events, EmbedBuilder } = pkg;
import { addInvite } from "../config/invites.js";

const db = new QuickDB();
const verificationChannelId = "1340366991038615592"; // ID du salon de vérification

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

    // Protection contre les raids avec vérification par code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    await db.set(`verificationCode_${member.id}`, verificationCode);

    const embed = new EmbedBuilder()
      .setTitle("Vérification requise")
      .setDescription(
        `Veuillez entrer ce code dans le salon <#${verificationChannelId}> pour vérifier votre compte : **${verificationCode}**`
      )
      .setColor("#0000FF");

    try {
      await member.send({ embeds: [embed] });
    } catch (error) {
      console.error(`❌ Impossible d'envoyer un message à ${member.user.tag}.`);
    }
  },
};
