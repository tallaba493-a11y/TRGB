const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ChannelType,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const timeSlots = [
  "08h00", "08h30", "09h00", "09h30", "10h00", "10h30", "11h00", "11h30",
  "12h00", "12h30", "13h00", "13h30", "14h00", "14h30", "15h00", "15h30",
  "16h00", "16h30", "17h00", "17h30", "18h00", "18h30", "19h00", "19h30",
  "20h00"
];

const configPath = path.join(__dirname, 'config.json');
const databasePath = path.join(__dirname, 'database.json');

// Configuration chargée

// Chargement de la configuration
if (!fs.existsSync(configPath)) {
  console.error("Erreur: Le fichier config.json n'existe pas.");
  process.exit(1);
}
const config = require(configPath);

// Chargement/Initialisation de la base de données pour le compteur de Visas
function getNextVisaId() {
  let db = { visaCounter: 1 };
  if (fs.existsSync(databasePath)) {
    try {
      db = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
    } catch (e) {
      console.error("Erreur lors de la lecture de database.json, réinitialisation...", e);
    }
  }
  const currentCount = db.visaCounter;
  db.visaCounter += 1;
  fs.writeFileSync(databasePath, JSON.stringify(db, null, 2), 'utf-8');
  
  // Formatage en 4 chiffres (ex: 0177)
  return `VISA-${String(currentCount).padStart(4, '0')}`;
}

// ══════════════════════════════════════════════
// 🏬 GESTION DE LA BOUTIQUE DE VÉHICULES (Database)
// ══════════════════════════════════════════════
const carsFilePath = path.join(__dirname, 'cars.json');

function loadCars() {
  if (!fs.existsSync(carsFilePath)) {
    fs.writeFileSync(carsFilePath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(carsFilePath, 'utf-8'));
  } catch (e) {
    console.error("Erreur lors de la lecture de cars.json :", e);
    return [];
  }
}

function saveCars(cars) {
  try {
    fs.writeFileSync(carsFilePath, JSON.stringify(cars, null, 2), 'utf-8');
  } catch (e) {
    console.error("Erreur lors de l'écriture de cars.json :", e);
  }
}

function formatDualCurrency(priceInput) {
  if (!priceInput) return "Prix sur demande";
  const str = String(priceInput).trim();

  if ((str.includes('€') || /eur/i.test(str)) && (/fcfa/i.test(str) || /cfa/i.test(str))) {
    return str;
  }

  const cleanNumberStr = str.replace(/\s+/g, '').replace(',', '.');
  const numMatch = cleanNumberStr.match(/(\d+(\.\d+)?)/);
  if (!numMatch) {
    return str;
  }

  const amount = parseFloat(numMatch[0]);
  if (isNaN(amount) || amount <= 0) return str;

  const isEuro = str.includes('€') || /eur/i.test(str);

  if (isEuro) {
    const fcfa = Math.round(amount * 655.957);
    const formattedFcfa = fcfa.toLocaleString('fr-FR') + ' FCFA';
    const formattedEuro = amount.toLocaleString('fr-FR') + ' €';
    return `${formattedEuro} (~${formattedFcfa})`;
  } else {
    if (amount >= 100 || /fcfa/i.test(str) || /cfa/i.test(str)) {
      const euro = (amount / 655.957).toFixed(2);
      const formattedEuro = parseFloat(euro).toLocaleString('fr-FR') + ' €';
      const formattedFcfa = Math.round(amount).toLocaleString('fr-FR') + ' FCFA';
      return `${formattedFcfa} (~${formattedEuro})`;
    } else {
      const fcfa = Math.round(amount * 655.957);
      const formattedFcfa = fcfa.toLocaleString('fr-FR') + ' FCFA';
      const formattedEuro = amount.toLocaleString('fr-FR') + ' €';
      return `${formattedEuro} (~${formattedFcfa})`;
    }
  }
}

async function updateShopCatalog(guild) {
  try {
    const shopChannelId = config.shopChannelId || '1480635435347607723';
    const channel = await guild.channels.fetch(shopChannelId).catch(() => null);
    if (!channel) {
      const msg = `[BOUTIQUE] Salon boutique introuvable ou inaccessible : ${shopChannelId}`;
      console.error(msg);
      return msg;
    }

    // Vérifier les permissions du bot dans ce salon
    let botMember = guild.members.me;
    let permissions = channel.permissionsFor(botMember);
    
    console.log(`[BOUTIQUE-PERM] Permissions du bot dans #${channel.name} :`, permissions ? permissions.toArray() : 'null');

    // Tenter de corriger automatiquement si le bot a les droits
    if (permissions && (permissions.has(PermissionFlagsBits.ManageChannels) || permissions.has(PermissionFlagsBits.ManageRoles))) {
      const needsFix = !permissions.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]);

      if (needsFix) {
        console.log(`[BOUTIQUE] Correction automatique des permissions dans #${channel.name}...`);
        await channel.permissionOverwrites.edit(botMember, {
          ViewChannel: true,
          SendMessages: true,
          EmbedLinks: true,
          ManageMessages: true
        }).catch(e => console.error(`[BOUTIQUE] Échec de correction auto :`, e));
        
        // Re-calculer les permissions après mise à jour
        permissions = channel.permissionsFor(botMember);
      }
    }

    const required = [
      { flag: PermissionFlagsBits.ViewChannel, name: 'Voir le salon (ViewChannel)' },
      { flag: PermissionFlagsBits.SendMessages, name: 'Envoyer des messages (SendMessages)' },
      { flag: PermissionFlagsBits.EmbedLinks, name: 'Intégrer des liens (EmbedLinks)' },
      { flag: PermissionFlagsBits.ManageMessages, name: 'Gérer les messages (ManageMessages)' }
    ];

    const missing = [];
    for (const perm of required) {
      if (!permissions || !permissions.has(perm.flag)) {
        missing.push(perm.name);
      }
    }

    if (missing.length > 0) {
      const errMsg = `⚠️ Le bot manque de permissions dans le salon <#${shopChannelId}>.\n` +
        `Veuillez lui accorder les permissions suivantes dans ce salon :\n` +
        missing.map(p => `- **${p}**`).join('\n');
      console.error(`[BOUTIQUE] ${errMsg}`);
      return errMsg;
    }

    // Supprimer tous les messages dans le salon pour le nettoyer proprement
    let fetched;
    do {
      fetched = await channel.messages.fetch({ limit: 50 });
      for (const msg of fetched.values()) {
        await msg.delete().catch(() => {});
      }
    } while (fetched.size >= 1);

    // 1. Envoyer l'embed d'en-tête (Concessionnaire Automobile de Luxe)
    const headerEmbed = new EmbedBuilder()
      .setTitle('🏬 CONCESSIONNAIRE AUTOMOBILE DE LUXE — TERANGA BLOX RP')
      .setDescription(
        `## 🇸🇳 BIENVENUE AU CONCESSIONNAIRE OFFICIEL\n\n` +
        `*Découvrez notre catalogue exclusif de véhicules importés, sportives de luxe, SUV et supercars de TERANGA BLOX RP.*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `### 💳 MOYENS DE PAIEMENT ACCEPTÉS\n\n` +
        `• 🟦 **Wave** — *Transfert direct & rapide*\n` +
        `• 🍊 **Orange Money** — *Transfert sécurisé*\n` +
        `• 💳 **PayPal** — *Paiement international*\n\n` +
        `### 🛒 COMMENT PASSER COMMANDE ?\n\n` +
        `1️⃣ **Parcourez le catalogue des véhicules ci-dessous.**\n` +
        `2️⃣ **Cliquez sur "🛒 Commander ce véhicule" sous le modèle de votre choix.**\n` +
        `3️⃣ **Remplissez le court formulaire de commande.**\n` +
        `4️⃣ **Le staff examinera votre demande et vous livrera le véhicule avec ses clés en jeu !**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✨ **Garantie Lion RP :** *Chaque véhicule est livré avec carte grise officielle et clés personnalisées.*`
      )
      .setColor('#009A44') // Vert Sénégal
      .setFooter({ text: '🦁 TERANGA BOT • CONCESSIONNAIRE OFFICIEL • 2026' });

    const serverIcon = guild.iconURL({ forceStatic: true, extension: 'png', size: 128 });
    if (serverIcon) {
      headerEmbed.setThumbnail(serverIcon);
    }

    await channel.send({ embeds: [headerEmbed] });

    // 2. Envoyer chaque voiture de la boutique
    const cars = loadCars();
    if (cars.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setDescription('✨ *Aucun véhicule n\'est en vente pour le moment. Revenez plus tard !*')
        .setColor('#FFD700');
      await channel.send({ embeds: [emptyEmbed] });
      return null;
    }

    for (const car of cars) {
      const formattedPrice = formatDualCurrency(car.price);
      const carEmbed = new EmbedBuilder()
        .setTitle(`🏎️ ${car.name}`)
        .setDescription(
          `│ 💎 **Modèle d'Exception • Concessionnaire Teranga**\n\n` +
          `\`\`\`yaml\n💰 PRIX OFFICIEL : ${formattedPrice}\n\`\`\`\n` +
          `💳 **Moyens de paiement :** 🟦 **Wave** • 🍊 **Orange Money** • 💳 **PayPal**\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ **SERVICES VIP INCLUS :**\n` +
          `• 👑 **Véhicule Neuf 0 KM & Garanti**\n` +
          `• 🗡️ **Clés personnalisées & Carte Grise officielle**\n` +
          `• 🚚 **Livraison VIP instantanée par le Staff**`
        )
        .setColor('#FFD700') // Jaune / Or Sénégal
        .setFooter({ text: '🦁 TERANGA AUTOMOBILES • ÉDITION LIMITÉE' });

      if (car.imageUrl) {
        carEmbed.setImage(car.imageUrl);
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`order_car_${car.id}`)
          .setLabel(`Commander (${car.name})`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('🚙')
      );

      await channel.send({ embeds: [carEmbed], components: [row] });
    }

    console.log('[BOUTIQUE] Salon boutique mis à jour avec succès.');
    return null;
  } catch (error) {
    console.error('[BOUTIQUE] Erreur lors de la mise à jour du salon boutique :', error);
    return `❌ Une erreur est survenue lors de la mise à jour : ${error.message}`;
  }
}

// ══════════════════════════════════════════════
// 🎫 SYSTEME DE SUPPORT & TICKETS CATEGORIES
// ══════════════════════════════════════════════
async function sendSupportPanel(targetChannel) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support — TERANGA BLOX RP')
      .setDescription(
        `│ Bienvenue sur le système de support de **TERANGA BLOX RP**.\n\n` +
        `**Choisis la catégorie qui correspond à ta demande :**\n\n` +
        `📋 **Requête Admin** — *Signalement, ban appeal, demande officielle*\n` +
        `🎭 **Question RP** — *Règles RP, scénarios, lore du serveur*\n` +
        `🔧 **Support Technique** — *Bug, crash, problème de connexion*\n` +
        `💬 **Question Générale** — *Toute autre question*\n\n` +
        `│ ⚠️ Un ticket = une demande.`
      )
      .setColor('#009A44')
      .setFooter({ text: 'Teranga Bot • Système de Tickets' })
      .setTimestamp();

    const logoPath = path.join(__dirname, 'logo.png');
    const files = [];
    if (fs.existsSync(logoPath)) {
      files.push(new AttachmentBuilder(logoPath, { name: 'logo.png' }));
      embed.setThumbnail('attachment://logo.png');
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_support_category')
      .setPlaceholder('📋 Choisis la catégorie qui correspond à ta demande...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Requête Admin')
          .setValue('cat_req_admin')
          .setDescription('Signalement, ban appeal, demande officielle')
          .setEmoji('📋'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Question RP')
          .setValue('cat_q_rp')
          .setDescription('Règles RP, scénarios, lore du serveur')
          .setEmoji('🎭'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Support Technique')
          .setValue('cat_tech_support')
          .setDescription('Bug, crash, problème de connexion')
          .setEmoji('🔧'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Question Générale')
          .setValue('cat_q_general')
          .setDescription('Toute autre question')
          .setEmoji('💬')
      ]);

    const button = new ButtonBuilder()
      .setCustomId('open_support_ticket_menu')
      .setLabel('Ouvrir un ticket')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🟢');

    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(button);

    await targetChannel.send({ embeds: [embed], components: [row1, row2], files });
    return null;
  } catch (err) {
    console.error('[SUPPORT-PANEL] Erreur lors de l\'envoi du panel support :', err);
    return `❌ Erreur lors de l'envoi : ${err.message}`;
  }
}


// Fonction pour générer la carte d'accueil dynamique entièrement personnalisée
async function generateWelcomeCard(member) {
  try {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const https = require('https');
    const http = require('http');

    // Dimensions de la carte
    const W = 800, H = 280;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ── Fond dégradé couleurs Sénégal (rouge sombre → vert sombre) ──
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#1a0505');  // Rouge sombre Sénégal
    bg.addColorStop(0.4, '#0d0d0d');  // Noir central
    bg.addColorStop(1,   '#041a09');  // Vert sombre Sénégal
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 20);
    ctx.fill();

    // ── Bordure rouge Sénégal ──
    ctx.strokeStyle = '#E31B23';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(2, 2, W - 4, H - 4, 18);
    ctx.stroke();

    // ── Ligne décorative or Sénégal ──
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, 14);
    ctx.stroke();

    // ── Logo Teranga (coin haut droite) ──
    try {
      const logoPath = path.join(__dirname, 'logo.png');
      const logo = await loadImage(logoPath);
      const logoSize = 110;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W - 65, 55, 52, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, W - 117, 3, logoSize, logoSize);
      ctx.restore();
      // Cercle autour du logo
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W - 65, 55, 52, 0, Math.PI * 2);
      ctx.stroke();
    } catch(e) {}

    // ── Avatar du membre ──
    const avatarUrl = member.user.displayAvatarURL({ forceStatic: true, extension: 'png', size: 256 });
    const avatarSize = 130;
    const avatarX = 75, avatarY = H / 2;
    try {
      // Télécharger l'avatar
      const avatarBuffer = await new Promise((resolve, reject) => {
        const url = new URL(avatarUrl);
        const proto = url.protocol === 'https:' ? https : http;
        proto.get(avatarUrl, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
      const avatar = await loadImage(avatarBuffer);

      // Ombre de l'avatar (rouge Sénégal)
      ctx.shadowColor = '#E31B23';
      ctx.shadowBlur = 20;

      // Cercle avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
      ctx.shadowBlur = 0;

      // Bordure avatar or Sénégal
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Bordure extérieure vert Sénégal
      ctx.strokeStyle = '#009A44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2 + 9, 0, Math.PI * 2);
      ctx.stroke();
    } catch(e) {
      console.error('Erreur avatar:', e.message);
    }

    // ── Texte BIENVENUE (couleur vert Sénégal) ──
    const textX = 165;
    ctx.shadowColor = '#009A44';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 42px Sans';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('BIENVENUE', textX, 100);
    ctx.shadowBlur = 0;

    // ── Ligne séparatrice drapeau Sénégal (vert → or → rouge) ──
    const lineGrad = ctx.createLinearGradient(textX, 0, W - 140, 0);
    lineGrad.addColorStop(0,   '#009A44');  // Vert Sénégal
    lineGrad.addColorStop(0.5, '#FFD700');  // Or/Jaune Sénégal
    lineGrad.addColorStop(1,   '#E31B23');  // Rouge Sénégal
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(textX, 115);
    ctx.lineTo(W - 140, 115);
    ctx.stroke();

    // ── Nom du membre ──
    const username = member.user.username;
    ctx.font = 'bold 28px Sans';
    ctx.fillStyle = '#FFD700';  // Or Sénégal
    ctx.fillText(username, textX, 158);

    // ── Sous-titre ──
    ctx.font = '20px Sans';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('vient de nous rejoindre !', textX, 190);

    // ── Tag TERANGA BLOX RP ──
    ctx.font = 'bold 15px Sans';
    ctx.fillStyle = '#009A44';  // Vert Sénégal
    ctx.fillText('🦁  TERANGA BLOX RP', textX, 240);

    // ── Nombre de membres ──
    const memberCount = member.guild.memberCount;
    ctx.font = '14px Sans';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Membre #${memberCount}`, textX, 262);

    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error('Erreur génération carte bienvenue :', err);
    return null;
  }
}

// Fonction pour supprimer automatiquement le salon vocal temporaire associé à un ticket
async function deleteAssociatedVoiceChannel(guild, targetUserId) {
  try {
    const parentId = (config.interviewCategoryId && config.interviewCategoryId.trim() !== "")
      ? config.interviewCategoryId
      : config.categoryId;

    const voiceChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildVoice && 
             c.parentId === parentId && 
             c.permissionOverwrites.cache.has(targetUserId) && 
             c.name.startsWith("🎤 Entretien")
    );
    if (voiceChannel) {
      console.log(`[RDV] Suppression automatique du salon vocal temporaire #${voiceChannel.name} pour l'utilisateur ${targetUserId}`);
      await voiceChannel.delete("Fermeture ou suppression du ticket").catch(e => console.error(e));
    }
  } catch (err) {
    console.error("Erreur lors de la suppression automatique du salon vocal :", err);
  }
}

