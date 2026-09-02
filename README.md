# Vérification de documents par QR code

Petit site Next.js + Supabase : depuis une page admin privée, vous téléversez
l'image d'un document (JPEG, PNG, WEBP). Le système crée un lien public unique
et un QR code transparent à imprimer sur vos factures, reçus, contrats,
attestations… Quand un client scanne le QR, il voit uniquement l'image du
document.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`)
- TypeScript, Tailwind CSS 4
- Supabase (Auth, Database, Storage privé + URL signées)
- `qrcode` pour la génération des QR (PNG 1000 × 1000, fond transparent)
- Déploiement Vercel

## Routes importantes

| Route          | Rôle                                                              |
| -------------- | ----------------------------------------------------------------- |
| `/`            | Redirige vers `/admin`                                            |
| `/admin/login` | Connexion (Supabase Auth, e-mail + mot de passe)                  |
| `/admin`       | Gestion des documents (protégé par `proxy.ts`)                    |
| `/v/[code]`    | Page publique : affiche uniquement l'image, sinon 404 propre      |

## 1. Configuration Supabase

1. Créez un projet sur <https://supabase.com>.
2. **SQL Editor → New query** : collez le contenu de `supabase/schema.sql`
   et exécutez-le. Il crée la table `documents`, l'index, le trigger
   `updated_at`, active la RLS et crée le bucket privé `documents`
   (15 MB max, JPEG/PNG/WEBP).
3. **Storage** : vérifiez que le bucket `documents` existe et est **privé**.
   Si vous préférez le créer à la main : *New bucket* → nom `documents`,
   *Public bucket* désactivé, *File size limit* 15 MB, *Allowed MIME types*
   `image/jpeg, image/png, image/webp`. Ne créez aucune policy Storage :
   l'accès se fait uniquement par URL signée côté serveur.
4. **Authentication → Providers → Email** : laissez activé. Désactivez
   *Enable email signups* (Sign ups) pour qu'aucun inconnu ne puisse créer un
   compte.
5. **Authentication → Users → Add user → Create new user** : saisissez
   votre e-mail et un mot de passe fort, cochez *Auto Confirm User*. Ce sont
   vos identifiants admin.
6. **Project Settings → API** : notez `Project URL`, `anon public` et
   `service_role` (secret).

### Sécurité (déjà en place)

- RLS activée sans aucune politique pour `anon` / `authenticated` : la clé
  anon ne peut ni lire ni lister la table. Seul le serveur (service role)
  accède aux données, et la page publique ne cherche qu'un
  `verification_code` précis, jamais de liste.
- Bucket privé : les images ne sont servies que par URL signée (1 h).
- Chemins de fichiers : `<uuid>/document.<ext>` — impossibles à deviner.
- Codes de vérification : 10 caractères aléatoires (`crypto.randomBytes`),
  alphabet sans caractères ambigus, ≈ 2^50 combinaisons.
- Validation serveur : taille ≤ 15 MB, type MIME **et** signature binaire du
  fichier (magic bytes). Un fichier arbitraire renommé `.jpg` est refusé.
- `SUPABASE_SERVICE_ROLE_KEY` n'est lue que dans des modules marqués
  `server-only` ; le build échoue si un composant client l'importe.
- `/admin` bloqué par `proxy.ts` sans session valide.

## 2. Lancer en local

```bash
cp .env.example .env.local   # puis remplissez les valeurs
npm install
npm run dev                  # http://localhost:3000
```

Vérification finale :

```bash
npm run lint
npm run build
```

## 3. Variables d'environnement

| Variable                        | Où                | Description                                              |
| ------------------------------- | ----------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + serveur  | URL du projet Supabase                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + serveur  | Clé anon (auth uniquement)                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | **serveur seul**  | Clé service role, jamais exposée au navigateur           |
| `NEXT_PUBLIC_SITE_URL`          | client + serveur  | Base des liens publics / QR, ex. `https://verify.mondomaine.com` (sans `/` final) |

⚠️ Les QR codes encodent `NEXT_PUBLIC_SITE_URL` : définissez-la avec votre
domaine définitif **avant** d'imprimer des QR.

## 4. GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<vous>/<repo>.git
git push -u origin main
```

`.env.local` est ignoré par git : vos clés ne partent jamais sur GitHub.

## 5. Vercel

1. <https://vercel.com/new> → *Import* votre dépôt GitHub. Framework détecté :
   Next.js, aucune option à changer.
2. **Environment Variables** : ajoutez les 4 variables ci-dessus
   (Production + Preview). `NEXT_PUBLIC_SITE_URL` = votre domaine final.
3. *Deploy*. Vercel exécute `npm install` puis `npm run build`.
4. Après tout changement de variable d'environnement, relancez un déploiement
   (*Deployments → Redeploy*).

## 6. Connecter votre domaine

1. Vercel → votre projet → **Settings → Domains → Add** :
   `verify.mondomaine.com`.
2. Chez votre registrar, créez l'enregistrement DNS indiqué par Vercel :
   - sous-domaine : `CNAME verify → cname.vercel-dns.com`
   - domaine racine : `A @ → 76.76.21.21`
3. Attendez la validation (quelques minutes à quelques heures). Le certificat
   HTTPS est automatique.
4. Mettez `NEXT_PUBLIC_SITE_URL=https://verify.mondomaine.com` dans Vercel,
   puis *Redeploy*.

## 7. Utilisation

1. Ouvrez `/admin`, connectez-vous.
2. Choisissez une image → l'aperçu s'affiche → *Enregistrer le document*.
3. Dans la liste : *Copier le lien*, *Télécharger le QR* (PNG 1000 × 1000,
   fond transparent), *Remplacer l'image* (le lien et le QR restent
   identiques), *Supprimer* (image + entrée supprimées, le lien renvoie 404).

## Arborescence

```
.
├── app/
│   ├── admin/
│   │   ├── actions.ts          # Server Actions : login, logout, upload, remplacer, supprimer
│   │   ├── login/page.tsx      # Page de connexion
│   │   └── page.tsx            # Liste + formulaire (Server Component)
│   ├── v/[code]/
│   │   ├── not-found.tsx       # "Document introuvable"
│   │   └── page.tsx            # Page publique : image seule
│   ├── favicon.ico
│   ├── globals.css             # Tailwind 4 + tokens de couleur
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx                # Redirige vers /admin
├── components/admin/
│   ├── DocumentCard.tsx        # Miniature, lien, QR, actions
│   ├── DocumentList.tsx
│   ├── LoginForm.tsx
│   ├── UploadForm.tsx          # Upload avec aperçu et validation client
│   └── ui.tsx                  # Button, ErrorText
├── lib/
│   ├── codes.ts                # Génération / validation des codes
│   ├── documents.ts            # Accès données (server-only)
│   ├── env.ts                  # Lecture des variables d'environnement
│   ├── qr.ts                   # Génération QR (aperçu + PNG 1000 px transparent)
│   ├── site.ts                 # Bucket + construction des URL publiques
│   ├── validation.ts           # Taille, MIME, magic bytes
│   └── supabase/
│       ├── admin.ts            # Client service role (server-only)
│       ├── client.ts           # Client navigateur (anon, auth)
│       └── server.ts           # Client serveur lié aux cookies
├── supabase/
│   └── schema.sql              # Table, index, trigger, RLS, bucket
├── types/
│   └── document.ts
├── public/
├── proxy.ts                    # Protection de /admin (ex-middleware)
├── next.config.ts              # remotePatterns Supabase, limite upload 20 MB
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```
