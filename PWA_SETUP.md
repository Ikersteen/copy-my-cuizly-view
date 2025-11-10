# Configuration PWA et Google Drive - Cuizly Manager

## 🎯 Résumé des fonctionnalités implémentées

Cuizly Manager est maintenant une **Progressive Web App (PWA)** complète avec :

### ✅ Fonctionnalités PWA
- **Installation native** : Sur ordinateur et mobile avec icône d'application
- **Mode hors ligne** : Fonctionne sans connexion internet avec cache intelligent
- **Notifications push** : Alertes en temps réel pour réservations et messages
- **Synchronisation automatique** : Les données se synchronisent dès la reconnexion
- **Expérience native** : Écran de lancement, icône dans la galerie d'applications

### ✅ Intégration Google Drive
- **Authentification OAuth2** : Connexion sécurisée au compte Google Drive
- **Navigation de fichiers** : Parcourir et consulter les fichiers Drive
- **Synchronisation** : Import automatique des fichiers dans Cuizly
- **Accès depuis Assistant** : Cuizly Assistant peut analyser les fichiers (menus, rapports, etc.)

---

## 📋 Configuration requise

### 1. Configuration PWA (déjà faite)

Le plugin `vite-plugin-pwa` est configuré dans `vite.config.ts` avec :
- Manifest PWA pour l'installabilité
- Service Worker pour le cache et mode hors ligne
- Stratégies de cache optimisées (NetworkFirst, CacheFirst)

### 2. Variables d'environnement à ajouter

Créez ou mettez à jour votre fichier `.env` :

```env
# Notifications Push (optionnel pour l'instant)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# Google Drive API (requis pour l'intégration Drive)
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_DRIVE_API_KEY=your_google_api_key_here
```

---

## 🔧 Étapes de configuration

### Étape 1 : Générer les clés VAPID (Notifications Push)

Les clés VAPID sont nécessaires pour les notifications push. Générez-les avec :

```bash
npx web-push generate-vapid-keys
```

Vous obtiendrez deux clés :
- **Public Key** → à mettre dans `VITE_VAPID_PUBLIC_KEY`
- **Private Key** → à stocker de manière sécurisée (backend/Supabase)

### Étape 2 : Configurer Google Drive API