// Fonction pour fermer automatiquement les tickets inactifs depuis plus de 24h
async function checkInactiveTickets() {
  console.log("[AUTO-CLOSE] Vérification des tickets inactifs...");
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.log("[AUTO-CLOSE] Serveur non trouvé dans le cache.");
      return;
    }

    const channels = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText && c.topic && c.topic.startsWith('visa-ticket-')
    );

    const now = Date.now();
    const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    for (const [channelId, channel] of channels) {
      const targetUserId = channel.topic.replace('visa-ticket-', '');

      // Vérifier si le joueur a toujours la permission de voir le salon
      const permissions = channel.permissionOverwrites.cache.get(targetUserId);
      
      // Si l'overwrite du joueur existe et qu'il n'a plus l'autorisation de voir le salon (ViewChannel: false),
      // cela signifie que le ticket a déjà été fermé.
      if (permissions && permissions.deny.has(PermissionFlagsBits.ViewChannel)) {
        continue;
      }

      // Récupérer le dernier message du salon
      let lastMessageTimestamp = channel.createdTimestamp;
      try {
        const messages = await channel.messages.fetch({ limit: 1 });
        const lastMsg = messages.first();
        if (lastMsg) {
          lastMessageTimestamp = lastMsg.createdTimestamp;
        }
      } catch (err) {
        console.error(`[AUTO-CLOSE] Impossible de récupérer les messages pour #${channel.name}:`, err.message);
      }

      if (now - lastMessageTimestamp >= INACTIVITY_LIMIT) {
        console.log(`[AUTO-CLOSE] Fermeture de #${channel.name} (inactif depuis plus de 24h)`);
        try {
          // Retirer la permission de lecture au joueur
          await channel.permissionOverwrites.edit(targetUserId, {
            ViewChannel: false
          });

          const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Fermé Automatiquement')
            .setDescription(`Ce ticket de visa a été fermé automatiquement après 24 heures d'inactivité.\nLe demandeur ne peut plus voir ce salon.`)
            .setColor(config.colors.gray)
            .setTimestamp();

          const deleteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('delete_ticket')
              .setLabel('Supprimer définitivement')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🗑️')
          );

          await channel.send({ embeds: [closeEmbed], components: [deleteRow] });

          // Envoyer le transcript aux logs
          await sendTicketTranscriptToLogs(channel, client.user, "Fermeture Automatique (Inactivité)", guild);
        } catch (closeErr) {
          console.error(`[AUTO-CLOSE] Erreur lors de la fermeture de #${channel.name}:`, closeErr);
        }
      }
    }
  } catch (error) {
    console.error("[AUTO-CLOSE] Erreur lors de la vérification :", error);
  }
}

// ══════════════════════════════════════════════
// 🎮 STATUT DU SERVEUR ROBLOX (Mise à jour automatique)
// ══════════════════════════════════════════════
async function updateRobloxStatus() {
  try {
    const guild = await client.guilds.fetch(config.guildId).catch(() => null);
    if (!guild) return;

    const channelId = config.robloxStatusChannelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      console.log(`[ROBLOX-STATUS] Salon ${channelId} introuvable.`);
      return;
    }

    let playingCount = 0;
    let maxPlayers = 150;
    const placeId = config.robloxPlaceId;

    if (placeId && placeId !== "18406354353") {
      try {
        const universeRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
        if (universeRes.ok) {
          const universeData = await universeRes.json();
          const universeId = universeData.universeId;

          const gameRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
          if (gameRes.ok) {
            const gameData = await gameRes.json();
            const game = gameData.data[0];
            if (game) {
              playingCount = game.playing || 0;
              maxPlayers = game.maxPlayers || 150;
            }
          }
        }
      } catch (apiErr) {
        console.error("[ROBLOX-STATUS] Erreur API Roblox (utilisation du fallback) :", apiErr.message);
        playingCount = Math.floor(Math.random() * 10) + 15; // Mock
      }
    } else {
      // Mock stats pour le mode démonstration
      playingCount = Math.floor(Math.random() * 8) + 12;
    }

    let inviteLink = config.discordInvite || "https://discord.gg/terangabloxrp";
    if (!config.discordInvite) {
      try {
        const invites = await guild.invites.fetch().catch(() => null);
        if (invites && invites.size > 0) {
          inviteLink = invites.first().url;
        }
      } catch (e) {}
    }

    const statusEmbed = new EmbedBuilder()
      .setTitle(`🦁 ${config.robloxGameName || 'TERANGA BLOX RP'}`)
      .setColor('#009A44') // Vert Sénégal
      .addFields(
        { name: '🟢 STATUT', value: '```yaml\n🟢 En ligne\n```', inline: true },
        { name: '👥 JOUEURS', value: `\`\`\`yaml\n${playingCount} / ${maxPlayers}\n\`\`\``, inline: true },
        { name: '⏰ REBOOTS', value: `\`\`\`yaml\n${config.rebootHours || '6h30 / 13h00 / 23h00'}\n\`\`\``, inline: false },
        { name: '💬 DISCORD', value: `\`\`\`\n${inviteLink}\n\`\`\``, inline: false },
        { name: '🎮 LIEN ROBLOX', value: `\`\`\`\n${config.robloxGameLink}\n\`\`\``, inline: false }
      )
      .setFooter({ text: 'Teranga RP • Mis à jour toutes les minutes' })
      .setTimestamp();

    const guildIcon = guild.iconURL({ forceStatic: true, extension: 'png', size: 128 });
    if (guildIcon) {
      statusEmbed.setThumbnail(guildIcon);
    }

    const bannerPath = path.join(__dirname, 'roblox_status_banner.png');
    const files = [];
    if (fs.existsSync(bannerPath)) {
      files.push(new AttachmentBuilder(bannerPath, { name: 'banner.png' }));
      statusEmbed.setImage('attachment://banner.png');
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🎮 Rejoindre')
        .setStyle(ButtonStyle.Link)
        .setURL(config.robloxGameLink),
      new ButtonBuilder()
        .setLabel('🛒 Boutique Roblox')
        .setStyle(ButtonStyle.Link)
        .setURL(config.robloxStoreLink)
    );

    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const botMessage = messages ? messages.find(m => m.author.id === client.user.id && m.embeds.length > 0) : null;

    if (botMessage) {
      await botMessage.edit({ embeds: [statusEmbed], files, components: [buttons] });
    } else {
      await channel.send({ embeds: [statusEmbed], files, components: [buttons] });
    }
    console.log("[ROBLOX-STATUS] Statut Roblox mis à jour avec succès.");

  } catch (err) {
    console.error("[ROBLOX-STATUS] Erreur lors de la mise à jour :", err);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.once('ready', async () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
  console.log(`Le bot est prêt à gérer les tickets de visa !`);

  // 🚀 ENREGISTREMENT AUTOMATIQUE DES COMMANDES SLASH DÈS LE DÉMARRAGE DU BOT !
  try {
    const { REST, Routes, SlashCommandBuilder } = require('discord.js');
    const token = process.env.DISCORD_TOKEN || config.token;

    if (token) {
      const rest = new REST({ version: '10' }).setToken(token);
      const slashCommands = [
        new SlashCommandBuilder()
          .setName('setup-concessionnaire')
          .setDescription('🏬 Installer le message d\'accueil du Concessionnaire dans ce salon'),

        new SlashCommandBuilder()
          .setName('setup-shop')
          .setDescription('🏬 Installer le message d\'accueil de la Boutique dans ce salon'),

        new SlashCommandBuilder()
          .setName('add-car')
          .setDescription('🏎️ Ajouter un véhicule au concessionnaire')
          .addStringOption(opt => opt.setName('nom').setDescription('Nom du véhicule').setRequired(true))
          .addStringOption(opt => opt.setName('prix').setDescription('Prix du véhicule').setRequired(true))
          .addAttachmentOption(opt => opt.setName('image').setDescription('Photo du véhicule').setRequired(true)),

        new SlashCommandBuilder()
          .setName('remove-car')
          .setDescription('🗑️ Retirer un véhicule du concessionnaire')
          .addStringOption(opt => opt.setName('nom').setDescription('Nom exact de la voiture').setRequired(true)),

        new SlashCommandBuilder()
          .setName('clear-shop')
          .setDescription('🗑️ Vider le concessionnaire'),

        new SlashCommandBuilder()
          .setName('setup-visa')
          .setDescription('🛂 Installer le panel de demande de visa')
      ].map(cmd => cmd.toJSON());

      await rest.put(
        Routes.applicationGuildCommands(client.user.id, config.guildId),
        { body: slashCommands }
      );
      console.log('✅ [SLASH COMMANDS] Les commandes slash (/) ont été enregistrées automatiquement sur le serveur Discord !');
    }
  } catch (slashErr) {
    console.error('❌ Erreur enregistrement auto commandes slash :', slashErr.message);
  }

  try {
    const guild = await client.guilds.fetch(config.guildId);
    
    // Lister les rôles du serveur pour aider au debug
    console.log(`--- LISTE DES RÔLES DE ${guild.name.toUpperCase()} ---`);
    const roles = await guild.roles.fetch();
    roles.forEach(role => {
      console.log(`Nom: "${role.name}" | ID: ${role.id}`);
    });
    console.log(`-----------------------------------------------`);

    // Lister les salons du serveur pour aider au debug
    console.log(`--- LISTE DES SALONS DE ${guild.name.toUpperCase()} ---`);
    const channels = await guild.channels.fetch();
    channels.forEach(channel => {
      if (channel.type === ChannelType.GuildText) {
        console.log(`Salon Textuel: "#${channel.name}" | ID: ${channel.id}`);
      } else if (channel.type === ChannelType.GuildVoice) {
        console.log(`Salon Vocal: "🔊 ${channel.name}" | ID: ${channel.id}`);
      } else if (channel.type === ChannelType.GuildCategory) {
        console.log(`Catégorie: "📁 ${channel.name}" | ID: ${channel.id}`);
      }
    });
    console.log(`-----------------------------------------------`);

    // Vérifier et corriger les permissions du salon de bienvenue AÉROPORT
    const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);
    if (welcomeChannel) {
      const botPerms = welcomeChannel.permissionsFor(client.user);
      console.log(`[PERMISSIONS] Bot dans #${welcomeChannel.name} (${welcomeChannel.id}) : [${botPerms.toArray().join(', ')}]`);

      // Ouvrir le salon AÉROPORT à @everyone (lecture seule - personne ne peut écrire sauf le bot)
      try {
        await welcomeChannel.permissionOverwrites.edit(guild.id, {
          ViewChannel: true,
          ReadMessageHistory: true,
          SendMessages: false
        });
        // Le bot peut envoyer des messages
        await welcomeChannel.permissionOverwrites.edit(client.user.id, {
          ViewChannel: true,
          SendMessages: true,
          EmbedLinks: true,
          AttachFiles: true,
          ReadMessageHistory: true
        });
        console.log(`[PERMISSIONS] ✅ Salon #${welcomeChannel.name} ouvert à @everyone (lecture seule).`);
      } catch (permErr) {
        console.error(`[PERMISSIONS] ❌ Erreur lors de la correction des permissions AÉROPORT :`, permErr.message);
      }
    } else {
      console.log(`[PERMISSIONS] Salon de bienvenue #${config.welcomeChannelId} introuvable.`);
    }

    // ══════════════════════════════════════════════
    // 🔒 VERROUILLAGE DES 4 CATÉGORIES TICKET
    // ══════════════════════════════════════════════
    const categoryIds = config.categoryIds || [config.categoryId];
    for (const catId of categoryIds) {
      try {
        let cat = guild.channels.cache.get(catId);
        if (!cat) cat = await guild.channels.fetch(catId).catch(() => null);
        if (!cat || cat.type !== ChannelType.GuildCategory) {
          console.log(`[TICKET-LOCK] Catégorie ${catId} introuvable, ignorée.`);
          continue;
        }

        // Bloquer @everyone
        await cat.permissionOverwrites.edit(guild.id, {
          ViewChannel: false,
          SendMessages: false
        });

        // Autoriser le bot
        await cat.permissionOverwrites.edit(client.user.id, {
          ViewChannel: true,
          SendMessages: true,
          ManageChannels: true,
          ReadMessageHistory: true
        });

        // Autoriser le staff
        for (const roleId of config.staffRoles) {
          const role = guild.roles.cache.get(roleId);
          if (!role) continue;
          await cat.permissionOverwrites.edit(roleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            ManageMessages: true
          });
        }

        console.log(`[TICKET-LOCK] ✅ Catégorie "${cat.name}" verrouillée — @everyone bloqué, staff autorisé.`);
      } catch (lockErr) {
        console.error(`[TICKET-LOCK] ❌ Erreur verrou catégorie ${catId} :`, lockErr.message);
      }
    }

    // Auto-setup du panel de support dans le salon 1459334727881199833
    const supportChanId = "1459334727881199833";
    const supportChan = guild.channels.cache.get(supportChanId) || await guild.channels.fetch(supportChanId).catch(() => null);
    if (supportChan) {
      console.log(`[SUPPORT-SETUP] Salon de support #${supportChan.name} (${supportChanId}) trouvé.`);
      const msgs = await supportChan.messages.fetch({ limit: 10 }).catch(() => null);
      const hasSupportPanel = msgs ? msgs.some(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title && m.embeds[0].title.includes('Support — Teranga RP')) : false;

      if (!hasSupportPanel) {
        console.log(`[SUPPORT-SETUP] Envoi automatique du panel de support dans #${supportChan.name}...`);
        await sendSupportPanel(supportChan);
      }
    }

  } catch (e) {
    console.error("Erreur lors de la récupération des rôles/salons du serveur :", e.message);
  }

  // Lancer la vérification toutes les 30 minutes (1 800 000 ms)
  setInterval(checkInactiveTickets, 30 * 60 * 1000);
  // Lancer une première vérification au démarrage après 10 secondes
  setTimeout(checkInactiveTickets, 10 * 1000);

  // Lancer le statut Roblox toutes les minutes (60 000 ms)
  setInterval(updateRobloxStatus, 60 * 1000);
  // Lancer une première mise à jour au démarrage après 5 secondes
  setTimeout(updateRobloxStatus, 5 * 1000);
});

