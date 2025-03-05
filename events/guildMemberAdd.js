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

    // Envoyer le message dans le salon de vérification
    const verificationChannel = member.guild.channels.cache.get(
      verificationChannelId
    );
    if (verificationChannel) {
      await verificationChannel.send({
        content: `<@${member.id}>`,
        embeds: [embed],
      });
    } else {
      console.error("❌ Le salon de vérification n'a pas été trouvé.");
    }

    // Ajouter un listener pour les messages dans le salon de vérification
    client.on(Events.MessageCreate, async (message) => {
      if (
        message.channel.id === verificationChannelId &&
        message.author.id === member.id
      ) {
        const enteredCode = message.content.trim();
        const storedCode = await db.get(`verificationCode_${member.id}`);

        if (enteredCode === storedCode) {
          const role = member.guild.roles.cache.get(verificationRoleId);
          if (role) {
            await member.roles.add(role);
            await db.delete(`verificationCode_${member.id}`);
            await message.reply(
              "✅ Vérification réussie ! Vous avez maintenant accès au serveur."
            );
          } else {
            console.error("❌ Le rôle de vérification n'a pas été trouvé.");
          }
        } else {
          await message.reply(
            "❌ Code de vérification incorrect. Veuillez réessayer."
          );
        }
      }
    });
  },
});
