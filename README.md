# Bot Ticket & Visa — Teranga RP

Ce bot Discord permet de gérer de manière autonome et intuitive les demandes de **Visa** pour un serveur GTA V RP (ou similaire), en s'appuyant sur les fonctionnalités modernes de `discord.js` v14 (boutons, embeds interactifs, salons éphémères).

## 🚀 Fonctionnalités
- 🎫 **Bouton d'inscription public** dans le salon choisi (via la commande `/setup-visa`).
- 📂 **Création d'un ticket privé** et dédié à chaque joueur.
- 🏛️ **Questionnaire de visa automatique** posté directement dans le ticket.
- ⚙️ **Panel de gestion complet pour le Staff** :
  - **Fermer** 🔒 : Retire l'accès au joueur pour archivage.
  - **Valider le Visa** ✅ : Donne automatiquement le rôle Citoyen et notifie le joueur en DM.
  - **Refuser le Visa** ❌ : Notifie le joueur du refus en DM.
- 🗑️ **Suppression propre** avec génération et envoi d'un fichier `.txt` contenant le **transcript (historique) complet** des messages du ticket.

---

## 🛠️ Installation et configuration

### 1. Prérequis
- [Node.js](https://nodejs.org/) v16.11.0 ou supérieur installé.

### 2. Configuration sur le Discord Developer Portal
1. Rendez-vous sur le [Discord Developer Portal](https://discord.com/developers/applications).
2. Créez une application, puis créez un Bot.
3. **Important** : Dans l'onglet **Bot**, activez les **Privileged Gateway Intents** suivants :
   - `PRESENCE INTENT` (Optionnel)
   - `SERVER MEMBERS INTENT` (Obligatoire pour gérer les rôles et trouver les membres)
   - `MESSAGE CONTENT INTENT` (Obligatoire pour le transcript et la lecture des messages)
4. Récupérez le **Token** de votre bot et copiez-le.
5. Invitez votre bot sur votre serveur avec les permissions minimales d'Administration ou de gestion des rôles/salons.

### 3. Fichiers locaux

1. Ouvrez le fichier [.env](file:///C:/Users/FALLOU/.gemini/antigravity/scratch/teranga-ticket-bot/.env) et remplacez `VOTRE_TOKEN_BOT_ICI` par le token de votre bot.
2. Ouvrez le fichier [config.json](file:///C:/Users/FALLOU/.gemini/antigravity/scratch/teranga-ticket-bot/config.json) et configurez les IDs suivants :
   - `clientId` : L'ID d'application (Client ID) de votre bot (trouvable sur le portail développeur).
   - `guildId` : L'ID de votre serveur Discord (clic droit sur le serveur -> *Copier l'identifiant*).
   - `categoryId` : L'ID de la catégorie Discord sous laquelle les nouveaux salons de visa seront créés.
   - `citizenRoleId` : L'ID du rôle "Citoyen" (attribué lorsque le visa est validé).
   - `staffRoles` : La liste des IDs des rôles du staff autorisés à gérer les tickets (Fondateur, Administrateur, Staff, Helpeur).

---

## 🏎️ Lancer le Bot

1. Ouvrez un terminal dans le dossier du bot.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Déployez la commande Slash `/setup-visa` (à ne faire qu'une seule fois ou après modification des commandes) :
   ```bash
   npm run deploy
   ```
4. Lancez le bot :
   ```bash
   npm start
   ```

---

## 🎮 Utilisation
1. Connectez-vous sur votre serveur Discord avec un compte Administrateur.
2. Allez dans le salon public destiné aux demandes de visa (ex: `#ticket-visa`).
3. Tapez la commande slash `/setup-visa` et validez.
4. L'embed avec le bouton apparaît. Les joueurs peuvent maintenant l'utiliser !
