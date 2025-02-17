import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Events,
} from "discord.js";

const db = new QuickDB();

export default {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("Error handling interaction:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: 64,
          });
        }
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "candidatureModal") {
        await handleModalSubmit(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "acceptCandidature") {
        await handleCandidatureDecision(interaction, true);
      } else if (interaction.customId === "rejectCandidature") {
        await handleCandidatureDecision(interaction, false);
      }
    }
  },
};

// ✅ Fonction pour envoyer un MP au candidat
async function sendMP(user, status) {
  try {
    const message =
      status === true
        ? "🎉 Félicitations ! Votre candidature a été **acceptée** ! Un membre du staff vous contactera bientôt."
        : "❌ Votre candidature a été **refusée**. Vous pouvez retenter plus tard.";

    await user.send(message);
  } catch (error) {
    console.error(`❌ Impossible d'envoyer un MP à ${user.tag}:`, error);
  }
}

// ✅ Fonction pour gérer l'acceptation/refus d'une candidature
async function handleCandidatureDecision(interaction, status) {
  try {
    const user = interaction.message.mentions.users.first(); // Récupérer l'utilisateur de la candidature

    if (user) {
      await sendMP(user, status);
    } else {
      console.warn("⚠️ Impossible de trouver l'utilisateur de la candidature.");
    }

    await interaction.update({
      content: status ? "✅ Candidature acceptée." : "❌ Candidature refusée.",
      components: [],
    });
  } catch (error) {
    console.error("❌ Erreur lors du traitement de la décision:", error);
  }
}

async function handleModalSubmit(interaction) {
  try {
    const pseudo = interaction.fields.getTextInputValue("pseudoInput");
    const experience = interaction.fields.getTextInputValue("experienceInput");
    const motivation = interaction.fields.getTextInputValue("motivationInput");

    // 📏 Définition des tailles de base
    const width = 800;
    let height = 300;

    const lineHeight = 28;
    const ctx = createCanvas(width, height).getContext("2d");
    ctx.font = "20px Arial";

    const expHeight =
      wrapText(ctx, experience, 0, 0, width - 100, lineHeight) - 0;
    const motHeight =
      wrapText(ctx, motivation, 0, 0, width - 100, lineHeight) - 0;

    height += expHeight + motHeight;

    const canvas = createCanvas(width, height);
    const ctxFinal = canvas.getContext("2d");

    ctxFinal.fillStyle = "#0A192F";
    ctxFinal.fillRect(0, 0, width, height);
    ctxFinal.fillStyle = "#001F3F";
    ctxFinal.fillRect(40, 40, width - 80, height - 80);
    ctxFinal.strokeStyle = "#00A2FF";
    ctxFinal.lineWidth = 6;
    ctxFinal.roundRect(20, 20, width - 40, height - 40, 15);
    ctxFinal.stroke();

    ctxFinal.font = "bold 28px Arial";
    ctxFinal.fillStyle = "#00A2FF";
    ctxFinal.fillText("📩 Candidature de Staff", width / 2 - 120, 60);

    ctxFinal.font = "bold 20px Arial";
    ctxFinal.fillStyle = "#FFFFFF";
    ctxFinal.fillText("Pseudo:", 40, 110);
    ctxFinal.font = "18px Arial";
    ctxFinal.fillStyle = "#DDDDDD";
    ctxFinal.fillText(pseudo, 140, 110);

    ctxFinal.font = "bold 20px Arial";
    ctxFinal.fillStyle = "#FFFFFF";
    ctxFinal.fillText("Expérience en modération:", 40, 160);
    ctxFinal.font = "18px Arial";
    ctxFinal.fillStyle = "#DDDDDD";
    let newY = wrapText(ctxFinal, experience, 40, 190, width - 80, lineHeight);

    ctxFinal.font = "bold 20px Arial";
    ctxFinal.fillStyle = "#FFFFFF";
    ctxFinal.fillText("Motivation:", 40, newY + 20);
    ctxFinal.font = "18px Arial";
    ctxFinal.fillStyle = "#DDDDDD";
    wrapText(ctxFinal, motivation, 40, newY + 50, width - 80, lineHeight);

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, {
      name: "candidature.png",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("acceptCandidature")
        .setLabel("✅ Accepter")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("rejectCandidature")
        .setLabel("❌ Refuser")
        .setStyle(ButtonStyle.Danger)
    );

    const channel = interaction.client.channels.cache.get(
      "1340014452451315722"
    );
    if (channel) {
      const message = await channel.send({
        content: `<@${interaction.user.id}>`,
        files: [attachment],
        components: [row],
      });

      await interaction.reply({
        content: "✅ Votre candidature a été envoyée avec succès.",
        ephemeral: true,
      });

      // ✅ Stocker l'ID du message pour retrouver l'utilisateur plus tard
      await db.set(`candidature_${message.id}`, interaction.user.id);
    } else {
      await interaction.reply({
        content: "❌ Erreur: Salon introuvable.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la candidature:", error);
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de l'envoi de votre candidature.",
      ephemeral: true,
    });
  }
}

// ✅ Fonction pour couper le texte proprement
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + " ";
    let testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line !== "") {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });

  return y + lines.length * lineHeight;
}
