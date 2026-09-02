# Correction domaine dynamique des QR codes

Cette version ne contient aucun domaine de production écrit en dur.

## Fonctionnement

- Dans l'interface admin (navigateur), le lien public et le QR utilisent automatiquement `window.location.origin`.
- Côté serveur, `NEXT_PUBLIC_SITE_URL` est utilisé en priorité.
- Si cette variable n'est pas disponible côté serveur, les variables Vercel sont utilisées.
- Les liens conservent toujours le format `/v/CODE`.

## Vercel

Définir de préférence :

NEXT_PUBLIC_SITE_URL=https://votre-domaine.com

Puis redéployer.

Même si cette variable est encore ancienne, les QR générés depuis l'admin ouvert sur le nouveau domaine utilisent le domaine réellement ouvert dans le navigateur.
