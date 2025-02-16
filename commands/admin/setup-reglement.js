import {
  SlashCommandBuilder,
  PermissionsBitField,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { createCanvas } from "canvas";
import { QuickDB } from "quick.db";

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName("setup-reglement")
  .setDescription("Configurer le message de règlement");

const rulesPages = [
  [
    "📜 Règlement du Serveur Giveaway 🎉",
    "Bienvenue sur le serveur Giveaways ! Avant de participer aux giveaways et d’interagir avec la communauté, merci de lire et de respecter les règles suivantes. Tout manquement pourra entraîner des sanctions (avertissement, mute, kick ou ban).",
  ],
  [
    "🔹 1. Respect et Bonne Conduite",
    "✅ Soyez respectueux envers tous les membres.",
    "✅ Aucune insulte, menace, discrimination, harcèlement ou comportement toxique ne sera toléré.",
    "✅ Aucune provocation ou débat visant à créer des conflits n’est autorisé.",
    "✅ Les pseudos, avatars et statuts ne doivent contenir aucun contenu offensant ou inapproprié.",
    "❌ Interdiction de spam, flood ou troll dans les salons textuels et vocaux.",
  ],
  [
    "🎁 2. Participation aux Giveaways",
    "✅ Pour participer à un giveaway, suivez les instructions indiquées dans le salon #🎉giveaway-live.",
    "✅ Si vous gagnez, vous devez réclamer votre récompense dans un délai de 48 heures, sous peine d’annulation.",
    "✅ Les giveaways sont équitables et gérés par un bot. Toute tentative de triche entraînera une exclusion.",
    "✅ Un membre ne peut pas céder son gain à une autre personne.",
    "❌ Créer de faux comptes pour augmenter ses chances est strictement interdit.",
  ],
  [
    "📢 3. Publicité et Spam",
    "✅ Vous pouvez partager vos réseaux sociaux uniquement dans le salon dédié (s’il existe).",
    "✅ Toute publicité doit être validée par un administrateur avant d’être postée.",
    "❌ Aucune publicité non autorisée (serveurs Discord, chaînes YouTube, sites web, etc.).",
    "❌ Pas de spam de messages, d’emoji ou de mentions inutiles (@everyone, @here).",
    "❌ Toute publicité en message privé sans le consentement de l’utilisateur est interdite.",
    "❌ Si un membre fait de la publicité en MP et reçoit une sanction d’un autre serveur, nous ne serons pas responsables de cette sanction.",
  ],
  [
    "🔐 4. Sécurité et Confidentialité",
    "✅ Ne partagez jamais d’informations personnelles (adresse, numéro de téléphone, etc.).",
    "✅ Méfiez-vous des liens envoyés par des inconnus. Vérifiez toujours qu’ils sont sûrs.",
    "✅ Si vous repérez un comportement suspect, signalez-le à un modérateur.",
    "❌ Aucun partage de fichiers malveillants, de virus ou de contenus NSFW (pornographique, gore, etc.).",
  ],
  [
    "🛠️ 5. Rôles et Modération",
    "✅ Les modérateurs sont là pour garantir une bonne ambiance et appliquer les règles. Respectez leurs décisions.",
    "✅ Si vous avez un problème avec une sanction, contactez un administrateur en privé.",
    "❌ L’usurpation d’identité d’un membre du staff est interdite.",
    "❌ Contourner une sanction (par exemple, utiliser un double compte après un ban) entraînera un bannissement définitif.",
  ],
  [
    "🚀 6. Règles des Salons Vocaux",
    "✅ Évitez de monopoliser la parole, respectez les autres participants.",
    "✅ Un bon comportement est attendu, comme dans les salons textuels.",
    "❌ Aucune diffusion de musique sans autorisation.",
    "❌ Interdiction d’utiliser un modificateur de voix ou de crier volontairement.",
    "❌ Pas d’enregistrements ou de partages de conversations sans l’accord des personnes présentes.",
  ],
  [
    "📌 7. Autres Règles",
    "✅ Respectez les conditions d’utilisation de Discord.",
    "✅ Les règles peuvent être mises à jour à tout moment.",
    "En restant sur le serveur, vous acceptez ces règles et leurs mises à jour éventuelles. Merci de votre compréhension et amusez-vous bien ! 🎉🚀",
    "Cliquez sur ☑️ pour obtenir le rôle !",
  ],
];

async function generatePage(pageIndex) {
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0A192F";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(rulesPages[pageIndex][0], 50, 70);

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#FFFFFF";
  let yPosition = 130;
  for (let i = 1; i < rulesPages[pageIndex].length; i++) {
    const text = rulesPages[pageIndex][i];
    let lines = text.match(/.{1,80}(\s|$)/g) || [text];
    for (const line of lines) {
      ctx.fillText(line.trim(), 50, yPosition);
      yPosition += 30;
    }
  }

  const buffer = canvas.toBuffer();
  return new AttachmentBuilder(buffer, {
    name: `reglement_page_${pageIndex + 1}.png`,
  });
}

export async function execute(interaction) {
  if (
    !interaction.member.permissions.has(
      PermissionsBitField.Flags.ManageMessages
    )
  ) {
    return interaction.reply({
      content:
        "❌ Vous devez avoir la permission `Gérer les messages` pour configurer le règlement.",
      flags: 64, // Use flags instead of ephemeral
    });
  }

  let currentPage = 0;
  const attachment = await generatePage(currentPage);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("▶️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("accept")
      .setLabel("☑️ Accepter")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true)
  );

  const message = await interaction.reply({
    files: [attachment],
    components: [row],
    fetchReply: true,
  });

  const collector = message.createMessageComponentCollector({ time: 0 });

  collector.on("collect", async (i) => {
    if (i.customId === "next") currentPage++;
    else if (i.customId === "prev") currentPage--;
    else if (i.customId === "accept") {
      const role = interaction.guild.roles.cache.get("1340087668616204471");
      if (role) {
        await i.member.roles.add(role);
        await i.reply({
          content: "✅ Vous avez accepté le règlement et obtenu le rôle.",
          ephemeral: true,
        });
      } else {
        await i.reply({
          content: "❌ Le rôle n'a pas été trouvé.",
          ephemeral: true,
        });
      }
      return;
    }

    const newAttachment = await generatePage(currentPage);
    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === rulesPages.length - 1),
      new ButtonBuilder()
        .setCustomId("accept")
        .setLabel("☑️ Accepter")
        .setStyle(ButtonStyle.Success)
        .setDisabled(currentPage !== rulesPages.length - 1)
    );

    await i.update({ files: [newAttachment], components: [newRow] });
  });

  collector.on("end", async () => {
    await interaction.editReply({
      components: [],
    });
  });
}