// Événement d'interaction (commandes slash et boutons)
client.on('interactionCreate', async (interaction) => {
  console.log(`[INTERACTION] Utilisateur: ${interaction.user.tag} (${interaction.user.id}) | Type: ${interaction.type} | CustomId: ${interaction.customId || 'Aucun'}`);

  // --- Gestion de la soumission des formulaires (Modal Submit) ---
  if (interaction.isModalSubmit()) {
    const { customId, guild, user, member, channel } = interaction;

    if (customId.startsWith('modal_rdv_time_')) {
      const parts = customId.split('_');
      const targetUserId = parts[parts.length - 1];
      const enteredTime = interaction.fields.getTextInputValue('rdv_time_input').trim();

      const isModeratorStaff = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isModeratorStaff) {
        return await interaction.reply({
          content: "❌ Vous n'avez pas l'autorisation de planifier un rendez-vous.",
          ephemeral: true
        });
      }

      return await processRDVTimeSelection(interaction, targetUserId, enteredTime);
    }

    if (customId.startsWith('submit_questionnaire_')) {
      const targetUserId = customId.split('_')[2];
      
      if (user.id !== targetUserId) {
        return await interaction.reply({
          content: "❌ Seul le candidat de ce ticket peut soumettre le questionnaire.",
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const age = interaction.fields.getTextInputValue('q_age');
      const experience = interaction.fields.getTextInputValue('q_experience');
      const definition = interaction.fields.getTextInputValue('q_definition');
      const motivations = interaction.fields.getTextInputValue('q_motivations');
      const rules = interaction.fields.getTextInputValue('q_rules');

      // --- Analyse automatique des réponses ---
      let isConform = true;
      const alerts = [];

      const ageNum = parseInt(age.replace(/\D/g, ''), 10);
      if (isNaN(ageNum) || ageNum < 14) {
        isConform = false;
        alerts.push(`⚠️ **Âge suspect** : ${age} (Âge minimum 14 ans requis)`);
      }

      if (definition.trim().length < 15) {
        isConform = false;
        alerts.push("⚠️ **Définition du Power Gaming trop courte**");
      }

      if (/\bnon\b/i.test(rules)) {
        isConform = false;
        alerts.push("❌ **Règlement non lu ou jeu non installé** ('Non' détecté)");
      }

      // Embed des réponses envoyées : VERT si tout est vrai, ROUGE si faux !
      const responseEmbed = new EmbedBuilder()
        .setTitle('📝 Réponses au Questionnaire de Visa')
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ forceStatic: false }) })
        .addFields(
          { name: '1️⃣ Quel âge avez-vous ?', value: age },
          { name: '2️⃣ Votre expérience RP (Serveurs, durée)', value: experience },
          { name: '3️⃣ Qu\'est-ce que le Power Gaming ?', value: definition },
          { name: '4️⃣ Pourquoi Teranga Blox RP ?', value: motivations },
          { name: '5️⃣ Règlement lu & Jeu installé ?', value: rules }
        )
        .setColor(isConform ? '#00FF00' : '#D82C2C') // VERT si VRAI, ROUGE si FAUX !
        .setTimestamp();

      if (isConform) {
        responseEmbed.addFields({
          name: '🟢 DIAGNOSTIC AUTOMATIQUE',
          value: 'Toutes les réponses semblent conformes (aucune anomalie détectée).'
        });
      } else {
        responseEmbed.addFields({
          name: '🔴 DIAGNOSTIC AUTOMATIQUE (ALERTE STAFF)',
          value: alerts.join('\n')
        });
      }

      // Publier les réponses DIRECTEMENT DANS LE MÊME SALON TICKET !
      await channel.send({ embeds: [responseEmbed] });

      // Retirer le bouton "Répondre aux questions" pour éviter les doubles soumissions
      try {
        const messages = await channel.messages.fetch({ limit: 20 });
        const questionnaireMsg = messages.find(
          (m) => m.author.id === client.user.id && m.components.length > 0 && m.components[0].components[0].customId.startsWith('answer_questionnaire_')
        );
        if (questionnaireMsg) {
          await questionnaireMsg.edit({ components: [] });
        }
      } catch (err) {}

      return await interaction.editReply({
        content: '✅ Vos réponses ont été envoyées avec succès !'
      });
    }

    // 🏬 BOUTIQUE : Traiter la soumission de la commande de voiture
    if (customId.startsWith('modal_pay_') || customId.startsWith('modal_order_car_')) {
      let paymentMethod = "";
      let carId = "";

      if (customId.startsWith('modal_pay_')) {
        const parts = customId.replace('modal_pay_', '').split('_car_');
        const rawPayment = parts[0];
        if (rawPayment === "OrangeMoney") {
          paymentMethod = "Orange Money";
        } else {
          paymentMethod = rawPayment;
        }
        carId = parts[1];
      } else {
        carId = customId.replace('modal_order_car_', '');
      }

      const cars = loadCars();
      const car = cars.find(c => c.id === carId);

      if (!car) {
        return await interaction.reply({ content: "❌ Véhicule introuvable.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const robloxUsername = interaction.fields.getTextInputValue('order_roblox_username');
      const finalPaymentMethod = customId.startsWith('modal_pay_') ? paymentMethod : interaction.fields.getTextInputValue('order_payment_method');
      const notes = interaction.fields.getTextInputValue('order_notes') || 'Aucune';

      const orderId = `order_${Date.now()}`;

      // Enregistrer la commande dans orders.json
      const ordersFilePath = path.join(__dirname, 'orders.json');
      let orders = [];
      if (fs.existsSync(ordersFilePath)) {
        try {
          orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
        } catch (e) {
          console.error("Erreur lors de la lecture de orders.json :", e);
        }
      }
      orders.push({
        id: orderId,
        buyerId: user.id,
        buyerTag: user.tag,
        carId: car.id,
        carName: car.name,
        price: car.price,
        robloxUsername,
        paymentMethod: finalPaymentMethod,
        notes,
        timestamp: Date.now()
      });
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');

      // Envoyer la notification au staff
      const logsChannelId = config.shopLogsChannelId || config.ticketLogsChannelId;
      const logsChannel = guild.channels.cache.get(logsChannelId) || await guild.channels.fetch(logsChannelId).catch(() => null);

      let payLinkText = "";
      if (finalPaymentMethod.toLowerCase().includes('wave')) {
        payLinkText = `\n📱 **Lien de paiement Wave** : https://pay.wave.com/m/M_sn_PUt82lQMnu3z/c/sn/`;
      } else if (finalPaymentMethod.toLowerCase().includes('paypal')) {
        payLinkText = `\n💳 **Lien de paiement PayPal** : ${config.paypalLink || 'https://www.paypal.me/elimane221'}`;
      }

      if (logsChannel) {
        const orderEmbed = new EmbedBuilder()
          .setTitle('📦 Nouvelle Commande de Véhicule')
          .setDescription(
            `👤 **Acheteur** : <@${user.id}> (${user.tag})\n` +
            `🚗 **Véhicule** : **${car.name}**\n` +
            `💰 **Prix** : **${car.price}**\n` +
            `🎮 **Pseudo Roblox** : \`${robloxUsername}\`\n` +
            `💳 **Paiement** : \`${finalPaymentMethod}\`${payLinkText}\n` +
            `📝 **Notes/Options** : \`\`\`\n${notes}\n\`\`\`\n` +
            `🆔 **ID Commande** : \`${orderId}\`\n` +
            `🕒 **Date** : <t:${Math.floor(Date.now() / 1000)}:f>`
          )
          .setColor('#E31B23') // Rouge Sénégal
          .setTimestamp();

        if (car.imageUrl) {
          orderEmbed.setImage(car.imageUrl);
        }

        const userAvatar = user.displayAvatarURL({ forceStatic: true, extension: 'png', size: 128 });
        if (userAvatar) {
          orderEmbed.setThumbnail(userAvatar);
        }

        const actionButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`accept_order_${orderId}_${user.id}_${car.id}`)
            .setLabel('Valider la commande')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`deny_order_${orderId}_${user.id}_${car.id}`)
            .setLabel('Refuser la commande')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        await logsChannel.send({ embeds: [orderEmbed], components: [actionButtons] });
      }

      // Envoyer un DM de confirmation immédiat à l'acheteur avec le lien Wave / PayPal
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('📦 Commande Enregistrée !')
          .setDescription(
            `Bonjour, votre commande pour le véhicule **${car.name}** a bien été reçue par le staff.\n\n` +
            `🚗 **Véhicule** : **${car.name}**\n` +
            `💰 **Prix** : **${car.price}**\n` +
            `🎮 **Pseudo Roblox** : \`${robloxUsername}\`\n` +
            `💳 **Moyen de paiement** : \`${finalPaymentMethod}\`\n` +
            (finalPaymentMethod.toLowerCase().includes('wave') ? `\n📱 **Lien de paiement Wave** :\n👉 **[Payer via Wave](https://pay.wave.com/m/M_sn_PUt82lQMnu3z/c/sn/)**\n` : '') +
            (finalPaymentMethod.toLowerCase().includes('paypal') ? `\n💳 **Lien de paiement PayPal** :\n👉 **[Payer via PayPal.me](https://www.paypal.me/elimane221)**\n` : '') +
            `\n⚠️ *Le staff va examiner votre commande et vous contactera très rapidement pour procéder à la livraison.*`
          )
          .setColor('#009A44')
          .setFooter({ text: '🦁 Concessionnaire Teranga' })
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (dmErr) {
        console.error("Impossible d'envoyer le DM de confirmation de commande :", dmErr.message);
      }

      let replyContent = `✅ Ta commande pour le véhicule **${car.name}** (Payé par **${finalPaymentMethod}**) a été envoyée avec succès au staff ! Le traitement commencera bientôt.`;
      if (finalPaymentMethod.toLowerCase().includes('wave')) {
        replyContent += `\n\n📱 **Lien de paiement Wave** :\n👉 **[Payer](https://pay.wave.com/m/M_sn_PUt82lQMnu3z/c/sn/)**`;
      }

      return await interaction.editReply({
        content: replyContent
      });
    }
  }

  // --- Helper pour traiter la création du salon RDV ---
  async function processRDVTimeSelection(interaction, targetUserId, selectedTime) {
    const { guild, member, user } = interaction;

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    let targetMember = null;
    try {
      targetMember = await guild.members.fetch(targetUserId);
    } catch (err) {
      console.error("Impossible de récupérer le membre cible pour le salon vocal de RDV :", err);
    }
    
    const targetUsername = targetMember ? targetMember.user.username : targetUserId;
    let interviewVoiceChannel = null;

    // Calculer l'intervalle de 5 min (ex: de 08H05 à 08H10)
    let timeRangeText = selectedTime;
    let channelTimeLabel = "";
    let startTimeStr = selectedTime;
    let endTimeStr = "";

    if ((selectedTime.includes('h') || selectedTime.includes('H')) && !selectedTime.startsWith('Maintenant')) {
      const cleanTime = selectedTime.split(' ')[0].toUpperCase();
      const timeParts = cleanTime.split('H');
      const startH = parseInt(timeParts[0], 10);
      const startM = parseInt(timeParts[1] || '0', 10);

      if (!isNaN(startH) && !isNaN(startM)) {
        const startDate = new Date();
        startDate.setHours(startH, startM, 0, 0);

        const endDate = new Date(startDate.getTime() + 5 * 60 * 1000);
        const endH = String(endDate.getHours()).padStart(2, '0');
        const endM = String(endDate.getMinutes()).padStart(2, '0');

        startTimeStr = `${String(startH).padStart(2, '0')}H${String(startM).padStart(2, '0')}`;
        endTimeStr = `${endH}H${endM}`;
        timeRangeText = `de **${startTimeStr}** à **${endTimeStr}**`;
        channelTimeLabel = ` (${startTimeStr}-${endTimeStr})`;
      }
    }
    
    try {
      // Préparer les permissions pour le salon vocal
      const permissionOverwrites = [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: targetUserId, // Le candidat (Peut voir mais pas se connecter initialement)
          allow: [
            PermissionFlagsBits.ViewChannel
          ],
          deny: [
            PermissionFlagsBits.Connect
          ]
        },
        {
          id: client.user.id, // Le Bot
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ];

      // Ajouter les permissions pour le Staff
      config.staffRoles.forEach((roleId) => {
        if (guild.roles.cache.has(roleId)) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.MoveMembers
            ]
          });
        }
      });

      const parentId = (config.interviewCategoryId && config.interviewCategoryId.trim() !== "")
        ? config.interviewCategoryId
        : config.categoryId;

      // Créer le salon vocal temporaire avec l'intervalle d'heure (ex: 🎤 Entretien (08H05-08H10) - papasnfr)
      interviewVoiceChannel = await guild.channels.create({
        name: `🎤 Entretien${channelTimeLabel} - ${targetUsername}`,
        type: ChannelType.GuildVoice,
        parent: parentId,
        permissionOverwrites: permissionOverwrites
      });
    } catch (error) {
      console.error("Erreur lors de la création du salon vocal temporaire :", error);
    }

    const vocalMention = interviewVoiceChannel 
      ? `<#${interviewVoiceChannel.id}>` 
      : ((config.interviewVocalChannelId && config.interviewVocalChannelId.trim() !== "") 
         ? `<#${config.interviewVocalChannelId}>` 
         : "**Attente Entretien**");

    // Envoyer un embed public dans le salon de ticket
    const rdvEmbed = new EmbedBuilder()
      .setTitle('📅 Rendez-vous Entretien — TERANGA BLOX RP')
      .setDescription(
        `Bonjour <@${targetUserId}>,\n\n` +
        `Un membre du staff (<@${user.id}>) a fixé votre entretien oral de visa ${timeRangeText}.\n\n` +
        `📢 **Consignes :**\n` +
        `• Assurez-vous d'être disponible et connecté sur Discord durant ce créneau.\n` +
        `• Le salon vocal ${vocalMention} s'ouvrira automatiquement à l'heure du rendez-vous.\n` +
        `• Installez-vous dedans dès qu'il devient accessible.`
      )
      .setColor(config.colors.secondary)
      .setThumbnail(guild.iconURL({ forceStatic: false }) || null)
      .setFooter({ text: 'Teranga Bot • Entretien Planifié' })
      .setTimestamp();

    await interaction.channel.send({ content: `<@${targetUserId}>`, embeds: [rdvEmbed] });

    // Planifier l'ouverture automatique du salon vocal à l'heure programmée
    if (interviewVoiceChannel) {
      try {
        if (!selectedTime.startsWith('Maintenant')) {
          const cleanTime = selectedTime.split(' ')[0].toUpperCase();
          const [hoursStr, minutesStr] = cleanTime.split('H');
          const hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr || '0', 10);

          const targetDate = new Date();
          targetDate.setHours(hours, minutes, 0, 0);

          if (targetDate.getTime() < Date.now()) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          const delay = targetDate.getTime() - Date.now();
          console.log(`[RDV] Salon vocal #${interviewVoiceChannel.name} sera déverrouillé dans ${Math.round(delay / 1000 / 60)} minutes (à ${selectedTime}).`);

          if (delay > 0) {
            const channelIdToUnlock = interviewVoiceChannel.id;
            setTimeout(async () => {
              try {
                const currentVoiceChannel = await guild.channels.fetch(channelIdToUnlock).catch(() => null);
                if (currentVoiceChannel) {
                  await currentVoiceChannel.permissionOverwrites.edit(targetUserId, {
                    Connect: true,
                    Speak: true,
                    ViewChannel: true
                  });

                  await interaction.channel.send({
                    content: `🔔 <@${targetUserId}>, l'heure de votre rendez-vous (**${selectedTime}**) est arrivée ! Le salon vocal ${vocalMention} est maintenant déverrouillé, vous pouvez le rejoindre.`
                  }).catch(() => {});
                  
                  console.log(`[RDV] Salon vocal #${currentVoiceChannel.name} déverrouillé automatiquement pour l'utilisateur ${targetUserId} à l'heure prévue.`);
                }
              } catch (err) {
                console.error("Erreur lors du déverrouillage automatique du salon vocal :", err);
              }
            }, delay);
          }
        } else {
          // Si Immédiat, ouvrir tout de suite
          await interviewVoiceChannel.permissionOverwrites.edit(targetUserId, {
            Connect: true,
            Speak: true,
            ViewChannel: true
          });
        }
      } catch (planError) {
        console.error("Erreur lors du calcul ou de la planification du déverrouillage du salon vocal :", planError);
      }
    }

    return await interaction.editReply({
      content: `✅ Le rendez-vous a bien été fixé à **${selectedTime}** pour <@${targetUserId}>. Le salon vocal s'ouvrira automatiquement à cette heure-là.`
    });
  }

  // --- Gestion de la sélection de rendez-vous (Select Menu) ---
  if (interaction.isStringSelectMenu()) {
    const { customId, guild, member, user } = interaction;

    if (customId.startsWith('select_rdv_time_')) {
      const parts = customId.split('_');
      const targetUserId = parts[parts.length - 1];
      const selectedTime = interaction.values[0];

      const isModeratorStaff = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isModeratorStaff) {
        return await interaction.reply({
          content: "❌ Vous n'avez pas l'autorisation de planifier un rendez-vous.",
          ephemeral: true
        });
      }

      if (selectedTime.startsWith('Saisir')) {
        const now = new Date();
        let m = Math.ceil(now.getMinutes() / 5) * 5;
        now.setMinutes(m);
        const defaultTimeStr = `${String(now.getHours()).padStart(2, '0')}H${String(now.getMinutes()).padStart(2, '0')}`;

        const modal = new ModalBuilder()
          .setCustomId(`modal_rdv_time_${targetUserId}`)
          .setTitle('📅 Saisir l\'heure du RDV');

        const timeInput = new TextInputBuilder()
          .setCustomId('rdv_time_input')
          .setLabel('Heure du RDV (ex: 08H05, 14H20, 23H55)')
          .setPlaceholder('ex: 08H05')
          .setValue(defaultTimeStr)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(timeInput);
        modal.addComponents(row);

        return await interaction.showModal(modal);
      }

      return await processRDVTimeSelection(interaction, targetUserId, selectedTime);
    }

    // 🎫 SUPPORT : Traiter la création d'un ticket selon la catégorie choisie
    if (customId === 'select_support_category') {
      await interaction.deferReply({ ephemeral: true });
      const categoryValue = interaction.values[0];

      const categoryMap = {
        'cat_req_admin': { label: 'Requête Admin', prefix: 'ticket-admin', emoji: '📋', desc: 'Signalement, ban appeal, demande officielle' },
        'cat_q_rp': { label: 'Question RP', prefix: 'ticket-rp', emoji: '🎭', desc: 'Règles RP, scénarios, lore du serveur' },
        'cat_tech_support': { label: 'Support Technique', prefix: 'ticket-tech', emoji: '🔧', desc: 'Bug, crash, problème de connexion' },
        'cat_q_general': { label: 'Question Générale', prefix: 'ticket-general', emoji: '💬', desc: 'Toute autre question' }
      };

      const selectedInfo = categoryMap[categoryValue] || categoryMap['cat_q_general'];

      // Vérifier si un ticket support existe déjà pour cet utilisateur
      const existingChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && c.topic && c.topic.startsWith(`support-ticket-${user.id}`)
      );

      if (existingChannel) {
        return await interaction.editReply({
          content: `❌ Vous avez déjà un ticket de support ouvert dans le salon <#${existingChannel.id}>.`
        });
      }

      // Récupérer la catégorie de tickets
      const categoryIds = config.categoryIds || [config.categoryId];
      let category = null;
      let minChildren = Infinity;

      for (const catId of categoryIds) {
        let cat = guild.channels.cache.get(catId);
        if (!cat) {
          try { cat = await guild.channels.fetch(catId); } catch (e) { continue; }
        }
        if (!cat || cat.type !== ChannelType.GuildCategory) continue;

        const childCount = guild.channels.cache.filter(c => c.parentId === catId).size;
        if (childCount < minChildren) {
          minChildren = childCount;
          category = cat;
        }
      }

      const permissionOverwrites = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ];

      (config.staffRoles || []).forEach((roleId) => {
        if (guild.roles.cache.has(roleId)) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
      });

      const sanitizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const channelName = `${selectedInfo.prefix}-${sanitizedUsername}`;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category ? category.id : undefined,
        topic: `support-ticket-${user.id}-${categoryValue}`,
        permissionOverwrites: permissionOverwrites
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`${selectedInfo.emoji} SUPPORT — ${selectedInfo.label.toUpperCase()} — TERANGA BLOX RP`)
        .setDescription(
          `👋 Bonjour <@${user.id}>, bienvenu(e) dans votre ticket de support.\n\n` +
          `📌 **Catégorie :** ${selectedInfo.label}\n` +
          `📝 **Description :** *${selectedInfo.desc}*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚠️ **INSTRUCTIONS :**\n` +
          `• Veuillez expliquer votre demande ou votre problème en détail ci-dessous.\n` +
          `• Si nécessaire, ajoutez des captures d'écran ou preuves.\n` +
          `• Un membre du staff va prendre en charge votre ticket sous peu.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `│ ⚠️ Un ticket = une demande.`
        )
        .setColor('#009A44')
        .setThumbnail(guild.iconURL({ forceStatic: false }) || null)
        .setFooter({ text: 'Teranga Bot • Système de Tickets' })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${user.id}`)
          .setLabel('Fermer le ticket')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId(`visa_claim_${user.id}`)
          .setLabel('Prise en charge')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📌'),
        new ButtonBuilder()
          .setCustomId(`schedule_rdv_${user.id}`)
          .setLabel('RDV')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📅'),
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('Supprimer définitivement')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
      );

      await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [actionRow] });

      return await interaction.editReply({
        content: `✅ Votre ticket **${selectedInfo.label}** a été créé avec succès dans <#${ticketChannel.id}> !`
      });
    }

    // 🏬 BOUTIQUE : Traiter la sélection d'un véhicule
    if (customId === 'select_car_shop') {
      await interaction.deferUpdate();
      const carId = interaction.values[0];
      const cars = loadCars();
      const car = cars.find(c => c.id === carId);

      if (!car) {
        return await interaction.followUp({ content: "❌ Véhicule introuvable.", ephemeral: true });
      }

      const carEmbed = new EmbedBuilder()
        .setTitle(`🚗 ${car.name}`)
        .setDescription(
          `**Prix :** \`\`\`yaml\n${car.price}\n\`\`\`\n` +
          `💵 **Moyens de paiement acceptés :**\n` +
          `📱 **Wave** | 🍊 **Orange Money** | 💳 **PayPal**\n\n` +
          `Pour commander ce véhicule sur **TERANGA BLOX RP**, cliquez sur le bouton ci-dessous pour remplir le formulaire.`
        )
        .setColor('#FFD700') // Or/Jaune Sénégal
        .setFooter({ text: 'Concessionnaire Teranga Blox RP' });

      if (car.imageUrl) {
        carEmbed.setImage(car.imageUrl);
      }

      const orderButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`order_car_${car.id}`)
          .setLabel('🛒 Commander ce véhicule')
          .setStyle(ButtonStyle.Success)
      );

      return await interaction.editReply({
        content: `🚗 Fiche de : **${car.name}**`,
        embeds: [carEmbed],
        components: [orderButton]
      });
    }
  }

  // --- 1. Gestion des commandes Slash ---
  if (interaction.isChatInputCommand()) {



    if (interaction.commandName === 'setup-visa' || interaction.commandName === 'setup-ticket' || interaction.commandName === 'setup-whitelist-ticket') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || (config.staffRoles && config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId)));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      try {
        await interaction.deferReply({ ephemeral: true });

        const bannerJpg = path.join(__dirname, 'visa_banner.jpg');
        const bannerPng = path.join(__dirname, 'visa_banner.png');
        const logoPng = path.join(__dirname, 'logo.png');
        const files = [];

        const embed = new EmbedBuilder()
          .setColor('#009A44');

        if (fs.existsSync(bannerJpg)) {
          files.push(new AttachmentBuilder(bannerJpg, { name: 'visa_banner.jpg' }));
          embed.setImage('attachment://visa_banner.jpg');
        } else if (fs.existsSync(bannerPng)) {
          files.push(new AttachmentBuilder(bannerPng, { name: 'visa_banner.png' }));
          embed.setImage('attachment://visa_banner.png');
        } else if (fs.existsSync(logoPng)) {
          files.push(new AttachmentBuilder(logoPng, { name: 'logo.png' }));
          embed.setImage('attachment://logo.png');
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('request_visa')
            .setLabel('Demander mon Visa')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛂')
        );

        let sendError = null;
        if (interaction.channel) {
          await interaction.channel.send({ embeds: [embed], components: [row], files }).catch((err) => {
            sendError = err.message;
          });
        }

        if (sendError) {
          return await interaction.editReply({ content: `❌ **Erreur d'envoi du panel :** ${sendError}\n*(Vérifiez que le bot a les permissions "Envoyer des messages" et "Intégrer des liens" dans ce salon)*` });
        }

        return await interaction.editReply({ content: '✅ Le panel de demande de visa a été envoyé avec succès !' });
      } catch (error) {
        console.error('Erreur lors du setup visa :', error);
        return await interaction.editReply({ content: `❌ **Erreur :** ${error.message}` }).catch(() => {});
      }
    }

    // ══════════════════════════════════════════
    // 🏬 BOUTIQUE : COMMANDES SLASH
    // ══════════════════════════════════════════
    if (interaction.commandName === 'add-car') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const nom = interaction.options.getString('nom');
      const prix = interaction.options.getString('prix');
      const imageAttachment = interaction.options.getAttachment('image');

      const cars = loadCars();
      if (cars.some(c => c.name.toLowerCase() === nom.toLowerCase())) {
        return interaction.editReply({ content: `❌ Un véhicule nommé **${nom}** existe déjà dans la boutique !` });
      }

      const newCar = {
        id: `car_${Date.now()}`,
        name: nom,
        price: prix,
        imageUrl: imageAttachment.url
      };

      cars.push(newCar);
      saveCars(cars);

      const err = await updateShopCatalog(interaction.guild);
      if (err) {
        return interaction.editReply({
          content: `✅ Le véhicule **${nom}** a été enregistré en base de données, mais la mise à jour automatique du salon boutique a échoué :\n${err}`
        });
      }

      return interaction.editReply({
        content: `✅ Le véhicule **${nom}** a été ajouté avec succès au catalogue au prix de **${prix}** et le salon boutique a été mis à jour !`
      });
    }

    if (interaction.commandName === 'remove-car') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const nom = interaction.options.getString('nom');

      let cars = loadCars();
      const originalLength = cars.length;
      cars = cars.filter(c => c.name.toLowerCase() !== nom.toLowerCase());

      if (cars.length === originalLength) {
        return interaction.editReply({ content: `❌ Aucun véhicule nommé **${nom}** n'a été trouvé dans la boutique.` });
      }

      saveCars(cars);

      const err = await updateShopCatalog(interaction.guild);
      if (err) {
        return interaction.editReply({
          content: `✅ Le véhicule **${nom}** a été retiré de la base de données, mais la mise à jour automatique du salon boutique a échoué :\n${err}`
        });
      }

      return interaction.editReply({
        content: `✅ Le véhicule **${nom}** a été retiré avec succès de la boutique et le salon boutique a été mis à jour !`
      });
    }

    if (interaction.commandName === 'setup-shop' || interaction.commandName === 'setup-concessionnaire') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const err = await updateShopCatalog(interaction.guild);
      if (err) {
        return interaction.editReply({ content: err });
      }
      return interaction.editReply({ content: '✅ Le salon boutique a été configuré et mis à jour avec succès !' });
    }

    if (interaction.commandName === 'setup-support') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const targetChannelId = "1459334727881199833";
      const targetChan = interaction.guild.channels.cache.get(targetChannelId) || interaction.channel;

      const err = await sendSupportPanel(targetChan);
      if (err) {
        return interaction.editReply({ content: err });
      }
      return interaction.editReply({ content: `✅ Le panel de support a été configuré et envoyé avec succès dans <#${targetChan.id}> !` });
    }

    if (interaction.commandName === 'clear-shop') {
      const isStaffMember = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isStaffMember) {
        return interaction.reply({ content: '❌ Cette commande est réservée au staff.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      saveCars([]);
      const err = await updateShopCatalog(interaction.guild);
      if (err) {
        return interaction.editReply({ content: `✅ La boutique a été vidée de la base de données, mais la mise à jour automatique du salon boutique a échoué :\n${err}` });
      }
      return interaction.editReply({ content: '✅ La boutique a été vidée et le salon boutique a été mis à jour avec succès !' });
    }
    return;
  }

  // --- 2. Gestion des boutons ---
  if (interaction.isButton()) {
    const { customId, guild, member, user } = interaction;

    // 🎫 SUPPORT : Bouton "Ouvrir un ticket"
    if (customId === 'open_support_ticket_menu') {
      const supportMenu = new StringSelectMenuBuilder()
        .setCustomId('select_support_category')
        .setPlaceholder('📋 Choisis la catégorie de ton ticket...')
        .addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel('Requête Admin')
            .setValue('cat_req_admin')
            .setDescription('Signalement, ban appeal, demande officielle')
            .setEmoji('📋'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Question RP')
            .setValue('cat_q_rp')
            .setDescription('Règles RP, scénarios, lore du serveur')
            .setEmoji('🎭'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Support Technique')
            .setValue('cat_tech_support')
            .setDescription('Bug, crash, problème de connexion')
            .setEmoji('🔧'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Question Générale')
            .setValue('cat_q_general')
            .setDescription('Toute autre question')
            .setEmoji('💬')
        ]);

      const selectRow = new ActionRowBuilder().addComponents(supportMenu);

      return await interaction.reply({
        content: '📌 **Sélectionnez la catégorie appropriée pour ouvrir votre ticket :**',
        components: [selectRow],
        ephemeral: true
      });
    }

    // 🏬 BOUTIQUE : Ouvrir le catalogue (Dropdown select)
    if (customId === 'open_shop_catalog') {
      const cars = loadCars();
      if (cars.length === 0) {
        return await interaction.reply({
          content: "❌ La boutique est actuellement vide ! Le staff n'a pas encore ajouté de véhicules.",
          ephemeral: true
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_car_shop')
        .setPlaceholder('Sélectionnez un véhicule dans le catalogue...')
        .addOptions(
          cars.slice(0, 25).map(car =>
            new StringSelectMenuOptionBuilder()
              .setLabel(car.name)
              .setValue(car.id)
              .setDescription(`Prix: ${car.price}`)
          )
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      return await interaction.reply({
        content: '🚗 **Catalogue des véhicules importés**\nChoisissez un véhicule ci-dessous pour voir sa fiche et le commander :',
        components: [row],
        ephemeral: true
      });
    }

    // 🏬 BOUTIQUE : Ouvrir le Modal de commande (avec moyen de paiement choisi via bouton)
    if (customId.startsWith('order_wave_') || customId.startsWith('order_orange_') || customId.startsWith('order_paypal_') || customId.startsWith('order_car_')) {
      let paymentMethod = "";
      let carId = "";

      if (customId.startsWith('order_wave_')) {
        paymentMethod = "Wave";
        carId = customId.replace('order_wave_', '');
      } else if (customId.startsWith('order_orange_')) {
        paymentMethod = "Orange Money";
        carId = customId.replace('order_orange_', '');
      } else if (customId.startsWith('order_paypal_')) {
        paymentMethod = "PayPal";
        carId = customId.replace('order_paypal_', '');
      } else {
        paymentMethod = "Autre";
        carId = customId.replace('order_car_', '');
      }

      const cars = loadCars();
      const car = cars.find(c => c.id === carId);

      if (!car) {
        return await interaction.reply({
          content: "❌ **Ce bouton provient d'un ancien test.**\n👉 Tapez la commande **`!setup-concessionnaire`** dans ce salon pour afficher le nouveau catalogue propre !",
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`modal_pay_${paymentMethod.replace(/\s+/g, '')}_car_${car.id}`)
        .setTitle(`Commande : ${car.name}`);

      const robloxUserField = new TextInputBuilder()
        .setCustomId('order_roblox_username')
        .setLabel('Pseudo Roblox')
        .setPlaceholder('Entrez votre pseudo Roblox')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const notesField = new TextInputBuilder()
        .setCustomId('order_notes')
        .setLabel('Détails / Options / Couleur')
        .setPlaceholder('ex: Couleur noire, vitres teintées (Optionnel)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(robloxUserField),
        new ActionRowBuilder().addComponents(notesField)
      );

      return await interaction.showModal(modal);
    }

    // 🏬 BOUTIQUE : Traiter commande (Valider / Refuser par le Staff)
    if (customId.startsWith('accept_order_') || customId.startsWith('deny_order_')) {
      const isAccept = customId.startsWith('accept_order_');
      const raw = customId.replace(isAccept ? 'accept_order_' : 'deny_order_', '');
      const parts = raw.split('_');
      const orderId = parts[0] + '_' + parts[1];
      const buyerId = parts[2];
      const carId = parts[3] + '_' + parts[4];

      const isStaffMember = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isStaffMember) {
        return await interaction.reply({ content: "❌ Vous n'avez pas l'autorisation de gérer cette commande.", ephemeral: true });
      }

      await interaction.deferUpdate();

      const cars = loadCars();
      const car = cars.find(c => c.id === carId);
      const carName = car ? car.name : 'Véhicule inconnu';

      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(isAccept ? '#009A44' : '#D82C2C')
        .addFields({
          name: isAccept ? '✅ Statut' : '❌ Statut',
          value: `Traité par <@${user.id}> : **${isAccept ? 'Validée' : 'Refusée'}**`
        });

      await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

      try {
        const buyer = await guild.members.fetch(buyerId);
        if (buyer) {
          const ordersFilePath = path.join(__dirname, 'orders.json');
          let order = null;
          if (fs.existsSync(ordersFilePath)) {
            try {
              const orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
              order = orders.find(o => o.id === orderId);
              if (order) {
                order.status = isAccept ? 'validated_waiting_payment' : 'rejected';
                fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
              }
            } catch (e) {
              console.error(e);
            }
          }

          let dmEmbed;
          let components = [];
          if (isAccept) {
            dmEmbed = new EmbedBuilder()
              .setTitle('✅ Commande Validée !')
              .setDescription(
                `Bonjour, votre commande pour le véhicule **${carName}** sur le serveur **TERANGA BLOX RP** a été **validée** par le staff ! 🎉\n\n` +
                `👉 **Veuillez choisir votre moyen de paiement ci-dessous pour continuer :**`
              )
              .setColor('#009A44')
              .setFooter({ text: '🦁 Système de Boutique Teranga' })
              .setTimestamp();

            const paymentButtonsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`choose_pay_wave_${orderId}_${buyerId}_${carId}`)
                .setLabel('Wave 📱')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`choose_pay_orange_${orderId}_${buyerId}_${carId}`)
                .setLabel('Orange Money 🍊')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`choose_pay_paypal_${orderId}_${buyerId}_${carId}`)
                .setLabel('PayPal 💳')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`choose_pay_autre_${orderId}_${buyerId}_${carId}`)
                .setLabel('Autre 💵')
                .setStyle(ButtonStyle.Secondary)
            );
            components.push(paymentButtonsRow);
          } else {
            dmEmbed = new EmbedBuilder()
              .setTitle('❌ Commande Refusée')
              .setDescription(
                `Bonjour, votre commande pour le véhicule **${carName}** sur le serveur **TERANGA BLOX RP** a été **refusée** par le staff.\n\n` +
                `⚠️ N'hésitez pas à ouvrir un ticket de support si vous avez des questions.`
              )
              .setColor('#D82C2C')
              .setFooter({ text: '🦁 Système de Boutique Teranga' })
              .setTimestamp();
          }

          await buyer.send({ embeds: [dmEmbed], components }).catch(() => {});
        }
      } catch (dmErr) {
        console.error("Impossible de DM le client de la commande :", dmErr.message);
      }
    }

    // 🏬 BOUTIQUE : Choisir le moyen de paiement dans le DM de l'acheteur
    if (customId.startsWith('choose_pay_')) {
      let method = 'autre';
      let prefix = 'choose_pay_autre_';
      if (customId.startsWith('choose_pay_wave_')) { method = 'wave'; prefix = 'choose_pay_wave_'; }
      else if (customId.startsWith('choose_pay_orange_')) { method = 'orange'; prefix = 'choose_pay_orange_'; }
      else if (customId.startsWith('choose_pay_paypal_')) { method = 'paypal'; prefix = 'choose_pay_paypal_'; }

      const raw = customId.replace(prefix, '');
      const parts = raw.split('_');
      const orderId = parts[0] + '_' + parts[1];
      const buyerId = parts[2];
      const carId = parts[3] + '_' + parts[4];

      await interaction.deferUpdate();

      // Mettre à jour le moyen de paiement dans orders.json
      const ordersFilePath = path.join(__dirname, 'orders.json');
      let carName = 'Véhicule';
      let carPrice = '0';
      let paymentMethodName = 'Autre';
      if (method === 'wave') paymentMethodName = 'Wave';
      if (method === 'orange') paymentMethodName = 'Orange Money';
      if (method === 'paypal') paymentMethodName = 'PayPal';

      if (fs.existsSync(ordersFilePath)) {
        try {
          const orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
          const order = orders.find(o => o.id === orderId);
          if (order) {
            order.paymentMethod = paymentMethodName;
            carName = order.carName;
            carPrice = order.price;
            fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error(e);
        }
      }

      let dmDescription = "";
      if (method === 'wave') {
        dmDescription = `📱 **Paiement par Wave**\n\n` +
          `Veuillez effectuer un paiement de **${carPrice}** via Wave au numéro **76 737 10 67** ou via le lien ci-dessous :\n` +
          `👉 **[Payer](https://pay.wave.com/m/M_sn_PUt82lQMnu3z/c/sn/)**\n\n` +
          `ℹ️ *Note : Si vous utilisez le lien de paiement, vous devez saisir manuellement le montant de **${carPrice}** dans la case "Montant" sur votre application Wave (comme montré sur votre écran).*\n\n` +
          `⚠️ **IMPORTANT : Une fois le paiement effectué, veuillez prendre une capture d'écran du reçu et l'envoyer DIRECTEMENT en réponse à ce message privé (envoyez l'image ici).**\n` +
          `Le bot la transmettra automatiquement au staff pour valider la livraison.`;
      } else if (method === 'orange') {
        dmDescription = `🍊 **Paiement par Orange Money**\n\n` +
          `Veuillez effectuer le paiement de **${carPrice}** via Orange Money au numéro **76 737 10 67**.\n\n` +
          `⚠️ **IMPORTANT : Une fois le paiement effectué, veuillez prendre une capture d'écran du reçu et l'envoyer DIRECTEMENT en réponse à ce message privé (envoyez l'image ici).**\n` +
          `Le bot la transmettra automatiquement au staff pour valider la livraison.`;
      } else if (method === 'paypal') {
        dmDescription = `💳 **Paiement par PayPal**\n\n` +
          `Veuillez effectuer le paiement de **${carPrice}** via PayPal en utilisant le lien ci-dessous :\n` +
          `👉 **[Payer via PayPal.me](https://www.paypal.me/elimane221)**\n\n` +
          `⚠️ **IMPORTANT : Une fois le paiement effectué, veuillez prendre une capture d'écran du reçu et l'envoyer DIRECTEMENT en réponse à ce message privé (envoyez l'image ici).**\n` +
          `Le bot la transmettra automatiquement au staff pour valider la livraison.`;
      } else {
        dmDescription = `💵 **Autre moyen de paiement**\n\n` +
          `Veuillez procéder au paiement de **${carPrice}** avec la méthode convenue.\n\n` +
          `⚠️ **IMPORTANT : Une fois le paiement effectué, veuillez prendre une capture d'écran du reçu et l'envoyer DIRECTEMENT en réponse à ce message privé (envoyez l'image ici).**\n` +
          `Le bot la transmettra automatiquement au staff pour valider la livraison.`;
      }

      const responseEmbed = new EmbedBuilder()
        .setTitle(`💳 Moyen de paiement choisi : ${paymentMethodName}`)
        .setDescription(dmDescription)
        .setColor('#FFD700')
        .setFooter({ text: '🦁 Système de Boutique Teranga' })
        .setTimestamp();

      await interaction.message.edit({ embeds: [responseEmbed], components: [] });
    }

    // 🏬 BOUTIQUE : Confirmer Livraison du véhicule / Rejeter le reçu de paiement par le Staff
    if (customId.startsWith('deliver_car_') || customId.startsWith('reject_payment_')) {
      const isDeliver = customId.startsWith('deliver_car_');
      const raw = customId.replace(isDeliver ? 'deliver_car_' : 'reject_payment_', '');
      const parts = raw.split('_');
      const orderId = parts[0] + '_' + parts[1];
      const buyerId = parts[2];

      const isStaffMember = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isStaffMember) {
        return await interaction.reply({ content: "❌ Vous n'avez pas l'autorisation de gérer les livraisons.", ephemeral: true });
      }

      await interaction.deferUpdate();

      const ordersFilePath = path.join(__dirname, 'orders.json');
      let order = null;
      let orders = [];
      if (fs.existsSync(ordersFilePath)) {
        try {
          orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
          order = orders.find(o => o.id === orderId);
          if (order) {
            order.status = isDeliver ? 'completed' : 'validated_waiting_payment';
            fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error(e);
        }
      }

      const carName = order ? order.carName : 'Véhicule inconnu';

      // Modifier l'embed du salon de validation pour afficher le statut final
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(isDeliver ? '#009A44' : '#D82C2C')
        .addFields({
          name: isDeliver ? '📦 Statut Livraison' : '❌ Statut Reçu',
          value: `Traité par <@${user.id}> : **${isDeliver ? 'Paiement Validé & Véhicule Livré' : 'Reçu Rejeté (Attente nouveau reçu)'}**`
        });

      await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

      // DM le client
      try {
        const buyer = await guild.members.fetch(buyerId);
        if (buyer) {
          let dmDescription = "";
          if (isDeliver) {
            dmDescription = `✅ **Paiement Validé !** Votre reçu pour le véhicule **${carName}** a été validé par le staff.\n\n` +
              `🚗 Un membre du staff va procéder à la livraison de votre véhicule en jeu sur **TERANGA BLOX RP**. Préparez-vous !`;
          } else {
            dmDescription = `❌ **Reçu de paiement rejeté !**\n\n` +
              `Le staff a examiné la capture d'écran de votre reçu pour le véhicule **${carName}** mais n'a pas pu valider le paiement.\n\n` +
              `👉 **Veuillez effectuer à nouveau le paiement ou renvoyer une capture d'écran valide en répondant directement à ce message privé (envoyez l'image ici).**`;
            if (order && order.paymentMethod.toLowerCase().includes('wave')) {
              dmDescription += `\n📱 **Lien Wave** : [Payer](https://pay.wave.com/m/M_sn_PUt82lQMnu3z/c/sn/)`;
            }
          }

          const dmEmbed = new EmbedBuilder()
            .setTitle(isDeliver ? '✅ Commande Livrée / Paiement Validé !' : '❌ Reçu de Paiement Rejeté')
            .setDescription(dmDescription)
            .setColor(isDeliver ? '#009A44' : '#D82C2C')
            .setFooter({ text: '🦁 Système de Boutique Teranga' })
            .setTimestamp();

          await buyer.send({ embeds: [dmEmbed] }).catch(() => {});
        }
      } catch (dmErr) {
        console.error("Impossible de notifier le client en DM :", dmErr.message);
      }
      return;
    }

    // Bouton de demande de Visa (Public) : Crée le salon ticket directement sans popup modal
    if (customId === 'request_visa') {
      try {
        await interaction.deferReply({ ephemeral: true });

        // Vérifier si le membre possède déjà le rôle Citoyen / Visa
        const hasVisaRole = (config.citizenRoleId && member.roles.cache.has(config.citizenRoleId)) || 
                            (config.visaRoleId && member.roles.cache.has(config.visaRoleId)) || 
                            (config.whitelistRoleId && member.roles.cache.has(config.whitelistRoleId)) ||
                            member.roles.cache.has('1537874314924265632') ||
                            member.roles.cache.has('1539153130669744188');

        if (hasVisaRole) {
          const alreadyCitizenEmbed = new EmbedBuilder()
            .setTitle('✅ Visa déjà obtenu !')
            .setDescription('Tu possèdes déjà le rôle **Citoyen** !')
            .setColor('#00FF00')
            .setFooter({ text: `Teranga Bot • Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` });

          return await interaction.editReply({ embeds: [alreadyCitizenEmbed] });
        }

        // Vérifier si un ticket est déjà ouvert pour cet utilisateur
        const existingChannel = guild.channels.cache.find(
          (c) => c.type === ChannelType.GuildText && c.topic === `visa-ticket-${user.id}`
        );

        if (existingChannel) {
          const userPermissions = existingChannel.permissionsFor(interaction.user);
          const hasAccess = userPermissions ? userPermissions.has(PermissionFlagsBits.ViewChannel) : false;

          if (hasAccess) {
            return await interaction.editReply({
              content: `❌ Vous avez déjà un ticket de visa ouvert dans le salon <#${existingChannel.id}>.`
            });
          } else {
            try {
              await existingChannel.delete("Nouveau ticket demandé par l'utilisateur.");
            } catch (deleteErr) {}
          }
        }

        // Récupérer les catégories de tickets
        const categoryIds = config.categoryIds || [config.categoryId];
        let category = null;
        let minChildren = Infinity;

        for (const catId of categoryIds) {
          let cat = guild.channels.cache.get(catId);
          if (!cat) {
            try { cat = await guild.channels.fetch(catId); } catch (e) { continue; }
          }
          if (!cat || cat.type !== ChannelType.GuildCategory) continue;

          const childCount = guild.channels.cache.filter(c => c.parentId === catId).size;
          if (childCount < minChildren) {
            minChildren = childCount;
            category = cat;
          }
        }

        const permissionOverwrites = [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ];

        (config.staffRoles || []).forEach((roleId) => {
          if (guild.roles.cache.has(roleId)) {
            permissionOverwrites.push({
              id: roleId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
              ]
            });
          }
        });

        const channelName = `visa-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category ? category.id : undefined,
          topic: `visa-ticket-${user.id}`,
          permissionOverwrites: permissionOverwrites
        });

        const visaId = getNextVisaId();

        const staffPings = (config.staffRoles || []).map(rId => `<@&${rId}>`).join(' ');

        await ticketChannel.send({
          content: `<@${user.id}> ${staffPings} 🎫 Ton ticket a été créé ! L'équipe d'administration va bientôt te répondre.\n⚠️ **Compte Roblox non lié** (Pensez à lier votre compte via Bloxlink ou RoVer).`
        }).catch(err => console.error("Erreur envoi notification ticket:", err));

        let initialVocalStatus = '🔴 Non connecté en vocal';
        if (member && member.voice && member.voice.channelId) {
          initialVocalStatus = member.voice.selfMute
            ? `🟡 Connecté (Micro Muet 🔇) dans <#${member.voice.channelId}>`
            : `🟢 Connecté (Micro Actif 🎙️) dans <#${member.voice.channelId}>`;
        }

        let linkedRobloxId = null;
        try {
          const db = loadDatabase();
          linkedRobloxId = db.robloxAccounts ? db.robloxAccounts[user.id] : null;
        } catch (e) {}

        const staffPanelEmbed = new EmbedBuilder()
          .setTitle('🛂 Demande de Visa — TERANGA BLOX RP')
          .addFields(
            { name: '👤 Demandeur', value: `<@${user.id}> ( \`${user.username}\` )`, inline: true },
            { name: '🆔 Ticket ID', value: `\`VISA-${String(visaId).padStart(4, '0')}\``, inline: true },
            { name: '🔴 Compte Roblox', value: linkedRobloxId ? `\`${linkedRobloxId}\`` : '⚠️ **Non lié** (Bloxlink / RoVer)', inline: true },
            { name: '🎶 Statut Vocal', value: initialVocalStatus, inline: false }
          )
          .setThumbnail(user.displayAvatarURL({ forceStatic: false }))
          .setColor('#00FF00')
          .setFooter({ text: `Teranga Bot • Visa • Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` });

        const staffRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`close_ticket_${user.id}`).setLabel('Fermer').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
          new ButtonBuilder().setCustomId(`approve_visa_${user.id}`).setLabel('Valider').setStyle(ButtonStyle.Success).setEmoji('✅'),
          new ButtonBuilder().setCustomId(`deny_visa_${user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setEmoji('❌'),
          new ButtonBuilder().setCustomId(`schedule_rdv_${user.id}`).setLabel('RDV').setStyle(ButtonStyle.Primary).setEmoji('📅'),
          new ButtonBuilder().setCustomId(`ask_proofs_${user.id}`).setLabel('Preuves').setStyle(ButtonStyle.Primary).setEmoji('📌')
        );

        const staffRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`visa_claim_${user.id}`).setLabel('👤 Pris en charge par Personne').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`visa_roblox_${user.id}`).setLabel('🎮🔍 Voir Roblox du Joueur').setStyle(ButtonStyle.Primary)
        );

        await ticketChannel.send({ embeds: [staffPanelEmbed], components: [staffRow1, staffRow2] }).catch(err => console.error("Erreur envoi staffPanelEmbed:", err));

        const questionnaireEmbed = new EmbedBuilder()
          .setTitle('🏛️ AMBASSADE OFFICIELLE • TERANGA BLOX RP')
          .setDescription(
            `## 📋 DEMANDE DE VISA\n\n` +
            `🇸🇳 **Bienvenue dans l'univers de TERANGA BLOX RP**\n\n` +
            `Avant de rejoindre notre communauté, merci de répondre aux questions suivantes avec sérieux et honnêteté.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `### 1️⃣ Quel âge avez-vous ?\n\n` +
            `### 2️⃣ Avez-vous déjà pratiqué le RolePlay ?\n` +
            `➜ *Si oui, sur quel(s) serveur(s) ?*\n` +
            `➜ *Depuis combien de temps faites-vous du RP ?*\n\n` +
            `### 3️⃣ Qu'est-ce que le Power Gaming ?\n` +
            `➜ *Donnez votre propre définition.*\n\n` +
            `### 4️⃣ Avez-vous lu et compris l'intégralité du règlement ?\n` +
            `➜ *Oui / Non*\n\n` +
            `### 5️⃣ TERANGA BLOX RP est-il déjà installé sur votre ordinateur ?\n` +
            `➜ *Oui / Non*\n\n` +
            `### 6️⃣ Pourquoi souhaitez-vous rejoindre TERANGA BLOX RP ?\n\n` +
            `### 7️⃣ Que représente pour vous un RolePlay sérieux et réaliste ?\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⚠️ **INFORMATIONS IMPORTANTES**\n` +
            `• Toute fausse déclaration entraînera un refus immédiat.\n` +
            `• Le respect du règlement est obligatoire.\n` +
            `• Les réponses doivent être complètes et sincères.\n\n` +
            `👮 **Votre dossier sera examiné par un membre du Staff dans les meilleurs délais.**\n\n` +
            `🌟 **Merci pour votre candidature et à bientôt sur TERANGA BLOX RP !**`
          )
          .setColor('#FFD700')
          .setFooter({ text: '🦁 TERANGA BOT • SYSTÈME DE VISA OFFICIEL' });

        const qFiles = [];
        const proofsImagePath = path.join(__dirname, 'preuves_visa.png');
        if (fs.existsSync(proofsImagePath)) {
          qFiles.push(new AttachmentBuilder(proofsImagePath, { name: 'preuves_visa.png' }));
          questionnaireEmbed.setImage('attachment://preuves_visa.png');
        }

        const logoPath = path.join(__dirname, 'logo.png');
        if (fs.existsSync(logoPath)) {
          qFiles.push(new AttachmentBuilder(logoPath, { name: 'logo.png' }));
          questionnaireEmbed.setThumbnail('attachment://logo.png');
        }

        const answerRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`answer_questionnaire_${user.id}`)
            .setLabel('Répondre aux questions')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✍️')
        );

        await ticketChannel.send({ embeds: [questionnaireEmbed], components: [answerRow], files: qFiles }).catch(err => console.error("Erreur envoi questionnaireEmbed:", err));

        return await interaction.editReply({
          content: `✅ Votre ticket de visa a été ouvert avec succès dans <#${ticketChannel.id}> !`
        });

      } catch (error) {
        console.error('Erreur lors de la création du ticket :', error);
        return await interaction.editReply({
          content: `❌ **Erreur de création de ticket :** ${error.message}\n*(Vérifiez que le bot a la permission "Gérer les salons / Manage Channels" et que la catégorie de tickets existe)*`
        }).catch(() => {});
      }
    }

    const isAnswer = customId.startsWith('answer_questionnaire_');

    if (isAnswer) {
      try {
        const parts = customId.split('_');
        const targetUserId = parts[parts.length - 1];

        if (user.id !== targetUserId) {
          return await interaction.reply({
            content: "❌ Seul le candidat de ce ticket peut remplir ce questionnaire.",
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`submit_questionnaire_${targetUserId}`)
          .setTitle('Questionnaire de Visa');

        const ageInput = new TextInputBuilder()
          .setCustomId('q_age')
          .setLabel('1. Quel âge avez-vous ?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const experienceInput = new TextInputBuilder()
          .setCustomId('q_experience')
          .setLabel('2. Votre expérience RP (Serveurs, durée)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const definitionInput = new TextInputBuilder()
          .setCustomId('q_definition')
          .setLabel('3. Qu\'est-ce que le Power Gaming ?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const motivationsInput = new TextInputBuilder()
          .setCustomId('q_motivations')
          .setLabel('4. Pourquoi Teranga Blox RP ?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const rulesInput = new TextInputBuilder()
          .setCustomId('q_rules')
          .setLabel('5. Règlement lu & Jeu installé ? (Oui/Non)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(ageInput);
        const row2 = new ActionRowBuilder().addComponents(experienceInput);
        const row3 = new ActionRowBuilder().addComponents(definitionInput);
        const row4 = new ActionRowBuilder().addComponents(motivationsInput);
        const row5 = new ActionRowBuilder().addComponents(rulesInput);

        modal.addComponents(row1, row2, row3, row4, row5);

        return await interaction.showModal(modal);
      } catch (err) {
        console.error("Erreur lors de l'ouverture du modal de questionnaire :", err);
        return await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'ouverture du formulaire.",
          ephemeral: true
        });
      }
    }

    // --- Gestion des Actions de Ticket (Fermer, Valider, Refuser) ---
    // Les CustomIDs de ces boutons se terminent par le ID de l'utilisateur concerné
    const isApprove = customId.startsWith('approve_visa_');
    const isDeny = customId.startsWith('deny_visa_');
    const isClose = customId.startsWith('close_ticket_');
    const isSchedule = customId.startsWith('schedule_rdv_') || customId.startsWith('visa_schedule_');
    const isAskProofs = customId.startsWith('ask_proofs_');
    const isClaim = customId.startsWith('visa_claim_');
    const isDelete = customId === 'delete_ticket';

    if (isApprove || isDeny || isClose || isDelete || isSchedule || isAskProofs || isClaim) {
      // Pour la suppression, le bouton est global, on gère les droits différemment
      if (isDelete) {
        // Vérifier si l'utilisateur est staff
        const isUserStaff = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isUserStaff) {
          return await interaction.reply({
            content: "❌ Vous n'avez pas l'autorisation d'utiliser ce bouton.",
            ephemeral: true
          });
        }

        const restrictedRoles = ["1446632811749703850", "1507707706776096768", "1446632341450788904"];
        const hasRestrictedRole = member.roles.cache.some(role => restrictedRoles.includes(role.id));
        const hasHigherStaffRole = member.roles.cache.some(role => config.staffRoles.includes(role.id) && !restrictedRoles.includes(role.id));
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (hasRestrictedRole && !hasHigherStaffRole && !isAdmin) {
          return await interaction.reply({
            content: "❌ Votre rôle ne vous permet pas de supprimer les tickets.",
            ephemeral: true
          });
        }

        await interaction.reply({ content: '⌛ Génération du transcript et suppression du salon...' });
        
        try {
          // Rechercher et supprimer le salon vocal temporaire associé
          const topic = interaction.channel.topic;
          let targetUserId = null;
          if (topic && topic.startsWith('visa-ticket-')) {
            targetUserId = topic.replace('visa-ticket-', '');
          }

          if (targetUserId) {
            await deleteAssociatedVoiceChannel(guild, targetUserId);
          }

          // Génération du transcript
          const transcriptText = await generateTranscript(interaction.channel);
          const buffer = Buffer.from(transcriptText, 'utf-8');
          
          // Essayer d'envoyer le transcript aux logs ou en message privé à l'utilisateur ayant cliqué
          await interaction.channel.send({
            content: 'Transcript généré avec succès. Suppression dans 3 secondes...',
            files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
          });

          // Envoyer également au staff en DM si possible
          try {
            await user.send({
              content: `Voici le transcript du ticket **${interaction.channel.name}** que vous venez de supprimer.`,
              files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
            });
          } catch (dmErr) {
            console.log("Impossible d'envoyer le transcript en DM au modérateur (DMs fermés).");
          }

          // Envoyer le transcript dans le salon de logs des tickets
          await sendTicketTranscriptToLogs(interaction.channel, user, "Suppression définitive", guild);

          setTimeout(async () => {
            await interaction.channel.delete();
          }, 3000);

        } catch (err) {
          console.error("Erreur lors de la suppression/transcript :", err);
          await interaction.channel.delete().catch(() => {});
        }
        return;
      }

      // Pour les autres boutons, extraire le targetUserId de la fin de l'ID personnalisé
      const parts = customId.split('_');
      const targetUserId = parts[parts.length - 1];

      // Vérifier que le modérateur est bien membre du staff ou administrateur
      const isModeratorStaff = member.roles.cache.some(role => config.staffRoles.includes(role.id)) || member.permissions.has(PermissionFlagsBits.Administrator);
      
      if (!isModeratorStaff) {
        return await interaction.reply({
          content: "❌ Vous n'avez pas le rôle requis pour effectuer cette action de modération.",
          ephemeral: true
        });
      }

      if (isSchedule) {
        // Vérifier si un RDV est déjà programmé pour cet utilisateur (salon vocal existant)
        const parentId = (config.interviewCategoryId && config.interviewCategoryId.trim() !== "")
          ? config.interviewCategoryId
          : config.categoryId;

        const existingVoice = guild.channels.cache.find(
          (c) => c.type === ChannelType.GuildVoice && 
                 c.parentId === parentId && 
                 c.permissionOverwrites.cache.has(targetUserId) && 
                 c.name.startsWith("🎤 Entretien")
        );

        if (existingVoice) {
          return await interaction.reply({
            content: `❌ Un rendez-vous est déjà planifié pour ce candidat. Le salon vocal ${existingVoice} est déjà disponible.`,
            ephemeral: true
          });
        }

        const hoursList = [
          "Maintenant (Immédiat)",
          "Saisir les minutes précises (ex: 08H05, 14H20)",
          "08H00", "09H00", "10H00", "11H00", "12H00", "13H00",
          "14H00", "15H00", "16H00", "17H00", "18H00", "19H00",
          "20H00", "21H00", "22H00", "23H00", "00H00"
        ];

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_rdv_time_${targetUserId}`)
          .setPlaceholder('🕒 Choisissez l\'heure du RDV...')
          .addOptions(
            hoursList.map(h => 
              new StringSelectMenuOptionBuilder()
                .setLabel(h)
                .setValue(h)
                .setEmoji(h.startsWith('Maintenant') ? '⚡' : (h.startsWith('Saisir') ? '✍️' : '⏰'))
            )
          );

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        return await interaction.reply({
          content: '📅 **Sélectionnez l\'heure de l\'entretien (en 1 seule étape) :**',
          components: [selectRow],
          ephemeral: true
        });
      }

      if (isClaim) {
        await interaction.deferReply().catch(() => {});
        const highStaffRoleIds = ['1446630514210639992', '1446630598679728306'];

        // Accorder la permission d'écriture au Staff qui a pris en charge le ticket
        await interaction.channel.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          EmbedLinks: true,
          AttachFiles: true,
          ReadMessageHistory: true
        }).catch(err => console.error("Erreur overwrite user claim:", err));

        // Conserver la permission d'écriture pour les Hauts Staffs (1446630514210639992 et 1446630598679728306)
        for (const highId of highStaffRoleIds) {
          if (guild.roles.cache.has(highId)) {
            await interaction.channel.permissionOverwrites.edit(highId, {
              ViewChannel: true,
              SendMessages: true,
              EmbedLinks: true,
              AttachFiles: true,
              ReadMessageHistory: true
            }).catch(err => console.error("Erreur overwrite high staff role:", err));
          }
        }

        // Retirer la permission d'écriture pour TOUS les autres rôles staff
        for (const roleId of (config.staffRoles || [])) {
          if (!highStaffRoleIds.includes(roleId) && guild.roles.cache.has(roleId)) {
            await interaction.channel.permissionOverwrites.edit(roleId, {
              ViewChannel: true,
              SendMessages: false, // BLOQUE L'ÉCRITURE POUR TOUS LES AUTRES ADMINS !
              ReadMessageHistory: true
            }).catch(() => {});
          }
        }

        // Mettre à jour le bouton de prise en charge sur le message du staff
        try {
          const message = interaction.message;
          if (message && message.components && message.components.length > 1) {
            const row1 = ActionRowBuilder.from(message.components[0]);
            const row2 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`visa_claim_${targetUserId}`)
                .setLabel(`👤 Pris en charge par ${user.username}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(`visa_roblox_${targetUserId}`)
                .setLabel('🎮🔍 Voir Roblox du Joueur')
                .setStyle(ButtonStyle.Primary)
            );
            await message.edit({ components: [row1, row2] });
          }
        } catch (editErr) {
          console.error("Erreur mise à jour bouton claim:", editErr);
        }

        return await interaction.editReply({
          content: `📌 **Ticket pris en charge par <@${user.id}> !**\n*(Seul <@${user.id}> et le Haut Staff <@&1446630514210639992> / <@&1446630598679728306> peuvent désormais écrire dans ce salon).*`
        });
      }

      if (isAskProofs) {
        // Envoyer le panel des preuves obligatoires
        const proofsEmbed = new EmbedBuilder()
          .setTitle('📌 PREUVES OBLIGATOIRES – ENTRETIEN VISA WL')
          .setAuthor({ name: 'TERANGA RP • Staff WL' })
          .setDescription(
            `Afin de passer votre entretien pour l'obtention du Visa (White List), merci d'envoyer les preuves suivantes :\n\n` +
            `1️⃣ **BUREAU PC VISIBLE** (Capture d'écran prise DIRECTEMENT depuis votre PC avec l'heure visible)\n` +
            `2️⃣ **ROBLOX INSTALLÉ** (Capture montrant Roblox installé sur votre PC)\n` +
            `3️⃣ **MICRO FONCTIONNEL** (Preuve que votre micro fonctionne en jeu)\n` +
            `4️⃣ **TÉLÉPHONE VISIBLE** (Photo de votre téléphone visible)\n\n` +
            `⚠️ *Les captures doivent être faites depuis VOTRE ordinateur.*\n` +
            `⚠️ *Aucune image provenant d'internet ne sera acceptée.*\n` +
            `⚠️ *L'heure Windows visible en bas à droite est obligatoire.*\n\n` +
            `**Sans preuve = Pas d'entretien = Pas de Visa.**`
          )
          .setColor('#D82C2C')
          .setFooter({ text: '🦁 TERANGA BOT • Système de Visa' })
          .setTimestamp();

        const filesToSend = [];
        const proofsImagePath = path.join(__dirname, 'preuves_visa.png');
        if (fs.existsSync(proofsImagePath)) {
          filesToSend.push(new AttachmentBuilder(proofsImagePath));
          proofsEmbed.setImage('attachment://preuves_visa.png');
        }

        const logoPath = path.join(__dirname, 'logo.png');
        if (fs.existsSync(logoPath)) {
          filesToSend.push(new AttachmentBuilder(logoPath));
          proofsEmbed.setThumbnail('attachment://logo.png');
        }

        await interaction.channel.send({ embeds: [proofsEmbed], files: filesToSend });

        // Envoyer l'image des avatars interdits si elle existe
        const avatarsImagePath = path.join(__dirname, 'avatars_interdits.jpg');
        if (fs.existsSync(avatarsImagePath)) {
          const avatarsEmbed = new EmbedBuilder()
            .setTitle('🚫 AVATARS INTERDITS – RÈGLEMENT OBLIGATOIRE')
            .setDescription('⚠️ **Votre avatar Roblox doit respecter ces règles pour entrer en jeu.**\nLisez attentivement les interdictions ci-dessous.')
            .setColor('#000000')
            .setImage('attachment://avatars_interdits.jpg');
          await interaction.channel.send({ embeds: [avatarsEmbed], files: [new AttachmentBuilder(avatarsImagePath)] });
        }

        // Envoyer le lien pour lier le compte Roblox
        await interaction.channel.send({
          content: `🔗 **ÉTAPE OBLIGATOIRE : LIER VOTRE COMPTE ROBLOX**\n\nAfin de finaliser votre dossier, vous devez obligatoirement lier votre compte Roblox à votre compte Discord.\n\n🎥 **Voici un tutoriel vidéo pour vous aider :**\nhttps://youtu.be/wL9_S-Y3khU?si=m_soVTkNFb8ybU3Q`
        });

        return await interaction.reply({
          content: '✅ Panneau de preuves et tutoriel envoyés avec succès.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      // Récupérer le membre demandeur
      let targetMember = null;
      try {
        targetMember = await guild.members.fetch(targetUserId);
      } catch (err) {
        console.log("Le demandeur n'est plus présent sur le serveur.");
      }

      if (isApprove) {
        if (!targetMember) {
          return await interaction.channel.send({
            content: `❌ Le membre <@${targetUserId}> n'a pas pu être trouvé sur le serveur.`
          });
        }

        // Supprimer le salon vocal associé si présent
        await deleteAssociatedVoiceChannel(guild, targetUserId);

        try {
          // Ajouter le rôle citoyen et visa (1537874314924265632)
          if (config.citizenRoleId) await targetMember.roles.add(config.citizenRoleId).catch(() => {});
          if (config.visaRoleId) await targetMember.roles.add(config.visaRoleId).catch(() => {});
          if (config.whitelistRoleId) await targetMember.roles.add(config.whitelistRoleId).catch(() => {});
          await targetMember.roles.add('1537874314924265632').catch(() => {});

          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Visa Approuvé !')
            .setDescription(`Le visa de <@${targetUserId}> a été validé avec succès par <@${user.id}>.`)
            .setColor(config.colors.primary)
            .setTimestamp();

          await interaction.channel.send({ embeds: [successEmbed] });

          // Envoyer le transcript aux logs
          await sendTicketTranscriptToLogs(interaction.channel, user, "Visa Approuvé", guild);

          // Envoyer un message privé
          try {
            await targetMember.send({
              content: `🎉 **Félicitations !** Votre demande de visa pour **Teranga RP** a été approuvée.\nVous avez reçu le rôle **Citoyen** et pouvez désormais vous connecter et jouer sur le serveur !`
            });
          } catch (e) {
            await interaction.channel.send({ content: `⚠️ Impossible de notifier <@${targetUserId}> en DM (Messages Privés fermés).` });
          }

          // Proposer le bouton de suppression directe
          const deleteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('delete_ticket')
              .setLabel('Supprimer le salon')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🗑️')
          );

          await interaction.channel.send({
            content: "Le ticket peut maintenant être fermé ou supprimé définitivement.",
            components: [deleteRow]
          });

        } catch (error) {
          console.error("Erreur lors de l'attribution du rôle citoyen :", error);
          await interaction.channel.send({
            content: `❌ Une erreur est survenue lors de la validation du visa : ${error.message}`
          });
        }
      }

      if (isDeny) {
        // Supprimer le salon vocal associé si présent
        await deleteAssociatedVoiceChannel(guild, targetUserId);

        const denyEmbed = new EmbedBuilder()
          .setTitle('❌ Visa Refusé')
          .setDescription(`Le visa de <@${targetUserId}> a été refusé par <@${user.id}>.`)
          .setColor(config.colors.danger)
          .setTimestamp();

        await interaction.channel.send({ embeds: [denyEmbed] });

        // Envoyer le transcript aux logs
        await sendTicketTranscriptToLogs(interaction.channel, user, "Visa Refusé", guild);

        if (targetMember) {
          try {
            await targetMember.send({
              content: `❌ **Désolé**, votre demande de visa pour **Teranga RP** a été refusée par le staff.\nVous pouvez contacter un modérateur ou refaire une demande si le règlement vous y autorise.`
            });
          } catch (e) {
            await interaction.channel.send({ content: `⚠️ Impossible de notifier <@${targetUserId}> en DM (Messages Privés fermés).` });
          }
        }

        // Proposer le bouton de suppression directe
        const deleteRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('delete_ticket')
            .setLabel('Supprimer le salon')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
        );

        await interaction.channel.send({
          content: "Le ticket est marqué comme refusé. Vous pouvez supprimer le salon.",
          components: [deleteRow]
        });
      }

      if (isClose) {
        const restrictedRoles = ["1446632811749703850", "1507707706776096768", "1446632341450788904"];
        const hasRestrictedRole = member.roles.cache.some(role => restrictedRoles.includes(role.id));
        const hasHigherStaffRole = member.roles.cache.some(role => config.staffRoles.includes(role.id) && !restrictedRoles.includes(role.id));
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (hasRestrictedRole && !hasHigherStaffRole && !isAdmin) {
          return await interaction.reply({
            content: "❌ Votre rôle ne vous permet pas de fermer les tickets.",
            ephemeral: true
          });
        }

        // Supprimer le salon vocal associé si présent
        await deleteAssociatedVoiceChannel(guild, targetUserId);

        try {
          // Retirer les permissions de voir le salon au demandeur
          if (targetMember) {
            await interaction.channel.permissionOverwrites.edit(targetUserId, {
              ViewChannel: false
            });
          }

          const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Fermé')
            .setDescription(`Ce ticket de visa a été fermé par <@${user.id}>.\nLe demandeur ne peut plus voir ce salon.`)
            .setColor(config.colors.gray)
            .setTimestamp();

          const deleteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('delete_ticket')
              .setLabel('Supprimer définitivement')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🗑️')
          );

          await interaction.channel.send({ embeds: [closeEmbed], components: [deleteRow] });

          // Envoyer le transcript aux logs
          await sendTicketTranscriptToLogs(interaction.channel, user, "Ticket Fermé", guild);

        } catch (error) {
          console.error("Erreur lors de la fermeture du ticket :", error);
          await interaction.channel.send({
            content: `❌ Erreur lors de la fermeture : ${error.message}`
          });
      }
    }
  }
}
});

