const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const config = require('./config.json');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-visa')
    .setDescription('Envoie le message avec le bouton de demande de visa Teranga RP'),

  new SlashCommandBuilder()
    .setName('add-car')
    .setDescription('🚗 Ajouter un véhicule à la boutique (Staff uniquement)')
    .addStringOption(option =>
      option.setName('nom').setDescription('Nom de la voiture (Marque & Modèle)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('prix').setDescription('Prix de la voiture (ex: 50 000 FCFA)').setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('image').setDescription('Photo du véhicule').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('remove-car')
    .setDescription('🗑️ Retirer un véhicule de la boutique (Staff uniquement)')
    .addStringOption(option =>
      option.setName('nom').setDescription('Nom exact de la voiture à retirer').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setup-shop')
    .setDescription('🏬 Installer le message d\'accueil de la Boutique dans ce salon'),

  new SlashCommandBuilder()
    .setName('setup-concessionnaire')
    .setDescription('🏬 Installer le message d\'accueil du Concessionnaire dans ce salon'),

  new SlashCommandBuilder()
    .setName('setup-support')
    .setDescription('🎫 Installer le panel de Support / Tickets dans le salon'),

  new SlashCommandBuilder()
    .setName('clear-shop')
    .setDescription('🗑️ Vider complètement la boutique (Staff uniquement)'),
].map(command => command.toJSON());

if (!process.env.DISCORD_TOKEN) {
  console.error('Erreur: Le token du bot (DISCORD_TOKEN) n\'est pas défini dans le fichier .env.');
  process.exit(1);
}

if (!config.clientId || config.clientId === "BOT_CLIENT_ID_ICI") {
  console.error('Erreur: L\'ID client (clientId) n\'est pas configuré dans config.json.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Début du déploiement des commandes slash (/) pour le bot...');

    // Déploiement spécifique au serveur (instantané pour les tests et la prod sur ce serveur)
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log('Les commandes slash ont été déployées avec succès !');
  } catch (error) {
    console.error('Erreur lors du déploiement des commandes :', error);
  }
})();
