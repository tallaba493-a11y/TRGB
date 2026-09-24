const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');
require('dotenv').config();

// ID du salon vocal déclencheur (Attente / Entrée Whitelist)
const TRIGGER_VOICE_ID = "1537873464931909702";

// IDs des salons vocaux de destination (Ordre de priorité)
const DESTINATION_VOICE_IDS = [
  "1537870784687771789", // Salon Whitelist 1
  "1537870817721983007", // Salon Whitelist 2
  "1544759811630043136", // Salon Whitelist 3
  "1544759859675664404", // Salon Whitelist 4
  "1544759887853125642", // Salon Whitelist 5
  "1537866447269921022"  // Salon Whitelist Fallback
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`===============================================`);
  console.log(`🤖 Bot Dispatcher Whitelist Vocale connecté : ${client.user.tag}`);
  console.log(`📌 Salon Déclencheur : ${TRIGGER_VOICE_ID}`);
  console.log(`🎯 Salons Destinations : ${DESTINATION_VOICE_IDS.join(', ')}`);
  console.log(`===============================================`);
});

// Événement voiceStateUpdate pour intercepter l'entrée dans le salon déclencheur
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const newChannel = newState.channel;
    if (!newChannel) return;

    // 1. Éviter la boucle : si le joueur est DÉJÀ dans l'un des salons de destination
    if (DESTINATION_VOICE_IDS.includes(newChannel.id)) return;

    // 2. Détecter si le joueur rejoint le salon déclencheur 1537873464931909702 ou un salon nommé "whitelist"
    const isTriggerChannel = newChannel.id === TRIGGER_VOICE_ID || newChannel.name.toLowerCase().includes('whitelist');
    if (!isTriggerChannel) return;

    // Éviter les rafraîchissements si le salon est le même
    if (oldState.channelId === newChannel.id) return;

    const guild = newState.guild;
    const member = newState.member;
    if (!guild || !member) return;

    console.log(`[WHITELIST-DISPATCH] 🎙️ Entrée : ${member.user.tag} (${member.id}) a rejoint le salon déclencheur "${newChannel.name}".`);

    // 3. Chercher un salon complètement LIBRE (0 joueur)
    let chosenTargetChannel = null;

    for (const targetId of DESTINATION_VOICE_IDS) {
      const channelObj = guild.channels.cache.get(targetId) || await guild.channels.fetch(targetId).catch(() => null);
      if (!channelObj) continue;

      const humanCount = channelObj.members.filter(m => !m.user.bot).size;
      if (humanCount === 0) {
        chosenTargetChannel = channelObj;
        break;
      }
    }

    // 4. Si TOUS les salons sont occupés, choisir celui avec le MOINS de joueurs
    if (!chosenTargetChannel) {
      let minOccupants = Infinity;
      for (const targetId of DESTINATION_VOICE_IDS) {
        const channelObj = guild.channels.cache.get(targetId) || await guild.channels.fetch(targetId).catch(() => null);
        if (!channelObj) continue;

        const humanCount = channelObj.members.filter(m => !m.user.bot).size;
        if (humanCount < minOccupants) {
          minOccupants = humanCount;
          chosenTargetChannel = channelObj;
        }
      }
    }

    if (!chosenTargetChannel) {
      console.error(`[WHITELIST-DISPATCH] ❌ ERREUR : Aucun salon vocal de destination n'a pu être trouvé.`);
      return;
    }

    // 5. Vérification de la permission MoveMembers
    const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
      console.error(`[WHITELIST-DISPATCH] ❌ ERREUR : Le bot n'a pas la permission "Déplacer des membres" (MoveMembers).`);
      return;
    }

    // 6. Téléportation automatique
    await member.voice.setChannel(chosenTargetChannel);
    console.log(`[WHITELIST-DISPATCH] ✅ SUCCÈS : ${member.user.tag} a été téléporté vers le salon "${chosenTargetChannel.name}" (${chosenTargetChannel.id}).`);

  } catch (error) {
    console.error(`[WHITELIST-DISPATCH] ❌ ERREUR lors du déplacement du membre :`, error.message);
  }
});

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error("❌ ERREUR : DISCORD_TOKEN introuvable dans le fichier .env !");
  process.exit(1);
}

client.login(TOKEN);
