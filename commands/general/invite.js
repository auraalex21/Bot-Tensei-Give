import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getInvites } from "../../config/invites.js";
import { createCanvas, loadImage } from "canvas";

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Voir combien de personnes un utilisateur a invité")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez voir les invitations")
      .setRequired(false)
  );

export async function execute(interaction) {
  console.log(`📩 Commande reçue : invite - Interaction ID: ${interaction.id}`);

  try {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("utilisateur") || interaction.user;
    if (!user) {
      await interaction.editReply({ content: "❌ Utilisateur non trouvé." });
      return;
    }

    const invites = await getInvites(user.id, interaction.guild.id);

    // Création du canvas
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Dégradé de fond amélioré
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A192F");
    gradient.addColorStop(1, "#001F3F");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure néon
    ctx.strokeStyle = "#00A2FF";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Titre principal
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#00A2FF";
    ctx.shadowColor = "rgba(0, 162, 255, 0.7)";
    ctx.shadowBlur = 10;
    ctx.fillText("📊 Statistiques d'invitation", 40, 60);
    ctx.shadowBlur = 0; // Réinitialisation de l'ombre

    // Texte Utilisateur
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("👤 Utilisateur:", 40, 140);
    ctx.fillStyle = "#DDDDDD";
    ctx.fillText(user.tag, 250, 140, 500);

    // Texte Invitations (Corrigé)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("📥 Invitations:", 40, 240);
    ctx.fillStyle = "#DDDDDD";
    ctx.font = "bold 24px Arial"; // Taille de texte réduite pour éviter le chevauchement
    ctx.fillText(`${invites} personne(s)`, 260, 240);

    // Ajout de l'avatar
    const avatarURL = user.displayAvatarURL({ format: "png" });
    let avatar;
    try {
      avatar = await loadImage(avatarURL);
    } catch (error) {
      console.error("Erreur lors du chargement de l'avatar :", error);
      avatar = await loadImage(
        "https://cdn.discordapp.com/embed/avatars/0.png"
      );
    }
    const avatarSize = 100;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - 100, 100, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, width - 150, 50, avatarSize, avatarSize);
    ctx.restore();

    // Conversion en buffer
    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "invites.png" });

    await interaction.editReply({ files: [attachment] });

    console.log(`✅ Informations envoyées à ${interaction.user.tag}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande invite :",
      error
    );

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content:
            "🚨 Une erreur s'est produite lors de l'exécution de la commande.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error(
          "❌ Impossible d'envoyer un message d'erreur :",
          replyError
        );
      }
    }
  }
}
