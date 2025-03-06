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
    console.log("Invitations avant l'arrivée du membre :", invitesBefore);

    const invitesAfter = await member.guild.invites.fetch();
    console.log("Invitations après l'arrivée du membre :", invitesAfter);

    // Trouver l'invitation utilisée
    const invite = invitesAfter.find(
      (i) => invitesBefore[i.code] && invitesBefore[i.code] < i.uses
    );
    console.log("Invitation utilisée :", invite);

    if (invite) {
      const inviter = invite.inviter;
      console.log("Invité par :", inviter.tag);
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
    console.log("Invitations mises à jour dans la base de données.");

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
    console.log("Code de vérification généré :", verificationCode);

    // Créer l'embed de vérification
    const embed = new EmbedBuilder()
      .setTitle("🔒 Vérification requise")
      .setDescription(
        `Bienvenue ${member.user.username} !\nVeuillez entrer ce code dans ce fil pour vérifier votre compte : **${verificationCode}**`
      )
      .setColor("#0000FF");

    // Envoyer le message dans un fil de discussion dans le salon de vérification
    await member.guild.channels.fetch();
    const verificationChannel = member.guild.channels.cache.get(
      verificationChannelId
    );
    if (verificationChannel) {
      try {
        const thread = await verificationChannel.threads.create({
          name: `Vérification de ${member.user.username}`,
          autoArchiveDuration: 60,
          reason: "Vérification de nouveau membre",
        });
        await thread.send({
          content: `<@${member.id}>`,
          embeds: [embed],
        });
        console.log("Fil de vérification créé et message envoyé.");
      } catch (error) {
        console.error(
          "❌ Erreur lors de la création du fil de vérification :",
          error
        );
      }
    } else {
      console.error("❌ Le salon de vérification n'a pas été trouvé.");
    }

    // Ajouter un listener pour les messages dans le fil de vérification
    client.on(Events.MessageCreate, async (message) => {
      if (
        message.channel.isThread() &&
        message.channel.parentId === verificationChannelId &&
        message.author.id === member.id
      ) {
        console.log(
          "Message reçu dans le fil de vérification :",
          message.content
        );
        const enteredCode = message.content.trim();
        const storedCode = await db.get(`verificationCode_${member.id}`);
        console.log("Code de vérification entré :", enteredCode);
        console.log("Code de vérification stocké :", storedCode);

        if (enteredCode === storedCode) {
          const role = member.guild.roles.cache.get(verificationRoleId);
          if (role) {
            await member.roles.add(role);
            await db.delete(`verificationCode_${member.id}`);
            await message.reply(
              "✅ Vérification réussie ! Vous avez maintenant accès au serveur."
            );
            console.log("Rôle de vérification ajouté au membre.");
          } else {
            console.error("❌ Le rôle de vérification n'a pas été trouvé.");
          }
        } else {
          await message.reply(
            "❌ Code de vérification incorrect. Veuillez réessayer."
          );
          console.log("Code de vérification incorrect.");
        }
      }
    });
  },
});
