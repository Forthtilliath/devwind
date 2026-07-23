# Idées d'amélioration — DevWind

Liste brute d'idées, en tout genre, pas encore priorisées. À trier/discuter avant de piocher dedans.

## Couverture de la taxonomie (Phase B) — ✅ fait

- ~~Catégories manquantes~~ : Sizing, Bordures & Radius (+ `ring`/`divide`), Effets, Filtres (+ `backdrop-*`), Transitions & Transforms, Interactivité — ajoutées (~35 nouvelles entrées `taxonomy.ts`, ~5350 classes générées sur le thème par défaut v4).
- ~~`line-height` associé à `fontSize`~~ — `GeneratedClass.secondaryValue` porte le line-height apparié, utilisé par `live-style.ts` (référencé via `var(--text-{clé}--line-height, ...)` sur les sites v4 réels).
- Ambiguïté théorique sur préfixes partagés (`text-`, `border-`) si un thème custom nomme une clé de couleur comme une clé de taille — toujours non traité, edge case qui ne s'applique qu'à un thème personnalisé (hors scope, thème par défaut uniquement).
- **`tracking-*` (letter-spacing) et `leading-*` (line-height autonome) absents de la taxonomie** — découvert en inspectant la vraie sortie compilée v4 (`--tracking-wide`, `--tw-leading`) : ce sont de vraies catégories Typography qu'on n'a pas encore ajoutées.
- **Utilitaires v4-only absents** : `mask-*`, `text-shadow-*`, `field-sizing-*`, container queries (`@container`, variants `@sm:`...), variants `not-*`/`starting:`. Comme on cible v4 maintenant, ce sont de vrais trous de couverture, pas juste des extras — à prioriser si on veut une couverture v4 complète.
- **`ring`/`shadow` restent simplifiés** (`box-shadow` direct, pas composé) — confirmé en inspectant la vraie sortie v4 : le vrai mécanisme est encore plus complexe qu'imaginé (5 sources de shadow superposées : `--tw-inset-shadow`, `--tw-inset-ring-shadow`, `--tw-ring-offset-shadow`, `--tw-ring-shadow`, `--tw-shadow`). Combiner ring+shadow simultanément sur le même élément ne sera pas fidèle visuellement (cas rare, simplification volontaire assumée).

## Synthèse CSS live (live-style.ts) — ✅ fait

- ~~`dark:` non synthétisé~~ — double émission (`@media (prefers-color-scheme: dark)` ET `:where(.dark, .dark *)`) plutôt que détection de stratégie : marche quelle que soit la stratégie réelle du site, sans heuristique DOM.
- ~~`group-*`, `peer-*`, `aria-*`, `data-*`, `has-*` non synthétisés~~ — tous purement déclaratifs via combinateurs/sélecteurs CSS standards (`.group:hover .classe`, `.peer:hover ~ .classe`, `[aria-checked="true"]`, `:has(...)`, `[data-key="value"]`), pas besoin d'inspecter le DOM.
- ~~Valeurs arbitraires combinées à un modificateur d'opacité~~ — `bg-red-500/80` et `bg-[#ff0000]/50` synthétisés via `color-mix()` ; corrigé aussi côté `class-parser.ts` (sinon l'ancienne classe n'était jamais retirée au changement de couleur).
- ~~Pas de nettoyage des règles injectées~~ — plafond simple (purge des plus anciennes au-delà de 300 règles).
- ~~Transform/filter/backdrop-filter approximatifs~~ — **corrigé pour coller à la vraie sortie compilée Tailwind v4** (vérifié avec `@tailwindcss/cli`, pas deviné) : `rotate`/`scale`/`translate` sont maintenant des propriétés CSS natives séparées (v4 a arrêté de les composer via `transform` comme en v3), seul `skew` reste sur `transform` (formule réduite). Vérifié que `scale-110` + `rotate-45` coexistent bien (propriétés CSS distinctes, `getComputedStyle` confirme les deux + le `transform` matriciel combiné).
- **Thème du site pris en compte automatiquement (v4)** — les classes à jetons nommés (couleurs, radius, blur, taille/poids de police, easing, animation) référencent maintenant `var(--color-red-500, <notre-valeur-par-défaut>)` etc. plutôt qu'une valeur littérale : si le site définit réellement cette variable ailleurs sur la page (vrai thème v4), on hérite automatiquement de SA valeur, sinon on retombe sur notre thème par défaut — pas besoin d'un scan de détection séparé, le fallback CSS natif fait le travail. Idem pour `padding`/`margin`/`gap`/`width`/`height`/`translate` qui multiplient une variable `--spacing` partagée (`calc(var(--spacing, 0.25rem) * N)`) comme le vrai moteur v4.
- **Limite découverte** : si le site configure un préfixe Tailwind (`@import "tailwindcss" prefix(tw)`), v4 préfixe AUSSI les noms de variables (`--tw-color-red-500` au lieu de `--color-red-500`) — notre référence `var(--color-*, ...)` ne matche alors plus rien sur ce site précis, on retombe silencieusement sur notre thème par défaut (dégradation correcte, mais pas de détection de la vraie valeur dans ce cas).

