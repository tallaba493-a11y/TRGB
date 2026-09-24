# 🎮 GUIDE COMPLET D'INSTALLATION : DISCORD ↔ ROBLOX RP WHITELIST

Ce guide détaille l'installation complète du système de Whitelist côté **Roblox Studio** et côté **Discord Bot**.

---

## 🛑 PARTIE 1 : CÔTÉ ROBLOX STUDIO

### 1. Activer les autorisations de l'expérience Roblox
1. Ouvrez votre jeu dans **Roblox Studio**.
2. Allez dans l'onglet **Home** (Accueil) -> cliquez sur **Game Settings** (Paramètres du jeu).
3. Cliquez sur la rubrique **Security** (Sécurité) à gauche.
4. Activez les deux options suivantes :
   - ✅ **Allow HTTP Requests** (Autoriser les requêtes HTTP) -> *Indispensable pour envoyer les webhooks Discord*.
   - ✅ **Enable API Services** (Activer les services d'API) -> *Indispensable pour les DataStores*.
5. Cliquez sur **Save** (Enregistrer).

---

### 2. Ajouter le Script Luau de Whitelist
1. Dans la fenêtre **Explorer** à droite, faites un clic droit sur **ServerScriptService**.
2. Sélectionnez **Insert Object** -> **Script** (Nommez-le `WhitelistSystem`).
3. Collez l'intégralité du code ci-dessous :

```lua
-- ════════════════════════════════════════════════════════════════════
-- 🦁 TERANGA RP — SYSTÈME DE WHITELIST DISCORD & OPEN CLOUD (SERVERSCRIPT)
-- ════════════════════════════════════════════════════════════════════

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

-- Nom exact du DataStore (doit correspondre au Bot Discord)
local WhitelistDataStore = DataStoreService:GetDataStore("TB_Whitelist_V1")

-- 🔗 COLLEZ VOTRE URL DE WEBHOOK DISCORD CI-DESSOUS
local WEBHOOK_URL = "https://discord.com/api/webhooks/VOTRE_WEBHOOK_URL_ICI"

Players.PlayerAdded:Connect(function(player)
    local userId = player.UserId
    local key = "WL_" .. tostring(userId)
    
    local success, data = pcall(function()
        return WhitelistDataStore:GetAsync(key)
    end)
    
    -- 1. Si le joueur est accepté (Whitelisted)
    if success and data and type(data) == "table" and data.status == "accepted" then
        print("✅ [WHITELIST] Joueur autorisé : " .. player.Name .. " (" .. userId .. ") - Grade: " .. (data.grade or "Joueur"))
        return
    end
    
    -- 2. Si le joueur est banni
    if success and data and type(data) == "table" and data.status == "banned" then
        player:Kick("🚫 Vous êtes banni du serveur TERANGA RP.\nRaison : " .. (data.reason or "Non spécifiée"))
        return
    end
    
    -- 3. Si le joueur n'est pas whitelisted ou a été refusé -> Envoyer Webhook Discord & Kick
    local accountAge = player.AccountAge
    local avatarUrl = "https://www.roblox.com/headshot-thumbnail/image?userId=" .. userId .. "&width=150&height=150&format=png"
    
    local payload = {
        embeds = {{
            title = "🚫 Tentative de connexion non autorisée",
            color = 16724788, -- Rouge
            thumbnail = { url = avatarUrl },
            fields = {
                { name = "Joueur", value = player.Name, inline = true },
                { name = "UserId", value = tostring(userId), inline = true },
                { name = "Âge du compte", value = accountAge .. " jours", inline = true }
            },
            footer = { text = "Teranga RP • Système Anti-Intrusion" },
            timestamp = DateTime.now():ToIsoDate()
        }}
    }
    
    -- Envoi du Webhook à Discord
    pcall(function()
        HttpService:PostAsync(WEBHOOK_URL, HttpService:JSONEncode(payload), Enum.HttpContentType.ApplicationJson)
    end)
    
    -- Expulsion du joueur non whitelisté
    player:Kick("❌ Accès non autorisé à TERANGA RP.\nUne demande de Whitelist a été transmise au Staff sur Discord.")
end)
```

---

## 🤖 PARTIE 2 : CÔTÉ BOT DISCORD & ROBLOX OPEN CLOUD

### 1. Obtenir la clé API Open Cloud sur Roblox Creator
1. Rendez-vous sur le [Tableau de bord Roblox Creator](https://create.roblox.com/credentials).
2. Cliquez sur **API Keys** -> **Create API Key**.
3. Nom de la clé : `Discord Whitelist Bot`.
4. Permissions : **Data Stores** -> **Data Store Entries**.
5. Opérations : Cochez **Read** et **Create / Update**.
6. Expérience : Sélectionnez votre jeu Roblox.
7. IP Restrictions : Ajoutez `0.0.0.0/0`.
8. Copiez la clé API générée (`ROBLOX_API_KEY`).

---

### 2. Obtenir l'Universe ID
1. Rendez-vous sur la liste de vos créations : [create.roblox.com/dashboard/creations](https://create.roblox.com/dashboard/creations).
2. Cliquez sur votre jeu.
3. Regardez l'URL dans votre navigateur : `https://create.roblox.com/dashboard/creations/experiences/123456789/overview`.
4. Le nombre `123456789` est votre **UNIVERSE_ID**.

---

### 3. Fonctionnement des Boutons & Commandes Discord
- **Bouton `✅ Accepter`** : Valide la Whitelist du joueur directement dans Roblox via Open Cloud, lui donne le rôle Citoyen et ferme la demande.
- **Bouton `❌ Refuser`** : Ouvre une modale pour écrire la raison et enregistre le refus.
- **Commande `/whitelist <userid>`** : Valide manuellement un joueur.
- **Commande `/unwhitelist <userid> <raison>`** : Retire la Whitelist.
- **Commande `/ban <userid> <raison>`** : Bannit le joueur de Roblox.
- **Commande `/check <userid>`** : Consulte l'état de la Whitelist et la photo du joueur.
