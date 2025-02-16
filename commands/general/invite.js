import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { QuickDB } from "quick.db";
import { createCanvas, loadImage } from "canvas";

const db = new QuickDB();

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

  if (Date.now() - interaction.createdTimestamp > 2900) {
    console.warn(`⏳ Interaction trop ancienne : ${interaction.id}`);
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("utilisateur") || interaction.user;
    if (!user) {
      await interaction.editReply({ content: "❌ Utilisateur non trouvé." });
      return;
    }

    const invites = (await db.get(`invites_${user.id}`)) || 0;

    // Création du canvas
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec dégradé bleu foncé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A192F");
    gradient.addColorStop(1, "#001F3F");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure arrondie
    ctx.strokeStyle = "#00A2FF";
    ctx.lineWidth = 6;
    ctx.roundRect(10, 10, width - 20, height - 20, 15);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 36px Poppins";
    ctx.fillStyle = "#00A2FF";
    ctx.fillText("📊 Statistiques d'invitation", 50, 60);

    // Texte utilisateur
    ctx.font = "bold 28px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👤 Utilisateur:`, 50, 140);
    ctx.fillStyle = "#DDDDDD";
    ctx.fillText(`${user.tag}`, 250, 140, 500);

    // Nombre d'invitations
    ctx.font = "bold 28px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("📥 Invitations:", 50, 220);
    ctx.fillStyle = "#DDDDDD";
    ctx.fillText(`${invites} personne(s)`, 250, 220);

    // Ajout d'une image d'avatar
    const avatar = await loadImage(user.displayAvatarURL({ format: "png" }));
    ctx.drawImage(avatar, width - 150, 50, 100, 100);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "invites.png" });

    await interaction.editReply({
      content: ``,
      files: [attachment],
    });

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
