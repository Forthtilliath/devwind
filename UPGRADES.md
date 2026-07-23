# Idées d'amélioration — DevWind

Liste brute d'idées, en tout genre, pas encore priorisées. À trier/discuter avant de piocher dedans.

## Couverture de la taxonomie (Phase B) — ✅ fait

- ~~Catégories manquantes~~ : Sizing, Bordures & Radius (+ `ring`/`divide`), Effets, Filtres (+ `backdrop-*`), Transitions & Transforms, Interactivité — ajoutées (~35 nouvelles entrées `taxonomy.ts`, ~4800 classes générées).
- ~~`line-height` associé à `fontSize`~~ — `GeneratedClass.secondaryValue` porte le line-height apparié, utilisé par `live-style.ts`.
- Ambiguïté théorique sur préfixes partagés (`text-`, `border-`) si un thème custom nomme une clé de couleur comme une clé de taille — toujours non traité, edge case qui ne s'applique qu'à un thème personnalisé (hors scope, thème par défaut uniquement).
- **Suivi découvert en cours de route** : `ring`/`shadow` sont synthétisés en CSS simple (`box-shadow` direct), pas composés avec le vrai mécanisme `--tw-ring-shadow`/`--tw-shadow` de Tailwind — combiner ring+shadow simultanément sur le même élément ne sera pas parfaitement fidèle visuellement (cas rare, simplification volontaire).

## Synthèse CSS live (live-style.ts) — ✅ fait

- ~~`dark:` non synthétisé~~ — double émission (`@media (prefers-color-scheme: dark)` ET `:where(.dark, .dark *)`) plutôt que détection de stratégie : marche quelle que soit la stratégie réelle du site, sans heuristique DOM.
- ~~`group-*`, `peer-*`, `aria-*`, `data-*`, `has-*` non synthétisés~~ — tous purement déclaratifs via combinateurs/sélecteurs CSS standards (`.group:hover .classe`, `.peer:hover ~ .classe`, `[aria-checked="true"]`, `:has(...)`, `[data-key="value"]`), pas besoin d'inspecter le DOM.
- ~~Valeurs arbitraires combinées à un modificateur d'opacité~~ — `bg-red-500/80` et `bg-[#ff0000]/50` synthétisés via `color-mix()` ; corrigé aussi côté `class-parser.ts` (sinon l'ancienne classe n'était jamais retirée au changement de couleur).
- ~~Pas de nettoyage des règles injectées~~ — plafond simple (purge des plus anciennes au-delà de 300 règles).
- **Transform/filter/backdrop-filter** : synthèse composite fidèle au mécanisme réel de Tailwind (variables CSS `--tw-*` partagées + formule répétée), vérifié que `scale-105` + `rotate-45` se cumulent correctement sur le même élément (pas juste le dernier appliqué qui gagne).

## Édition / historique

- Pas d'undo/redo. Le mécanisme de `ClassChangeResult { before, after }` existe déjà côté `class-diff.ts` mais n'est pas exploité pour empiler un historique.
- Pas de multi-sélection (éditer plusieurs éléments similaires en même temps, ex. tous les `<li>` d'une liste).
- Pas de réordonnancement/tri manuel des chips de classes actives (ordre = ordre d'apparition dans `className`).
- Édition de classes custom limitée à toggle on/off (pas de rename, pas d'édition de la valeur CSS associée).

## Panneau / UX

- Pas de dark/light theme pour le panneau lui-même (actuellement toujours sombre, indépendant du thème système — pourrait suivre `prefers-color-scheme` ou avoir un toggle).
- Pas de raccourcis clavier dans le panneau (ex. `Cmd/Ctrl+F` pour focus la recherche, flèches pour naviguer une liste de résultats de popover).
- Pas de "classes récemment utilisées" / favoris (mentionné dans le plan initial, jamais implémenté) — utile pour réappliquer rapidement une couleur/spacing déjà utilisé ailleurs sur le site.
- Le sélecteur de côté (Padding/Margin/Gap) est du texte brut (`p`, `px`, `pt`...) — des icônes (carré plein, carré horizontal, flèche haut...) seraient plus lisibles.
- Pas d'indicateur visuel quand une classe appliquée n'a PAS pu être synthétisée par live-style (ex. `dark:`) — l'utilisateur ne sait pas toujours si "ça n'a pas marché" vs "il faut re-régénérer le CSS du site".
- Export limité à "copier les classes" (texte brut espacé) — pourrait proposer d'autres formats (JSX `className={...}`, diff avant/après, liste des changements de la session).

## Picker / sélection d'élément

- Pas de breadcrumb DOM (remonter au parent d'un élément sélectionné sans re-cliquer précisément dessus dans la page — utile pour des éléments très imbriqués ou petits).
- Pas de navigation clavier une fois un élément sélectionné (flèches pour aller au parent/enfant/frère suivant, comme les DevTools natifs).
- Le picker s'appuie sur `event.target` retargeté (marche bien), mais aucun mode "verrouiller la sélection" pour scroller/interagir avec la page sans risquer de perdre la sélection en cliquant ailleurs par erreur.

## Scan CSS

- Pas de fallback `fetch()` pour les feuilles de style cross-origin sans CORS (actuellement juste listées comme "non scannables") — beaucoup de CDN publics (Google Fonts, jsDelivr, unpkg) autorisent CORS et pourraient être récupérés.
- Le scan tourne une seule fois par sélection de fenêtre (pas de re-scan si le site charge du CSS dynamiquement après coup, ex. lazy-loaded stylesheets).

## Compatibilité Tailwind

- Dataset généré ciblé Tailwind v3 uniquement (`resolveConfig` v3). Tailwind v4 (config CSS-first `@theme`, moteur Oxide) non couvert — de plus en plus de sites l'utilisent (ex. tailwindcss.com lui-même utilise des classes façon v4 comme `text-balance`, `max-lg:`).
- Pas de détection de la version Tailwind réelle du site édité, ni d'avertissement si des classes "inconnues" de notre taxonomie sont en fait des classes v4 valides.
- Pas de prise en compte d'un thème customisé du site (couleurs/spacing personnalisés) — le dataset et les swatches restent basés sur le thème par défaut Tailwind (documenté comme limite connue).

## Qualité / process

- Pas de suite de tests automatisés versionnée dans le repo (les vérifications de cette session ont utilisé des scripts Playwright ad hoc dans le scratchpad, jetables) — un `tests/e2e/` avec Playwright + une page de fixture committée serait plus robuste pour éviter les régressions.
- Pas d'icônes custom pour l'extension (Chrome affiche l'icône par défaut) — à faire avant une éventuelle publication.
- Pas de README.
- Pas de CI (lint/build automatique sur push).
