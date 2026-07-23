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

## Picker / sélection d'élément — ✅ fait

- ~~Pas de breadcrumb DOM~~ — fil d'ariane des ancêtres (parent direct → `<body>`, plafonné à 8 niveaux) dans le devpanel, cliquable pour remonter sans re-cliquer sur la page.
- ~~Pas de navigation clavier~~ — flèches (`↑` parent, `↓` premier enfant, `←`/`→` frères) dans le devpanel, désactivées si le focus est dans un champ texte.
- ~~Pas de mode "verrouiller la sélection"~~ — bouton 🔒/🔓 dans l'en-tête : suspend le picking (survol/clic sur la page ignorés, interactions normales possibles) sans perdre la sélection courante ; celle-ci reste modifiable via le fil d'ariane / le clavier pendant le verrouillage.

## Scan CSS — ✅ fait

- ~~Pas de fallback `fetch()` pour les feuilles cross-origin~~ — les feuilles qui lèvent une erreur CSSOM sont récupérées via `fetch(href, {mode:'cors'})` puis parsées dans une `CSSStyleSheet` détachée (plus de restriction cross-origin une fois le texte local) ; celles qui refusent CORS restent listées comme non scannables.
- ~~Pas de re-scan si le site charge du CSS dynamiquement~~ — `MutationObserver` (debounced 300ms) sur l'ajout de `<link rel=stylesheet>`/`<style>`, re-scanne et pousse le résultat à jour à la fenêtre devpanel automatiquement.

## Compatibilité Tailwind

- ~~Dataset ciblé Tailwind v3~~ — migré vers Tailwind v4 (`tailwindcss/defaultTheme` + résolveur maison, `resolveConfig` n'existe plus en v4). Couleurs par défaut désormais en OKLCH plutôt qu'en hex (aucun changement de code nécessaire ailleurs, `color-mix()`/swatches gèrent nativement).
- Pas de prise en compte d'un thème customisé du site (couleurs/spacing personnalisés) — le dataset et les swatches restent basés sur le thème par défaut Tailwind (documenté comme limite connue).
- **Option `prefix` de Tailwind non gérée** : un site configuré avec un préfixe (ex. `tw-bg-red-500` au lieu de `bg-red-500`, pour éviter les collisions avec un autre framework CSS) n'est pas reconnu par `class-parser.ts` — ces classes finissent en "Custom / Autres classes" (non éditables via les pickers), et une classe ajoutée depuis le panneau serait ajoutée sans le préfixe du site (pas de correspondance avec son vrai CSS). Pas d'accès à la config du site pour connaître le préfixe réel ; à détecter par heuristique (scanner les classes du DOM/CSS pour un motif de préfixe répété devant des suffixes Tailwind connus) si jamais traité.

## Qualité / process

- Pas de suite de tests automatisés versionnée dans le repo (les vérifications de cette session ont utilisé des scripts Playwright ad hoc dans le scratchpad, jetables) — un `tests/e2e/` avec Playwright + une page de fixture committée serait plus robuste pour éviter les régressions.
- Pas d'icônes custom pour l'extension (Chrome affiche l'icône par défaut) — à faire avant une éventuelle publication.
- Pas de README.
- Pas de CI (lint/build automatique sur push).
