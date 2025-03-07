import { QuickDB } from "quick.db";
import pkg from "discord.js";
import { createCanvas } from "canvas";
const { Events } = pkg;

const db = new QuickDB();
const verificationChannelId = "1340366991038615592"; // ID du salon de vérification
const verificationRoleId = "1339298936099442759"; // ID du rôle à ajouter après vérification

export default {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    const botMember = member.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has("MANAGE_ROLES")) {
      console.error("❌ Le bot n'a pas la permission de gérer les rôles.");
      return;
    }
    console.log(`👤 Nouveau membre ajouté : ${member.user.tag}`);

    // Génération du code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    await db.set(`verificationCode_${member.id}`, verificationCode);
    console.log("Code de vérification généré :", verificationCode);

    // Création de l'image du code avec message
    const canvas = createCanvas(500, 300);
    const ctx = canvas.getContext("2d");

    // Création du fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0000FF");
    gradient.addColorStop(1, "#8000FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texte de bienvenue
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Bienvenue ${member.user.username} !`, 50, 50);
    ctx.font = "20px Arial";
    ctx.fillText("Veuillez entrer ce code dans ce salon", 50, 90);
    ctx.fillText("pour vérifier votre compte.", 50, 120);

    // Encadrement du code
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 150, 400, 70);

    // Code de vérification
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px Arial";
    ctx.fillText(`Code: ${verificationCode}`, 80, 195);

    const buffer = canvas.toBuffer();

    // Envoi de l'image de vérification
    const verificationChannel = member.guild.channels.cache.get(
      verificationChannelId
    );
    let verificationMessage;
    if (verificationChannel) {
      verificationMessage = await verificationChannel.send({
        files: [{ attachment: buffer, name: "verification-code.png" }],
      });
      console.log("Message de vérification envoyé.");
    } else {
      console.error("❌ Le salon de vérification n'a pas été trouvé.");
      return;
    }

    // Écoute des messages pour vérifier le code
    client.on(Events.MessageCreate, async (message) => {
      if (
        message.channel.id === verificationChannelId &&
        message.author.id === member.id
      ) {
        console.log("Message reçu :", message.content);
        const enteredCode = message.content.trim();
        const storedCode = await db.get(`verificationCode_${member.id}`);

        if (enteredCode === storedCode) {
          const role = member.guild.roles.cache.get(verificationRoleId);
          if (role) {
            await member.roles.add(role);
            await db.delete(`verificationCode_${member.id}`);
            await message.delete();
            if (verificationMessage) await verificationMessage.delete();
            console.log("Rôle ajouté au membre, message supprimé.");
          } else {
            console.error("❌ Le rôle de vérification n'a pas été trouvé.");
          }
        }
      }
    });
  },
};
