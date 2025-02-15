export default async (client, reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;

  if (reaction.emoji.name === "✅") {
    const member = reaction.message.guild.members.cache.get(user.id);
    const role = reaction.message.guild.roles.cache.get("1340087668616204471");
    if (role) {
      await member.roles.add(role);
      user.send("Vous avez accepté le règlement et obtenu le rôle requis.");
    }
  }
};
