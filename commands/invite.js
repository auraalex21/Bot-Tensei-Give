const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  description: "Afficher le nombre de personnes que vous avez invitées",

  options: [
    {
      name: "utilisateur",
      description: "L'utilisateur dont vous voulez voir les invitations",
      type: Discord.ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const roleId = "1339298936099442759";

    if (!interaction.member.roles.cache.has(roleId)) {
      return interaction.reply({
        content: ":x: Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const invites = (await db.get(`invites_${user.id}`)) || 0;

    const width = 700;
    const height = 250;
    const borderRadius = 20;
    const padding = 30;
    const avatarSize = 100;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Charger l'image de profil de l'utilisateur
    const avatarURL = user.displayAvatarURL({ format: "png", size: 128 });
    let avatar;
    try {
      avatar = await loadImage(avatarURL);
    } catch (err) {
      console.error("Failed to load avatar image:", err);
      avatar = await loadImage(
        "https://cdn.discordapp.com/attachments/1335159756645470220/1339684816232386641/10465987-icone-d-erreur.jpg?ex=67af9e36&is=67ae4cb6&hm=6f12b10e56d2e956426742b66b07833f7c6671a4b6e453bb524b8cf1c308d310&"
      );
    }

    // Fonction pour dessiner un rectangle avec des coins arrondis
    function drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // Dessiner le fond noir avec coins arrondis
    ctx.fillStyle = "#000000";
    drawRoundedRect(ctx, 0, 0, width, height, borderRadius);
    ctx.fill();

    // Dessiner la barre bleue sur le côté gauche
    ctx.fillStyle = "#0099ff";
    ctx.fillRect(0, 0, 6, height);

    // Dessiner l'avatar de l'utilisateur (cercle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      padding + avatarSize / 2,
      height / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      avatar,
      padding,
      height / 2 - avatarSize / 2,
      avatarSize,
      avatarSize
    );
    ctx.restore();

    // Dessiner les lignes séparatrices
    ctx.strokeStyle = "#ffffff33"; // Blanc légèrement transparent
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding * 2 + avatarSize, height / 3);
    ctx.lineTo(width - padding, height / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding * 2 + avatarSize, (height / 3) * 2);
    ctx.lineTo(width - padding, (height / 3) * 2);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(user.tag, padding * 2 + avatarSize, height / 4);

    ctx.font = "24px Arial";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(
      "Nombre d'invitations :",
      padding * 2 + avatarSize,
      (height / 3) * 2 - 10
    );

    // Affichage du nombre d'invitations
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${invites} personne(s)`,
      padding * 2 + avatarSize,
      height - padding
    );

    // Convertir le canvas en buffer
    const buffer = canvas.toBuffer();

    // Créer la pièce jointe
    const attachment = new Discord.AttachmentBuilder(buffer, {
      name: "invite-count.png",
    });

    // Envoyer l'image en réponse
    interaction.reply({ files: [attachment], ephemeral: true });
  },
};
