import { QuickDB } from "quick.db";
import pkg from "discord.js";
const { Events, EmbedBuilder, PermissionsBitField } = pkg;
import { addInvite } from "../config/invites.js";

const db = new QuickDB();
const verificationChannelId = "1340366991038615592"; // ID du salon de vérification
const verificationRoleId = "1339298936099442759"; // ID du rôle à ajouter après vérification

export default (client) => ({
  name: Events.GuildMemberAdd,
  async execute(member) {
    console.log(`👤 Nouveau membre ajouté : ${member.user.tag}`);

    const invitesBefore = (await db.get(`invites_${member.guild.id}`)) || {};
    const invitesAfter = await member.guild.invites.fetch();

    // Trouver l'invitation utilisée
    const invite = invitesAfter.find(
      (i) => invitesBefore[i.code] && invitesBefore[i.code] < i.uses
    );

    if (invite) {
      const inviter = invite.inviter;
      await addInvite(inviter.id, member.guild.id);
      await db.set(`invitedBy_${member.id}`, inviter.id);
    }

    // Mettre à jour les invitations dans la base de données
    await db.set(
      `invites_${member.guild.id}`,
      invitesAfter.reduce((acc, invite) => {
        acc[invite.code] = invite.uses;
        return acc;
      }, {})
    );

    // Vérifier si le bot a les permissions nécessaires
    const botMember = member.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      console.error("❌ Le bot n'a pas la permission de gérer les rôles.");
      return;
    }

    // Générer un code de vérification
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    await db.set(`verificationCode_${member.id}`, verificationCode);

    // Créer l'embed de vérification
    const embed = new EmbedBuilder()
      .setTitle("🔒 Vérification requise")
      .setDescription(
        `Bienvenue ${member.user.username} !\nVeuillez entrer ce code dans <#${verificationChannelId}> pour vérifier votre compte : **${verificationCode}**`
      )
      .setColor("#0000FF");

    // Envoyer le message en MP
    try {
      await member.send({ embeds: [embed] });
    } catch (error) {
      console.error(`❌ Impossible d'envoyer un message à ${member.user.tag}.`);
    }
  },
});
