import { QuickDB } from "quick.db";
import { createCanvas } from "canvas";
import ms from "ms";
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
    console.log(`Interaction créée : ${interaction.id}`);
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      console.log(
        `📩 Commande reçue : ${interaction.commandName} - Interaction ID: ${interaction.id}`
      );

      if (Date.now() - interaction.createdTimestamp > 2900) {
        console.warn(`⏳ Interaction trop ancienne : ${interaction.id}`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("Error handling interaction:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "candidatureModal") {
        await handleModalSubmit(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "acceptCandidature") {
        await interaction.update({
          content: "✅ Candidature acceptée.",
          components: [],
        });
      } else if (interaction.customId === "rejectCandidature") {
        await interaction.update({
          content: "❌ Candidature refusée.",
          components: [],
        });
      } else {
        await handleInteraction(interaction);
      }
    }
  },
};

async function handleModalSubmit(interaction) {
  try {
    const pseudo = interaction.fields.getTextInputValue("pseudoInput");
    const experience = interaction.fields.getTextInputValue("experienceInput");
    const motivation = interaction.fields.getTextInputValue("motivationInput");

    const width = 800;
    const height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0A192F");
    gradient.addColorStop(1, "#001F3F");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border with rounded corners
    ctx.strokeStyle = "#00A2FF";
    ctx.lineWidth = 8;
    ctx.roundRect(15, 15, width - 30, height - 30, 20);
    ctx.stroke();

    // Title
    ctx.font = "bold 36px Arial"; // Use a default font
    ctx.fillStyle = "#00A2FF";
    ctx.fillText("📝 Candidature de Staff", 50, 70);

    // Text Formatting
    ctx.font = "bold 24px Arial"; // Use a default font
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Pseudo:", 50, 140);
    ctx.fillText("Expérience en modération:", 50, 210);
    ctx.fillText("Motivation:", 50, 280);

    ctx.font = "22px Arial"; // Use a default font
    ctx.fillStyle = "#DDDDDD";
    ctx.fillText(pseudo, 200, 140, 550);
    ctx.fillText(experience, 50, 240, 700);
    ctx.fillText(motivation, 50, 310, 700);

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
      await channel.send({ files: [attachment], components: [row] });
      await interaction.reply({
        content: "Votre candidature a été soumise avec succès.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Erreur : Le salon de candidature n'a pas été trouvé.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la soumission de la candidature :", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "Une erreur s'est produite lors de la soumission de votre candidature.",
        ephemeral: true,
      });
    }
  }
}

export async function handleInteraction(interaction) {
  if (!interaction.isButton()) return;

  if (interaction.customId === "participate") {
    const giveawayData = await db.get(`giveaway_${interaction.channel.id}`);
    if (!giveawayData) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: "❌ Giveaway non trouvé.",
          ephemeral: true,
        });
      }
      return;
    }

    // Ensure participants is always an array
    if (!Array.isArray(giveawayData.participants)) {
      giveawayData.participants = [];
    }

    if (giveawayData.participants.includes(interaction.user.id)) {
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: "❌ Vous êtes déjà inscrit à ce giveaway.",
            ephemeral: true,
          });
        } catch (error) {
          console.error(
            "❌ Erreur lors de la réponse à l'interaction :",
            error
          );
        }
      }
      return;
    }

    giveawayData.participants.push(interaction.user.id);
    await db.set(`giveaway_${interaction.channel.id}`, giveawayData);

    // Trigger canvas update
    const updateCanvas = async () => {
      const remainingTime = giveawayData.endTime - Date.now();
      if (remainingTime <= 0) {
        // Handle giveaway end logic here
        return;
      }

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
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 8;
      ctx.roundRect(10, 10, width - 20, height - 20, 20);
      ctx.stroke();

      // Texte principal
      ctx.font = "bold 32px Arial"; // Use a default font
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`🎉 Giveaway Démarré`, 50, 60);

      ctx.font = "bold 26px Arial"; // Use a default font
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(
        `⏳ Temps restant: ${ms(remainingTime, { long: true })}`,
        50,
        120
      );
      ctx.fillText(
        `👥 Participants: ${giveawayData.participants.length}`,
        50,
        160
      );

      const buffer = canvas.toBuffer();
      const attachment = new AttachmentBuilder(buffer, {
        name: "giveaway.png",
      });

      const message = await interaction.channel.messages.fetch(
        giveawayData.messageId
      );
      await message.edit({ files: [attachment] });
    };

    try {
      await updateCanvas();
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "✅ Vous avez été inscrit au giveaway avec succès !",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du canvas :", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "❌ Une erreur s'est produite lors de la mise à jour du canvas.",
          ephemeral: true,
        });
      }
    }
  }
}