## Accessibilité — ✅ fait

- **Indicateur de contraste WCAG** — pendant l'édition, un badge affiche le ratio texte/fond de l'élément sélectionné (`AA`/`AAA`/✗ selon les seuils WCAG 2.1, texte large pris en compte). Dans les popovers Background/Texte, chaque couleur candidate affiche aussi son ratio en aperçu (comparé à l'AUTRE couleur actuelle de l'élément), avant même de cliquer dessus.
- **Bug découvert et corrigé en vérifiant la fonctionnalité** : `getComputedStyle` ne renormalise plus une couleur `oklch(...)`/`lab(...)` en `rgb(...)` dans les navigateurs récents — or le thème par défaut Tailwind v4 est entièrement en OKLCH. Le badge se serait tu silencieusement pour la quasi-totalité des couleurs. Corrigé en convertissant via un canvas 2D détaché (`fillStyle` + `getImageData`) plutôt qu'en lisant la sérialisation CSSOM.

## Édition / historique

- Pas d'undo/redo. Le mécanisme de `ClassChangeResult { before, after }` existe déjà côté `class-diff.ts` mais n'est pas exploité pour empiler un historique.
- Pas de multi-sélection (éditer plusieurs éléments similaires en même temps, ex. tous les `<li>` d'une liste).
- Pas de réordonnancement/tri manuel des chips de classes actives (ordre = ordre d'apparition dans `className`).
- Édition de classes custom limitée à toggle on/off (pas de rename, pas d'édition de la valeur CSS associée).

## Panneau / UX — ✅ fait (sauf mention contraire)

- ~~Pas de dark/light theme~~ — variables CSS (`--dw-*`), suit `prefers-color-scheme` par défaut, toggle 🌓/☀️/🌙 dans l'en-tête (persisté dans `chrome.storage.local`, appliqué avant le premier rendu pour éviter un flash).
- ~~Pas de raccourcis clavier~~ — `Ctrl/Cmd+F` focus la recherche ; `↑`/`↓` naviguent la liste d'un popover ouvert (`Entrée` pour choisir), désactivés dans un champ texte.
- ~~Pas de "classes récemment utilisées"~~ — dernières valeurs choisies via un picker (pas les valeurs arbitraires), persistées dans `chrome.storage.local`, réappliquables en un clic dans le contexte de variant courant.
- ~~Sélecteur de côté en texte brut~~ — icônes SVG 14×14 (carré plein/côté/coin en surbrillance) pour tous les préfixes multiples (padding/margin/gap/border/rounded/scale/translate/skew), texte en secours pour un préfixe non cartographié.
- ~~Pas d'indicateur de classe non synthétisée~~ — badge ⚠ sur le chip concerné (avec tooltip explicatif) quand `live-style` ne peut pas synthétiser d'effet visuel (variant non géré) ; se nettoie automatiquement si la classe est retirée/remplacée.
- ~~Export limité à "copier les classes"~~ — menu Copier avec un second format JSX (`className="…"`). **Pas fait** : diff avant/après et liste des changements de la session, qui nécessitent un vrai mécanisme d'historique (dépend du point "Pas d'undo/redo" ci-dessus, non traité cette session).

## Picker / sélection d'élément — ✅ fait

- ~~Pas de breadcrumb DOM~~ — fil d'ariane des ancêtres (parent direct → `<body>`, plafonné à 8 niveaux) dans le devpanel, cliquable pour remonter sans re-cliquer sur la page.
- ~~Pas de navigation clavier~~ — flèches (`↑` parent, `↓` premier enfant, `←`/`→` frères) dans le devpanel, désactivées si le focus est dans un champ texte.
- ~~Pas de mode "verrouiller la sélection"~~ — bouton 🔒/🔓 dans l'en-tête : suspend le picking (survol/clic sur la page ignorés, interactions normales possibles) sans perdre la sélection courante ; celle-ci reste modifiable via le fil d'ariane / le clavier pendant le verrouillage.

## Scan CSS — ✅ fait

- ~~Pas de fallback `fetch()` pour les feuilles cross-origin~~ — les feuilles qui lèvent une erreur CSSOM sont récupérées via `fetch(href, {mode:'cors'})` puis parsées dans une `CSSStyleSheet` détachée (plus de restriction cross-origin une fois le texte local) ; celles qui refusent CORS restent listées comme non scannables.
- ~~Pas de re-scan si le site charge du CSS dynamiquement~~ — `MutationObserver` (debounced 300ms) sur l'ajout de `<link rel=stylesheet>`/`<style>`, re-scanne et pousse le résultat à jour à la fenêtre devpanel automatiquement.

## Compatibilité Tailwind — ✅ fait (sauf mention contraire)

- ~~Dataset ciblé Tailwind v3~~ — migré vers Tailwind v4 (`tailwindcss/defaultTheme` + résolveur maison, `resolveConfig` n'existe plus en v4). Couleurs par défaut désormais en OKLCH plutôt qu'en hex.
- ~~Pas de prise en compte d'un thème customisé du site~~ — voir section "Synthèse CSS live" ci-dessus : référencement direct des vraies variables `@theme` v4 avec fallback, plus besoin de scan de détection séparé.
- ~~Option `prefix` de Tailwind non gérée~~ — **partiellement traité**. Détection heuristique d'un préfixe de site (`detectSitePrefix` dans `css-scanner.ts`) affichée en info-bulle dans la section Custom du panneau. Découverte importante en implémentant : la syntaxe du préfixe a changé en v4, ce n'est plus un tiret collé (`tw-bg-red-500` en v3) mais un variant en tête façon `tw:bg-red-500` — du coup une classe préfixée reste déjà reconnue à l'affichage aujourd'hui (le variant en tête ne gêne pas le matching de la base). **Pas encore traité** : remplacer une classe préfixée depuis le panneau (le variant "tw" en tête n'est pas reconnu comme faisant partie du "slot" par `class-diff.ts`, donc l'ancienne classe n'est pas retirée) et synthétiser une classe préfixée avec d'autres variants (`planVariants` dans `live-style.ts` ne reconnaît pas encore le préfixe détecté comme un variant à ignorer).

## Qualité / process

- ~~Dataset content-script alourdi par des champs d'affichage inutiles~~ — `category`/`subcategory` (utilisés seulement par le devpanel pour le regroupement visuel, jamais pour la reconnaissance/synthèse de classes) retirés du JSON embarqué dans le content script via une version allégée dédiée (`tailwind-classes-slim.json`). `content/main.js` passe de ~1,47 Mo à ~929 Ko minifié (~58 Ko gzip).
- Pas de suite de tests automatisés versionnée dans le repo (les vérifications de cette session ont utilisé des scripts Playwright ad hoc dans le scratchpad, jetables) — un `tests/e2e/` avec Playwright + une page de fixture committée serait plus robuste pour éviter les régressions.
- Pas d'icônes custom pour l'extension (Chrome affiche l'icône par défaut) — à faire avant une éventuelle publication.
- Pas de README.
- Pas de CI (lint/build automatique sur push).

## Nouvelles idées (repérées en cours de route)

- **Navigateur de variables de thème** : maintenant qu'on sait que les sites v4 exposent tout leur thème en vraies variables CSS inspectables (`--color-*`, `--radius-*`, `--spacing`...), un petit panneau "Thème détecté sur ce site" (lister les `--color-*`/`--radius-*`/etc. réellement présents sur `:root`) serait un outil de debug utile, indépendant de l'édition de classes elle-même.
- **`--tw-*` (préfixe custom) et variables de thème** : si on va plus loin sur la détection de préfixe (ci-dessus), il faudra aussi reconnaître que les noms de variables eux-mêmes changent (`--tw-color-*`) — la logique de fallback `var()` devra utiliser le préfixe détecté dynamiquement plutôt qu'un nom fixe.
- **Mode Tailwind v3 en option** : vu le virage v4, si jamais un utilisateur édite encore un site v3 pur, le dataset actuel (thème par défaut v4) donnera des couleurs/valeurs légèrement différentes de son thème par défaut v3 réel (rare en pratique, mais un toggle "v3/v4" au build ou un second dataset généré serait possible si le besoin se présente).
- **Détection auto de la stratégie dark réelle du site** au lieu de la double émission systématique — actuellement on émet toujours les deux formes (`@media` + `.dark`), ce qui marche mais pourrait être affiné en observant si `<html>`/`<body>` a une classe `dark` au moment de la sélection, pour prioriser visuellement la bonne règle en cas de conflit avec le vrai CSS du site.