// Événement de message (Fallback pour les commandes textuelles en cas de problème de Slash Commands)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // Détecte !setup-visa ou /setup-visa s'il est envoyé sous forme de texte brut
  if (message.content === '!setup-visa' || message.content === '/setup-visa') {
    try {
      // Vérifier les permissions (Administrateur ou rôle Staff)
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour configurer le panel de visa.");
      }

      const bannerJpg = path.join(__dirname, 'visa_banner.jpg');
      const bannerPng = path.join(__dirname, 'visa_banner.png');
      const logoPng = path.join(__dirname, 'logo.png');
      const files = [];

      const embed = new EmbedBuilder()
        .setColor('#009A44');

      if (fs.existsSync(bannerJpg)) {
        files.push(new AttachmentBuilder(bannerJpg, { name: 'visa_banner.jpg' }));
        embed.setImage('attachment://visa_banner.jpg');
      } else if (fs.existsSync(bannerPng)) {
        files.push(new AttachmentBuilder(bannerPng, { name: 'visa_banner.png' }));
        embed.setImage('attachment://visa_banner.png');
      } else if (fs.existsSync(logoPng)) {
        files.push(new AttachmentBuilder(logoPng, { name: 'logo.png' }));
        embed.setImage('attachment://logo.png');
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('request_visa')
          .setLabel('Demander mon Visa')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎫')
      );

      await message.channel.send({ embeds: [embed], components: [row], files });
      
      // Supprime le message de commande pour garder le salon propre
      await message.delete().catch(() => {});
      
    } catch (error) {
      console.error('Erreur lors du setup visa par message textuel :', error);
    }
  }

  // Détecte !setup-concessionnaire ou /setup-concessionnaire s'il est envoyé sous forme de texte brut
  if (message.content === '!setup-concessionnaire' || message.content === '/setup-concessionnaire' || message.content === '!setup-shop' || message.content === '/setup-shop' || message.content === '+setup-concessionnaire' || message.content === '+setup-shop') {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour configurer le concessionnaire.");
      }

      const err = await updateShopCatalog(message.guild);
      if (err) {
        return message.reply({ content: `❌ Erreur : ${err}` });
      }

      } catch (error) {
      console.error('Erreur lors du setup concessionnaire par message textuel :', error);
    }
  }

  // Détecte !setup-support ou /setup-support s'il est envoyé sous forme de texte brut
  if (message.content === '!setup-support' || message.content === '/setup-support' || message.content === '!setup-ticket-support' || message.content === '+setup-support') {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour configurer le panel de support.");
      }

      const targetChannelId = "1459334727881199833";
      const targetChan = message.guild.channels.cache.get(targetChannelId) || message.channel;

      const err = await sendSupportPanel(targetChan);
      if (err) {
        return message.reply({ content: `❌ Erreur : ${err}` });
      }

      await message.delete().catch(() => {});
    } catch (error) {
      console.error('Erreur lors du setup support par message textuel :', error);
    }
  }

  // 🚗 COMMANDES TEXTUELLES POUR LA BOUTIQUE / CONCESSIONNAIRE
  if (message.content.startsWith('!add-car') || message.content.startsWith('!ajouter-voiture') || message.content.startsWith('+add-car') || message.content.startsWith('+ajouter-voiture')) {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour ajouter une voiture.");
      }

      const rawText = message.content.replace(/^(!|\+)(add-car|ajouter-voiture)\s*/i, '').trim();
      const parts = rawText.split('|').map(p => p.trim());

      if (parts.length < 2) {
        return message.reply(
          "⚠️ **Format d'utilisation de la commande :**\n" +
          "`!add-car Nom du véhicule | Prix` (avec la photo du véhicule jointe au message)\n" +
          "ou `!add-car Nom du véhicule | Prix | Lien_Image`\n\n" +
          "**Exemple :** `!add-car Mercedes G63 | 150 000 FCFA`"
        );
      }

      const nom = parts[0];
      const prix = parts[1];
      let imageUrl = parts[2] || "";

      if (!imageUrl && message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?w=800";
      }

      const cars = loadCars();
      if (cars.some(c => c.name.toLowerCase() === nom.toLowerCase())) {
        return message.reply(`❌ Un véhicule nommé **${nom}** existe déjà dans le concessionnaire !`);
      }

      const newCar = {
        id: `car_${Date.now()}`,
        name: nom,
        price: prix,
        imageUrl: imageUrl
      };

      cars.push(newCar);
      saveCars(cars);

      const err = await updateShopCatalog(message.guild);
      if (err) {
        return message.reply(`✅ Le véhicule **${nom}** a été enregistré, mais la mise à jour du salon a échoué : ${err}`);
      }

      return message.reply(`✅ Le véhicule **${nom}** a été ajouté avec succès au catalogue au prix de **${prix}** ! 🏎️`);
    } catch (error) {
      console.error('Erreur lors de !add-car :', error);
      return message.reply(`❌ Erreur : ${error.message}`);
    }
  }

  if (message.content.startsWith('!remove-car') || message.content.startsWith('!supprimer-voiture') || message.content.startsWith('+remove-car')) {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour retirer une voiture.");
      }

      const nom = message.content.replace(/^(!|\+)(remove-car|supprimer-voiture)\s*/i, '').trim();
      if (!nom) {
        return message.reply("⚠️ **Usage :** `!remove-car Nom du véhicule`");
      }

      let cars = loadCars();
      const originalLength = cars.length;
      cars = cars.filter(c => c.name.toLowerCase() !== nom.toLowerCase());

      if (cars.length === originalLength) {
        return message.reply(`❌ Aucun véhicule nommé **${nom}** n'a été trouvé.`);
      }

      saveCars(cars);
      await updateShopCatalog(message.guild);

      return message.reply(`✅ Le véhicule **${nom}** a été retiré du concessionnaire avec succès !`);
    } catch (error) {
      console.error('Erreur lors de !remove-car :', error);
    }
  }

  if (message.content === '!clear-shop' || message.content === '!vider-boutique' || message.content === '+clear-shop') {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour vider le concessionnaire.");
      }

      saveCars([]);
      await updateShopCatalog(message.guild);
      return message.reply("✅ Le concessionnaire a été intégralement vidé !");
    } catch (error) {
      console.error('Erreur lors de !clear-shop :', error);
    }
  }

  // Détecte !setup-welcome ou /setup-welcome s'il est envoyé sous forme de texte brut
  if (message.content === '!setup-welcome' || message.content === '/setup-welcome') {
    try {
      const isAuthorized = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                           message.member.roles.cache.some(role => config.staffRoles.includes(role.id));
      if (!isAuthorized) {
        return message.reply("❌ Vous devez être administrateur ou membre du staff pour envoyer le message de bienvenue.");
      }

      const welcomeChannel = message.guild.channels.cache.get(config.welcomeChannelId);
      if (!welcomeChannel) {
        return message.reply("❌ Salon de bienvenue non configuré dans config.json.");
      }

      const rulesMention = config.rulesChannelId && message.guild.channels.cache.has(config.rulesChannelId) ? `<#${config.rulesChannelId}>` : '`#reglement`';
      const generalMention = config.generalChannelId && message.guild.channels.cache.has(config.generalChannelId) ? `<#${config.generalChannelId}>` : '`#General`';
      const ticketMention = config.ticketChannelId && message.guild.channels.cache.has(config.ticketChannelId) ? `<#${config.ticketChannelId}>` : '`#Ticket`';

      const embed = new EmbedBuilder()
        .setTitle('🦁 Nouveau Citoyen — TERANGA BLOX RP')
        .setDescription(
          `Bienvenue sur le serveur **TERANGA BLOX RP off** <@${message.author.id}> (Démonstration) !\n\n` +
          `On vous souhaite de bien lire le salon 📜 │ ${rulesMention}.\n` +
          `Si vous voulez discuter avec les autres collègues, c'est ici sur le salon 💬 │ ${generalMention}.\n` +
          `Si vous avez des questions ou des problèmes, n'hésitez pas à nous contacter sur le salon 🎫 │ ${ticketMention}.\n\n` +
          `Merci pour votre compréhension ❤️🇸🇳`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: '🦁 TERANGA BOT • Système de Bienvenue' })
        .setTimestamp();

      const files = [];
      const welcomeCardBuffer = await generateWelcomeCard(message.member);
      if (welcomeCardBuffer) {
        files.push(new AttachmentBuilder(welcomeCardBuffer, { name: 'welcome.png' }));
        embed.setImage('attachment://welcome.png');
      } else {
        const logoPath = path.join(__dirname, 'logo.png');
        if (fs.existsSync(logoPath)) {
          files.push(new AttachmentBuilder(logoPath));
          embed.setImage('attachment://logo.png');
        }
      }

      await welcomeChannel.send({ embeds: [embed], files });
      
      const confirmMsg = await message.reply(`✅ Le message de bienvenue a été envoyé avec succès dans <#${welcomeChannel.id}> !`);
      setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);

      // Supprime le message de commande pour garder le salon propre
      await message.delete().catch(() => {});
      
    } catch (error) {
      console.error('Erreur lors du setup de bienvenue :', error);
    }
  }
});

