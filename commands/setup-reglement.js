const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-reglement")
    .setDescription("Configurer le message de règlement"),

  async execute(interaction) {
    // Vérifier les permissions de l'utilisateur
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.reply({
        content:
          ":x: Vous devez avoir les permissions de gérer les messages pour utiliser cette commande.",
        flags: 64,
      });
    }

    // Répondre à l'interaction immédiatement
    await interaction.reply({
      content: "Configuration du message de règlement...",
      flags: 64,
    });

    const embeds = [
      new EmbedBuilder()
        .setTitle("📜 Règlement du Serveur Giveaway 🎉")
        .setDescription(
          "Bienvenue sur le serveur Giveaways ! Avant de participer aux giveaways et d’interagir avec la communauté, merci de lire et de respecter les règles suivantes. Tout manquement pourra entraîner des sanctions (avertissement, mute, kick ou ban).\n\n"
        )
        .addFields({
          name: "🔹 1. Respect et Bonne Conduite :",
          value:
            "✅ Soyez respectueux envers tous les membres.\n" +
            "✅ Aucune insulte, menace, discrimination, harcèlement ou comportement toxique ne sera toléré.\n" +
            "✅ Aucune provocation ou débat visant à créer des conflits n’est autorisé.\n" +
            "✅ Les pseudos, avatars et statuts ne doivent contenir aucun contenu offensant ou inapproprié.\n" +
            "❌ Interdiction de spam, flood ou troll dans les salons textuels et vocaux.\n\n",
        }),
      new EmbedBuilder().addFields({
        name: "🎁 2. Participation aux Giveaways",
        value:
          "✅ Pour participer à un giveaway, suivez les instructions indiquées dans le salon #🎉giveaway-live.\n" +
          "✅ Si vous gagnez, vous devez réclamer votre récompense dans un délai de 48 heures, sous peine d’annulation.\n" +
          "✅ Les giveaways sont équitables et gérés par un bot. Toute tentative de triche entraînera une exclusion.\n" +
          "✅ Un membre ne peut pas céder son gain à une autre personne.\n" +
          "❌ Créer de faux comptes pour augmenter ses chances est strictement interdit.\n\n",
      }),
      new EmbedBuilder().addFields({
        name: "📢 3. Publicité et Spam",
        value:
          "✅ Vous pouvez partager vos réseaux sociaux uniquement dans le salon dédié (s’il existe).\n" +
          "✅ Toute publicité doit être validée par un administrateur avant d’être postée.\n" +
          "❌ Aucune publicité non autorisée (serveurs Discord, chaînes YouTube, sites web, etc.).\n" +
          "❌ Pas de spam de messages, d’emoji ou de mentions inutiles (@everyone, @here).\n" +
          "❌ Toute publicité en message privé sans le consentement de l’utilisateur est interdite.\n" +
          "❌ Si un membre fait de la publicité en MP et reçoit une sanction d’un autre serveur, nous ne serons pas responsables de cette sanction.\n\n",
      }),
      new EmbedBuilder().addFields({
        name: "🔐 4. Sécurité et Confidentialité",
        value:
          "✅ Ne partagez jamais d’informations personnelles (adresse, numéro de téléphone, etc.).\n" +
          "✅ Méfiez-vous des liens envoyés par des inconnus. Vérifiez toujours qu’ils sont sûrs.\n" +
          "✅ Si vous repérez un comportement suspect, signalez-le à un modérateur.\n" +
          "❌ Aucun partage de fichiers malveillants, de virus ou de contenus NSFW (pornographique, gore, etc.).\n\n",
      }),
      new EmbedBuilder().addFields({
        name: "🛠️ 5. Rôles et Modération",
        value:
          "✅ Les modérateurs sont là pour garantir une bonne ambiance et appliquer les règles. Respectez leurs décisions.\n" +
          "✅ Si vous avez un problème avec une sanction, contactez un administrateur en privé.\n" +
          "❌ L’usurpation d’identité d’un membre du staff est interdite.\n" +
          "❌ Contourner une sanction (par exemple, utiliser un double compte après un ban) entraînera un bannissement définitif.\n\n",
      }),
      new EmbedBuilder().addFields({
        name: "🚀 6. Règles des Salons Vocaux",
        value:
          "✅ Évitez de monopoliser la parole, respectez les autres participants.\n" +
          "✅ Un bon comportement est attendu, comme dans les salons textuels.\n" +
          "❌ Aucune diffusion de musique sans autorisation.\n" +
          "❌ Interdiction d’utiliser un modificateur de voix ou de crier volontairement.\n" +
          "❌ Pas d’enregistrements ou de partages de conversations sans l’accord des personnes présentes.\n\n",
      }),
      new EmbedBuilder().addFields({
        name: "📌 7. Autres Règles",
        value:
          "✅ Respectez les conditions d’utilisation de Discord.\n" +
          "✅ Les règles peuvent être mises à jour à tout moment.\n\n" +
          "En restant sur le serveur, vous acceptez ces règles et leurs mises à jour éventuelles. Merci de votre compréhension et amusez-vous bien ! 🎉🚀",
      }),
    ];

    for (const embed of embeds) {
      const reglementMessage = await interaction.channel.send({
        embeds: [embed],
      });
      if (embed === embeds[embeds.length - 1]) {
        await reglementMessage.react("✅");
      }
    }

    interaction.followUp({
      content: "Message de règlement configuré.",
      flags: 64,
    });
  },
};
