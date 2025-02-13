module.exports = (client) => {
  console.log(
    `Prêt en tant que ${client.user.tag} pour servir dans ${client.channels.cache.size} canaux sur ${client.guilds.cache.size} serveurs, pour un total de ${client.users.cache.size} utilisateurs.`
  );
};