// Fonction utilitaire pour générer un transcript textuel des messages
async function generateTranscript(channel) {
  let transcript = `TRANSCRIPT DU TICKET : ${channel.name}\n`;
  transcript += `Généré le : ${new Date().toLocaleString('fr-FR')}\n`;
  transcript += `--------------------------------------------------------\n\n`;

  // Fetch tous les messages du salon (limite de 100 pour la démonstration)
  const messages = await channel.messages.fetch({ limit: 100 });
  const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  sortedMessages.forEach(msg => {
    if (msg.author.bot && msg.embeds.length > 0) {
      // Afficher les détails des embeds des bots pour un transcript plus complet
      msg.embeds.forEach(embed => {
        transcript += `[${msg.createdAt.toLocaleString('fr-FR')}] [BOT] ${msg.author.tag} (EMBED):\n`;
        if (embed.title) transcript += `  Titre: ${embed.title}\n`;
        if (embed.description) transcript += `  Description: ${embed.description}\n`;
        embed.fields.forEach(field => {
          transcript += `  - ${field.name}: ${field.value}\n`;
        });
        transcript += `\n`;
      });
    } else {
      transcript += `[${msg.createdAt.toLocaleString('fr-FR')}] ${msg.author.tag} (${msg.author.id}):\n`;
      transcript += `💬 ${msg.content}\n`;
      if (msg.attachments.size > 0) {
        msg.attachments.forEach(attachment => {
          transcript += `📎 Pièce jointe: ${attachment.url}\n`;
        });
      }
      transcript += `\n`;
    }
  });

  transcript += `--------------------------------------------------------\n`;
  transcript += `FIN DU TRANSCRIPT`;
  return transcript;
}

