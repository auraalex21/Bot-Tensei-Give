import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getUserLevel } from "../../config/levels.js";
import { createCanvas } from "canvas";

export const name = "level";

export const data = new SlashCommandBuilder()
  .setName("level")
  .setDescription("Afficher le niveau et l'expérience d'un utilisateur")
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("L'utilisateur dont vous voulez voir le niveau")
      .setRequired(false)
  );

export async function execute(interaction) {
  console.log(`📩 Commande reçue : level - Interaction ID: ${interaction.id}`);

  try {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const userLevel = await getUserLevel(user.id, interaction.guild.id);

    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec un dégradé bleu foncé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A192F");
    gradient.addColorStop(1, "#001F3F");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure stylisée
    ctx.strokeStyle = "#00A2FF";
    ctx.lineWidth = 8;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    // Texte principal
    ctx.font = "bold 32px Poppins";
    ctx.fillStyle = "#00A2FF";
    ctx.fillText(`📊 Niveau de ${user.tag}`, 50, 60);

    ctx.font = "bold 26px Poppins";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`Niveau: ${userLevel.level}`, 50, 120);
    ctx.fillText(`Exp: ${userLevel.exp} / ${userLevel.level * 100}`, 50, 160);

    // Barre de progression arrière-plan (blanche)
    const progressBarWidth = 700;
    const progressBarHeight = 30;
    const progress = userLevel.exp / (userLevel.level * 100);

    ctx.fillStyle = "#FFFFFF"; // Arrière-plan blanc
    ctx.fillRect(50, 220, progressBarWidth, progressBarHeight);

    // Barre de progression active (bleue)
    ctx.fillStyle = "#00A2FF";
    ctx.fillRect(50, 220, progressBarWidth * progress, progressBarHeight);

    // Contour de la barre de progression
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 220, progressBarWidth, progressBarHeight);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "level-info.png",
    });

    await interaction.editReply({ files: [attachment] });
    console.log(`✅ Niveau affiché pour ${interaction.user.tag}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'exécution de la commande level :",
      error
    );

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: "🚨 Une erreur s'est produite, merci de réessayer.",
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
