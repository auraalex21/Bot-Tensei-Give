import dotenv from "dotenv";

dotenv.config();

export const messages = {
  giveaway: "🎉 **GIVEAWAY** 🎉",
  giveawayEnded: "🎉 **GIVEAWAY TERMINÉ** 🎉",
  inviteToParticipate: "Réagissez avec 🎉 pour participer!",
  dropMessage: "Soyez le premier à réagir avec 🎉 !",
  drawing: "Tirage au sort: {timestamp}",
  winMessage: "Félicitations, {winners}! Vous avez gagné **{prize}**!",
  embedFooter: "Giveaways",
  noWinner: "Giveaway annulé, aucune participation valide.",
  hostedBy: "Organisé par: {user}",
  winners: "Gagnant(s)",
  endedAt: "Terminé à",
  units: {
    seconds: "secondes",
    minutes: "minutes",
    hours: "heures",
    days: "jours",
    pluralS: false, // pas de "s" à la fin des unités de temps
  },
};