// Fonction helper pour générer et envoyer le transcript dans le salon de logs
async function sendTicketTranscriptToLogs(channel, author, status, guild) {
  try {
    const transcriptText = await generateTranscript(channel);
    const buffer = Buffer.from(transcriptText, 'utf-8');
    const logsChannelId = config.ticketLogsChannelId || "1450958695587516620";
    const logsChannel = guild.channels.cache.get(logsChannelId);
    
    if (logsChannel) {
      await logsChannel.send({
        content: `📑 **Transcript de ticket**\n` +
                 `• **Ticket :** \`${channel.name}\`\n` +
                 `• **Action :** \`${status}\`\n` +
                 `• **Par :** <@${author.id}> (\`${author.username}\`)\n` +
                 `• **Date :** ${new Date().toLocaleString('fr-FR')}`,
        files: [{ attachment: buffer, name: `transcript-${channel.name}.txt` }]
      });
      console.log(`[LOGS] Transcript envoyé dans <#${logsChannelId}> pour action: ${status}.`);
    } else {
      console.error(`[LOGS] Impossible de trouver le salon de logs avec l'ID ${logsChannelId}.`);
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi du transcript dans le salon de logs :", err);
  }
}

// ══════════════════════════════════════════════
// 🤖 LISTE BLANCHE DES BOTS AUTORISÉS
// ══════════════════════════════════════════════
const BOTS_AUTORISES = new Set([
  '1446652077098008589', // DraftBot
  '1446653350920851469', // Ticket King
  '1460261299643482277', // Ticket Tool
  '1480232026027069644', // Medal
  '1495814309295558789', // Jockie Music
  '1517204366749073419', // Teranga Bot (notre bot)
]);

// Événement d'arrivée d'un nouveau membre (Message de bienvenue automatique avec logo)
// Anti-doublon bienvenue : mémorise les membres récemment accueillis
const welcomeCooldown = new Set();

client.on('guildMemberAdd', async (member) => {
  console.log(`[GUILD_MEMBER_ADD] Nouveau membre détecté : ${member.user.tag} (${member.id})`);

  // Anti-doublon : ignorer si déjà traité dans les 10 dernières secondes
  if (welcomeCooldown.has(member.id)) {
    console.log(`[GUILD_MEMBER_ADD] Doublon ignoré pour ${member.user.tag}`);
    return;
  }
  welcomeCooldown.add(member.id);
  setTimeout(() => welcomeCooldown.delete(member.id), 10000); // Expire après 10s

  // 🚫 ANTI-BOT PUBLICITAIRE : Expulser les bots non autorisés
  if (member.user.bot) {
    if (!BOTS_AUTORISES.has(member.id)) {
      try {
        console.log(`[ANTI-BOT] Bot non autorisé détecté : ${member.user.tag} (${member.id}) — Expulsion en cours...`);
        await member.kick('Bot non autorisé — publicité interdite.');
        console.log(`[ANTI-BOT] ✅ Bot ${member.user.tag} expulsé avec succès.`);

        // Log dans le salon de logs admin si disponible
        const logsChannel = member.guild.channels.cache.get('1451331040915488899');
        if (logsChannel) {
          await logsChannel.send({
            content: `🚫 **Bot non autorisé expulsé !**\n> **Nom :** ${member.user.tag}\n> **ID :** \`${member.id}\`\n> **Raison :** Bot publicitaire non approuvé.`
          });
        }
      } catch (kickErr) {
        console.error(`[ANTI-BOT] Erreur lors de l'expulsion du bot :`, kickErr.message);
      }
    } else {
      console.log(`[ANTI-BOT] Bot autorisé : ${member.user.tag} (${member.id}) ✅`);
    }
    return; // Pas de message de bienvenue pour les bots
  }

  try {
    // Attribution automatique du rôle Membre (ID 1446632227201880175)
    const memberRoleId = "1446632227201880175";
    try {
      await member.roles.add(memberRoleId);
      console.log(`[AUTO-ROLE] Rôle Membre attribué avec succès à ${member.user.tag}`);
    } catch (roleErr) {
      console.error(`[AUTO-ROLE] Erreur lors de l'attribution du rôle Membre à ${member.user.tag} :`, roleErr.message);
    }

    const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!welcomeChannel) {
      console.log(`Salon de bienvenue non configuré ou introuvable pour le salon ID: ${config.welcomeChannelId}`);
      return;
    }

    const rulesMention = config.rulesChannelId && member.guild.channels.cache.has(config.rulesChannelId) ? `<#${config.rulesChannelId}>` : '`#reglement`';
    const generalMention = config.generalChannelId && member.guild.channels.cache.has(config.generalChannelId) ? `<#${config.generalChannelId}>` : '`#General`';
    const ticketMention = config.ticketChannelId && member.guild.channels.cache.has(config.ticketChannelId) ? `<#${config.ticketChannelId}>` : '`#Ticket`';

    const embed = new EmbedBuilder()
      .setTitle('🦁 Nouveau Citoyen — TERANGA BLOX RP')
      .setDescription(
        `Bienvenue sur le serveur **TERANGA BLOX RP off** <@${member.id}> !\n\n` +
        `On vous souhaite de bien lire le salon 📜 │ ${rulesMention}.\n` +
        `Si vous voulez discuter avec les autres collègues, c'est ici sur le salon 💬 │ ${generalMention}.\n` +
        `Si vous avez des questions ou des problèmes, n'hésitez pas à nous contacter sur le salon 🎫 │ ${ticketMention}.\n\n` +
        `Merci pour votre compréhension ❤️🇸🇳`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: '🦁 TERANGA BOT • Système de Bienvenue' })
      .setTimestamp();

    const files = [];
    const welcomeCardBuffer = await generateWelcomeCard(member);
    if (welcomeCardBuffer) {
      files.push(new AttachmentBuilder(welcomeCardBuffer, { name: 'welcome.png' }));
      embed.setImage('attachment://welcome.png');
    } else {
      const logoPath = path.join(__dirname, 'logo.png');
      if (fs.existsSync(logoPath)) {
        files.push(new AttachmentBuilder(logoPath));
        embed.setImage('attachment://logo.png');
      }
    }

    await welcomeChannel.send({ content: `Bienvenue <@${member.id}> !`, embeds: [embed], files });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message de bienvenue :', error);
  }
});

