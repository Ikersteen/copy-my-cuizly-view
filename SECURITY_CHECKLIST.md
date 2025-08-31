# 🔒 Checklist Sécurité Cuizly

## Statut: ⚠️ AMÉLIORATIONS REQUISES

### 1. 🔑 Gestion des clés & secrets

#### ✅ Points conformes:
- ✅ Toutes les clés API stockées dans Supabase Secrets (OpenAI, SendGrid, Google Maps, Resend)
- ✅ Service role key utilisée uniquement côté serveur (edge functions)
- ✅ Anon key utilisée côté client
- ✅ Aucune clé exposée dans le code source

#### ⚠️ Actions requises:
- 🔄 **URGENT**: Planifier rotation trimestrielle des clés API
- 📋 Créer un calendrier de rotation des secrets
- 🔍 Audit régulier des accès aux secrets Supabase

---

### 2. 👥 Authentification & utilisateurs

#### ✅ Points conformes:
- ✅ Supabase Auth activé avec JWT
- ✅ Validation mot de passe robuste (8+ caractères, majuscule, minuscule, chiffre, caractère spécial)
- ✅ Rate limiting client-side implémenté
- ✅ Session timeout (8h d'inactivité)
- ✅ Email confirmation activée
- ✅ Logout sécurisé avec nettoyage des caches

#### ⚠️ Actions requises:
- 🔐 **CRITIQUE**: Désactiver les connexions anonymes (config.toml: `enable_anonymous_sign_ins = false` ✅ FAIT)
- 🔒 Activer login social sécurisé (Google/Apple) si nécessaire
- 📧 Configurer domaine personnalisé pour les emails d'auth
- 🛡️ Implémenter 2FA pour les comptes administrateurs

---

### 3. 🗄️ Base de données (Supabase)

#### ✅ Points conformes:
- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Politiques RLS explicites pour chaque table
- ✅ Fonction de validation de mot de passe côté base
- ✅ Audit logs configurés
- ✅ Backup automatique Supabase

#### ⚠️ Problèmes détectés:
- 🚨 **16 avertissements sécurité** détectés par le linter Supabase
- ⚠️ Politiques RLS permettent accès aux utilisateurs anonymes sur plusieurs tables:
  - `Comments`, `menus`, `offers`, `orders`, `profiles`, `ratings`
  - `restaurant_analytics`, `restaurants`, `user_favorites`, `user_preferences`

#### 🛠️ Actions correctives:
```sql
-- Exemple pour corriger l'accès anonyme sur la table Comments:
DROP POLICY "Only authenticated users can view active comments" ON public.Comments;
CREATE POLICY "Only authenticated users can view active comments" 
ON public.Comments FOR SELECT 
TO authenticated 
USING (is_active = true);
```

---

### 4. 🌐 Frontend (Lovable / React)

#### ✅ Points conformes:
- ✅ HTTPS par défaut
- ✅ Sanitisation des entrées utilisateur (DOMPurify)
- ✅ Validation côté client robuste
- ✅ Pas d'API privée exposée dans le frontend
- ✅ Toutes les requêtes passent par edge functions Supabase
- ✅ Validation upload de fichiers (5MB max, types autorisés)

#### ⚠️ Actions requises:
- 🌐 Configurer domaine personnalisé avec SSL (cuizly.ca)
- 🔒 Ajouter CSP (Content Security Policy) headers
- 🛡️ Implémenter CSRF protection pour les formulaires critiques

---

### 5. 📩 Emails & communication (SendGrid)

#### ✅ Points conformes:
- ✅ SendGrid configuré et fonctionnel
- ✅ Templates email React Email implémentés
- ✅ Edge functions sécurisées pour envoi d'emails

#### 🚨 Actions critiques requises:
- **URGENT - Configuration DNS cuizly.ca:**
  - 📧 SPF record: `v=spf1 include:sendgrid.net ~all`
  - 🔐 DKIM: Configurer dans SendGrid dashboard
  - 🛡️ DMARC: `v=DMARC1; p=quarantine; rua=mailto:admin@cuizly.ca`
- 🔗 Activer link branding SendGrid (liens en cuizly.ca)
- 📄 Ajouter footer légal "se désabonner" (conformité CASL Canada)
- 📝 Créer politique de confidentialité email

---

## 🎯 Priorités d'action (ordre d'urgence)

### 🔴 CRITIQUE (Corriger sous 48h):
1. Corriger les 16 avertissements RLS Supabase
2. Configurer DNS cuizly.ca (SPF, DKIM, DMARC)
3. Planifier rotation des clés API

### 🟡 IMPORTANT (Corriger sous 2 semaines):
1. Configurer domaine personnalisé avec SSL
2. Implémenter 2FA pour admins
3. Ajouter CSP headers
4. Créer calendrier de maintenance sécurité

### 🟢 AMÉLIORATION (Corriger sous 1 mois):
1. Activer login social sécurisé
2. Améliorer monitoring sécurité
3. Documentation procédures sécurité

---

## 📊 Score de sécurité actuel: 7/10

**Points forts:** Architecture sécurisée, authentification robuste, validation côté client
**Points faibles:** Configuration RLS, DNS email, procédures de maintenance

---

*Dernière mise à jour: ${new Date().toLocaleDateString('fr-CA')}*
*Prochaine révision: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-CA')}*