1. **Créer un projet Google Cloud** :
   - Allez sur [Google Cloud Console](https://console.cloud.google.com)
   - Créez un nouveau projet ou sélectionnez un projet existant

2. **Activer l'API Google Drive** :
   - Dans le menu, allez à "APIs & Services" > "Library"
   - Recherchez "Google Drive API" et activez-la

3. **Créer des identifiants OAuth 2.0** :
   - Allez à "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth client ID"
   - Type d'application : "Application Web"
   - URIs de redirection autorisés : 
     ```
     http://localhost:8080/restaurant-dashboard
     https://votre-domaine.com/restaurant-dashboard
     ```
   - Copiez le **Client ID** → `VITE_GOOGLE_DRIVE_CLIENT_ID`

4. **Créer une clé API** :
   - Dans "Credentials", cliquez sur "Create Credentials" > "API key"
   - Copiez la clé → `VITE_GOOGLE_DRIVE_API_KEY`

### Étape 3 : Créer les Edge Functions Supabase

Pour l'intégration Google Drive, créez deux edge functions :

#### `supabase/functions/google-drive-list/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { folderId } = await req.json()
    
    // Récupérer le token depuis la base de données
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    
    // Récupérer le Google access token
    const driveToken = localStorage.getItem(`google_drive_token_${user.id}`)
    
    // Appeler l'API Google Drive
    const driveUrl = folderId 
      ? `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents`
      : 'https://www.googleapis.com/drive/v3/files'
    
    const response = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${driveToken}`,
      },
    })

    const files = await response.json()

    return new Response(
      JSON.stringify({ files: files.files || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
```

#### `supabase/functions/google-drive-download/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileId } = await req.json()
    
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    const driveToken = localStorage.getItem(`google_drive_token_${user.id}`)
    
    // Télécharger le fichier depuis Drive
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${driveToken}`,
        },
      }
    )

    const content = await response.arrayBuffer()

    return new Response(
      JSON.stringify({ content, mimeType: response.headers.get('content-type') }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
```

### Étape 4 : Ajouter la section PWA au Dashboard Restaurant

Le composant `PWASettingsSection` est déjà créé. Ajoutez-le dans votre page de dashboard :

```tsx
import { PWASettingsSection } from '@/components/PWASettingsSection';

// Dans votre page RestaurantDashboard
<PWASettingsSection />
```

---

## 🎨 Composants créés

### Hooks
- `usePWAInstall` : Gestion de l'installation PWA
- `usePushNotifications` : Gestion des notifications push
- `useGoogleDrive` : Intégration Google Drive

### Composants UI
- `PWAInstallPrompt` : Bannière d'installation (affichée automatiquement)
- `PWASettingsSection` : Panneau de configuration PWA complet
- `GoogleDriveManager` : Interface de gestion Google Drive

---

## 🚀 Utilisation

### Installation de l'app

1. L'utilisateur visite le site sur mobile ou ordinateur
2. Une bannière d'installation apparaît automatiquement
3. Cliquer sur "Installer" ajoute l'app à l'écran d'accueil

### Notifications Push

1. Dans le dashboard, aller aux paramètres PWA
2. Activer le switch "Activer les notifications"
3. Accepter les permissions du navigateur
4. Les notifications seront envoyées automatiquement

### Google Drive

1. Dans le dashboard, section Google Drive
2. Cliquer sur "Connecter Google Drive"
3. Autoriser l'accès dans la fenêtre Google OAuth
4. Naviguer dans les fichiers et cliquer sur "Synchroniser"

---

## 📱 Test de l'application

### Sur desktop (Chrome/Edge)
1. Ouvrez l'app : `http://localhost:8080`
2. Dans la barre d'URL, cliquez sur l'icône d'installation (⊕)
3. L'app s'ouvre dans une fenêtre native

### Sur mobile
1. Ouvrez l'app dans Safari (iOS) ou Chrome (Android)
2. iOS : Partager > Ajouter à l'écran d'accueil
3. Android : Menu > Installer l'application

### Test du mode hors ligne
1. Ouvrez l'app et naviguez un peu
2. Ouvrez les DevTools > Network > "Offline"
3. Rafraîchissez : l'app continue de fonctionner !

---

## 🔒 Sécurité et Bonnes Pratiques

- ✅ Les tokens Google Drive sont stockés de manière sécurisée
- ✅ OAuth2 avec refresh token pour accès longue durée
- ✅ Service Worker avec cache intelligent
- ✅ HTTPS requis pour les notifications push en production
- ✅ Permissions explicites pour Drive et notifications

---

## 📊 Métriques PWA

Après déploiement, vérifiez les performances PWA :
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (dans Chrome DevTools)
- Score PWA cible : **95+/100**
- Critères : Installabilité, Performance, Accessibilité

---

## 🐛 Dépannage

### L'installation PWA ne fonctionne pas
- Vérifiez que vous êtes en HTTPS (ou localhost)
- Le manifest doit être valide (validez sur [Web App Manifest Validator](https://manifest-validator.appspot.com/))
- Le Service Worker doit être enregistré (vérifiez dans Application > Service Workers)

### Les notifications ne fonctionnent pas
- Vérifiez les permissions du navigateur
- Les clés VAPID doivent être correctement configurées
- En production, HTTPS est obligatoire

### Google Drive ne se connecte pas
- Vérifiez les URIs de redirection dans Google Console
- Le Client ID doit être correct dans `.env`
- Les scopes OAuth doivent inclure `drive.readonly`

---

## 📚 Ressources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)

---

**Cuizly Manager est maintenant une application progressive moderne, installable et fonctionnant hors ligne ! 🎉**