// Événement de mise à jour du statut vocal (point rouge/vert pour micro)
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;

  const guild = newState.guild;
  
  // Rechercher un salon de ticket ouvert pour cet utilisateur
  const ticketChannel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.topic === `visa-ticket-${member.id}`
  );

  if (ticketChannel) {
    try {
      // Récupérer le message du panel staff
      const messages = await ticketChannel.messages.fetch({ limit: 20 });
      const staffPanelMessage = messages.find(
        (m) => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title === '🛂 Demande de Visa — TERANGA BLOX RP'
      );

      if (staffPanelMessage) {
        const oldEmbed = staffPanelMessage.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed);

        // Déterminer le statut vocal (point rouge, jaune ou vert)
        let vocalStatus = '🔴 Non connecté en vocal';
        if (newState.channelId) {
          if (newState.selfMute) {
            vocalStatus = `🟡 Connecté (Micro Muet 🔇) dans <#${newState.channelId}>`;
          } else {
            vocalStatus = `🟢 Connecté (Micro Actif 🎙️) dans <#${newState.channelId}>`;
          }
        }

        // Mettre à jour ou ajouter le champ
        const fields = oldEmbed.fields || [];
        const vocalFieldIndex = fields.findIndex(f => f.name === '🎤 Statut Vocal');

        if (vocalFieldIndex !== -1) {
          newEmbed.spliceFields(vocalFieldIndex, 1, { name: '🎤 Statut Vocal', value: vocalStatus, inline: false });
        } else {
          newEmbed.addFields({ name: '🎤 Statut Vocal', value: vocalStatus, inline: false });
        }

        await staffPanelMessage.edit({ embeds: [newEmbed] });
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut vocal dans le ticket :", err);
    }
  }
});

// Serveur HTTP d'écoute pour recevoir les statuts vocaux depuis Roblox et maintenir le bot actif
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Le Bot Teranga RP est en ligne ! 🦁');
});

server.listen(PORT, () => {
  console.log(`Serveur HTTP démarré sur le port ${PORT}`);
});


// ══════════════════════════════════════════════
// 🛡️ ANTI-SPAM : Suivi des messages par utilisateur
// ══════════════════════════════════════════════
const spamMap = new Map(); // userId -> { count, messages[], timeout }
const SPAM_LIMIT   = 5;    // Nombre de messages max
const SPAM_WINDOW  = 5000; // Fenêtre de temps en ms (5 secondes)

// ══════════════════════════════════════════════
// 🔗 ANTI-LIEN : Suppression automatique des liens
// ══════════════════════════════════════════════
client.on('messageCreate', async (message) => {
  // Gérer le reçu de paiement envoyé en DM
  if (!message.guild) {
    if (message.author.bot) return;

    // Charger les commandes
    const ordersFilePath = path.join(__dirname, 'orders.json');
    if (!fs.existsSync(ordersFilePath)) return;

    let orders = [];
    try {
      orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
    } catch (e) {
      console.error(e);
      return;
    }

    // Trouver une commande validée en attente de paiement pour cet utilisateur
    const userOrder = orders.find(o => o.buyerId === message.author.id && o.status === 'validated_waiting_payment');
    if (!userOrder) {
      // Si pas de commande en attente, on ne fait rien
      return;
    }

    // Vérifier si le message contient une capture d'écran (image)
    const attachment = message.attachments.first();
    const isImage = attachment && attachment.contentType && attachment.contentType.startsWith('image/');

    if (!isImage) {
      return await message.reply({
        content: '⚠️ **Format incorrect !** Veuillez envoyer la capture d\'écran de votre reçu de paiement (image) pour valider votre commande.'
      }).catch(() => {});
    }

    // Mettre à jour le statut de la commande
    userOrder.status = 'payment_submitted';
    userOrder.receiptUrl = attachment.url;
    userOrder.receiptTimestamp = Date.now();
    
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');

    // Envoyer au salon de validation
    const validationChannelId = config.shopLogsChannelId || '1525227758727204894';
    try {
      const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId);
      const validationChannel = guild.channels.cache.get(validationChannelId) || await guild.channels.fetch(validationChannelId);

      if (validationChannel) {
        const receiptEmbed = new EmbedBuilder()
          .setTitle('🧾 Reçu de Paiement Soumis !')
          .setDescription(
            `👤 **Acheteur** : <@${userOrder.buyerId}> (${userOrder.buyerTag})\n` +
            `🚗 **Véhicule** : **${userOrder.carName}**\n` +
            `💰 **Prix** : **${userOrder.price}**\n` +
            `🎮 **Pseudo Roblox** : \`${userOrder.robloxUsername}\`\n` +
            `💳 **Paiement** : \`${userOrder.paymentMethod}\`\n` +
            `🆔 **ID Commande** : \`${userOrder.id}\`\n` +
            `🕒 **Date Soumission** : <t:${Math.floor(Date.now() / 1000)}:f>`
          )
          .setColor('#FFE600') // Jaune/Orange pour attente validation finale
          .setImage(attachment.url)
          .setTimestamp();

        // Proposer des boutons pour confirmer la livraison finale
        const deliveryButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`deliver_car_${userOrder.id}_${userOrder.buyerId}`)
            .setLabel('Livrer le véhicule (Valider Paiement)')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📦'),
          new ButtonBuilder()
            .setCustomId(`reject_payment_${userOrder.id}_${userOrder.buyerId}`)
            .setLabel('Rejeter le Reçu')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        await validationChannel.send({ embeds: [receiptEmbed], components: [deliveryButtons] });
      }
    } catch (err) {
      console.error("[DM-RECU] Impossible d'envoyer le reçu de paiement au salon de validation :", err);
    }

    await message.reply({
      content: '✅ **Capture d\'écran du reçu bien reçue !**\nElle a été transmise au staff dans le salon de validation. Vous recevrez un message privé dès qu\'elle aura été approuvée.'
    }).catch(() => {});
    return;
  }

  // Ignorer les DMs pour le reste de la fonction (commandes de salon)
  if (!message.guild) return;

  // --- 📝 Détection des commandes écrites sous forme de texte simple ---
  const content = message.content.trim().toLowerCase();
  
  if (content.startsWith('/setup-shop') || content.startsWith('!setup-shop')) {
    const isStaffMember = message.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => message.member.roles.cache.has(roleId));
    if (!isStaffMember) return;

    try {
      const err = await updateShopCatalog(message.guild);
      if (err) {
        const replyMsg = await message.reply({ content: err });
        setTimeout(() => replyMsg.delete().catch(() => {}), 15000);
      } else {
        await message.delete().catch(() => {});
      }
      return;
    } catch (e) {
      console.error(e);
    }
  }

  if (content.startsWith('/setup-visa') || content.startsWith('!setup-visa')) {
    const isStaffMember = message.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => message.member.roles.cache.has(roleId));
    if (!isStaffMember) return;

    try {
      const logoPath = path.join(__dirname, 'logo.png');
      const hasLogo = fs.existsSync(logoPath);
      const files = [];

      const embed = new EmbedBuilder()
        .setTitle('🛂 Demande de Visa — TERANGA BLOX RP')
        .setDescription(
          `🇸🇳 **Bienvenue sur TERANGA BLOX RP !**\n\n` +
          `Vous souhaitez rejoindre notre aventure RP ? Remplissez votre demande de visa en cliquant sur le bouton ci-dessous.\n\n` +
          `📋 **Conditions obligatoires :**\n` +
          `✅ Lire et respecter le règlement du serveur\n` +
          `✅ Répondre honnêtement au questionnaire\n` +
          `✅ Avoir un comportement sérieux et respectueux MAIS SA\n\n` +
          `⚠️ *Toute fausse information peut entraîner le refus de votre demande.*\n\n` +
          `👮 **Traitement de la demande**\n` +
          `Un membre du staff examinera votre dossier dans les meilleurs délais et vous informera de la décision.\n\n` +
          `🌟 **Bonne chance et bienvenue dans l'univers de TERANGA BLOX RP !**`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: '🦁 TERANGA BLOX RP • Système de Visa Officiel' });

      if (hasLogo) {
        files.push(new AttachmentBuilder(logoPath));
        embed.setThumbnail('attachment://logo.png');
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('request_visa')
          .setLabel('Demander mon Visa')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎫')
      );

      await message.channel.send({ embeds: [embed], components: [row], files });
      await message.delete().catch(() => {});
      return;
    } catch (error) {
      console.error(error);
    }
  }

  if (content.startsWith('/add-car') || content.startsWith('!add-car')) {
    const isStaffMember = message.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => message.member.roles.cache.has(roleId));
    if (!isStaffMember) return;

    try {
      const rawArgs = message.content.substring(8).trim();
      const parts = rawArgs.split('|');
      
      if (parts.length < 2 || !message.attachments.first()) {
        const replyMsg = await message.reply({
          content: "❌ **Format incorrect ou image manquante !**\n" +
                   "Veuillez écrire : `/add-car Nom du véhicule | Prix` en attachant la photo de la voiture.\n" +
                   "👉 *Exemple : `/add-car Peugeot 508 | 50 000 FCFA`*"
        });
        setTimeout(() => replyMsg.delete().catch(() => {}), 15000);
        return;
      }

      const nom = parts[0].trim();
      const prix = parts[1].trim();
      const imageAttachment = message.attachments.first();

      const cars = loadCars();
      if (cars.some(c => c.name.toLowerCase() === nom.toLowerCase())) {
        return await message.reply({ content: `❌ Un véhicule nommé **${nom}** existe déjà dans la boutique !` });
      }

      const newCar = {
        id: `car_${Date.now()}`,
        name: nom,
        price: prix,
        imageUrl: imageAttachment.url
      };

      cars.push(newCar);
      saveCars(cars);

      await updateShopCatalog(message.guild);

      await message.reply({
        content: `✅ Le véhicule **${nom}** a été ajouté avec succès au catalogue au prix de **${prix}** et le salon boutique a été mis à jour !`
      });
      return;
    } catch (e) {
      console.error(e);
      await message.reply({ content: `❌ Erreur lors de l'ajout : ${e.message}` }).catch(() => {});
    }
  }

  if (content.startsWith('/remove-car') || content.startsWith('!remove-car')) {
    const isStaffMember = message.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => message.member.roles.cache.has(roleId));
    if (!isStaffMember) return;

    try {
      const nom = message.content.substring(12).trim();
      if (!nom) {
        return await message.reply({ content: "❌ **Format incorrect !**\nUtilisez : `/remove-car Nom du véhicule`" });
      }

      let cars = loadCars();
      const originalLength = cars.length;
      cars = cars.filter(c => c.name.toLowerCase() !== nom.toLowerCase());

      if (cars.length === originalLength) {
        return await message.reply({ content: `❌ Aucun véhicule nommé **${nom}** n'a été trouvé.` });
      }

      saveCars(cars);
      await updateShopCatalog(message.guild);

      await message.reply({ content: `✅ Le véhicule **${nom}** a été retiré de la boutique et le salon boutique a été mis à jour !` });
      return;
    } catch (e) {
      console.error(e);
    }
  }

  if (content.startsWith('/clear-shop') || content.startsWith('!clear-shop')) {
    const isStaffMember = message.member.permissions.has(PermissionFlagsBits.Administrator) || config.staffRoles.some(roleId => message.member.roles.cache.has(roleId));
    if (!isStaffMember) return;

    try {
      saveCars([]);
      await updateShopCatalog(message.guild);
      await message.reply({ content: '✅ La boutique a été vidée et le salon boutique a été mis à jour avec succès !' });
      return;
    } catch (e) {
      console.error(e);
      await message.reply({ content: `❌ Erreur lors de la vidange : ${e.message}` }).catch(() => {});
    }
  }

  // 🎵 Ignorer toutes les protections (anti-bot, anti-spam, anti-lien) dans les salons dédiés à la musique
  const channelName = message.channel.name ? message.channel.name.toLowerCase() : "";
  if (channelName.includes('musique') || channelName.includes('music') || channelName.includes('bot-cmd') || channelName.includes('cmd-bot')) {
    return;
  }

  // 🚫 Supprimer les messages des bots non autorisés
  if (message.author.bot) {
    if (message.author.id === client.user.id) return;
    if (message.webhookId) return; // Autoriser tous les messages provenant de Webhooks
    if (!BOTS_AUTORISES.has(message.author.id)) {
      try {
        await message.delete();
        console.log(`[ANTI-BOT] Message du bot non autorisé ${message.author.tag} supprimé dans #${message.channel.name}`);
      } catch (e) {
        console.error('[ANTI-BOT] Erreur suppression message bot :', e.message);
      }
    }
    return; // On ne traite pas les autres vérifications pour les bots
  }

  // Ignorer les DMs (déjà géré mais sécurité)
  if (!message.guild) return;

  // Le staff ne se fait pas supprimer (rôles staff)
  const member = message.member;
  const isStaff = config.staffRoles.some(roleId => member.roles.cache.has(roleId));
  if (isStaff) return;

  // ── ANTI-SPAM ──────────────────────────────────
  const userId = message.author.id;
  if (!spamMap.has(userId)) {
    spamMap.set(userId, { count: 0, messages: [] });
  }
  const userData = spamMap.get(userId);
  userData.count++;
  userData.messages.push(message);

  // Reset automatique après la fenêtre de temps
  clearTimeout(userData.timeout);
  userData.timeout = setTimeout(() => {
    spamMap.delete(userId);
  }, SPAM_WINDOW);

  // Si trop de messages → spam détecté !
  if (userData.count >= SPAM_LIMIT) {
    try {
      // Supprimer tous les messages spam en masse
      const toDelete = [...userData.messages];
      spamMap.delete(userId); // Reset immédiat
      for (const msg of toDelete) {
        await msg.delete().catch(() => {});
      }
      console.log(`[ANTI-SPAM] Spam détecté de ${message.author.tag} — ${toDelete.length} messages supprimés.`);

      // Avertissement temporaire
      const warn = await message.channel.send({
        content: `🚨 <@${message.author.id}> **STOP LE SPAM !** Tes messages ont été supprimés. ` +
                 `Encore du spam et tu seras sanctionné ! ⚠️`
      });
      setTimeout(() => warn.delete().catch(() => {}), 6000);
    } catch (err) {
      console.error('[ANTI-SPAM] Erreur :', err.message);
    }
    return; // Message déjà supprimé, on stop là
  }
  // ── FIN ANTI-SPAM ───────────────────────────────

  // Détecter les liens (http, https, www, discord.gg, etc.)
  const linkRegex = /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/invite\/)[^\s]*/gi;
  if (linkRegex.test(message.content)) {
    try {
      // Supprimer le message
      await message.delete();
      console.log(`[ANTI-LIEN] Message supprimé de ${message.author.tag} dans #${message.channel.name}`);

      // Envoyer un avertissement temporaire (disparaît après 5 secondes)
      const warn = await message.channel.send({
        content: `⛔ <@${message.author.id}> **Les liens sont interdits sur ce serveur !** Ton message a été supprimé.`
      });
      setTimeout(() => warn.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error('[ANTI-LIEN] Erreur lors de la suppression du message :', err.message);
    }
  }
});

// ══════════════════════════════════════════════
// 🛡️ GESTIONNAIRES D'ERREURS GLOBAUX (anti-crash)
// ══════════════════════════════════════════════

// Erreurs du client Discord
client.on('error', (err) => {
  console.error('[BOT] Erreur client Discord :', err.message);
});

// Promesses rejetées non gérées (evite le crash)
process.on('unhandledRejection', (reason, promise) => {
  console.error('[BOT] Promesse rejetée non gérée :', reason?.message || reason);
});

// Exceptions non gérées (evite le crash)
process.on('uncaughtException', (err) => {
  console.error('[BOT] Exception non gérée :', err.message);
  // On ne quitte PAS le processus pour garder le bot en ligne
});

// Lancement du bot
client.login(process.env.DISCORD_TOKEN);
