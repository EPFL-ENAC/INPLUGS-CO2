# Project next time

---

### 👩‍💻 **Responsabilités – Eleni**

- [ ] Cacher les pages concernant SPHINCS en attendant la mise à jour du texte
- [ ] Mettre à jour elle-même le texte de SPHINCS dans une branche/fork (à faire avant mi-novembre)
- [ ] Travailler sur le texte de la page **About**
- [ ] Modifier le texte après réception des données (prévu pour mi-novembre)

---

### 👩‍🎨 **Animations – Priorités & Corrections**

> ⚠️ Pierre se concentre sur la complétion de **l'animation dans son intégralité** plutôt que sur une version en boucle.

#### Animation 0 :

- [ ] Afficher uniquement le titre : _“How does GCS work?”_

#### Animation 3 :

- [ ] Supprimer les flèches et le triangle bleu
- [ ] Éviter que les bulles de CO₂ soient collées au caprock

#### Animation 4 :

- [ ] Afficher uniquement les flèches (pas d’animation)
- [ ] Ajouter le triangle bleu
- [ ] Limite supérieure = caprock (ne pas visualiser le caprock lui-même)

#### Animation 5 :

- [ ] Faire apparaître la ceinture orange du caprock

> ✅ **Note :** La différence entre les étapes 3 et 4 est l’apparition de la zone triangulaire bleue à l’étape 4

---

### 🏠 **Page d’accueil**

- [ ] Corriger les flèches qui remontent vers le caprock

---

### 🌍 **Page "GCS in the World"**

- [ ] Clarifier le fonctionnement des tooltips (survol de la carte)
- [ ] Définir ce que représentent les données suivantes :
  - [ ] **Storage capacity** : échelle 0 – 10 ?
  - [ ] **Existing GCS sites** : échelle 0 – 50 ?
  - [ ] **Planned projects and capacity 2030** : deux jeux de données ? Fusionner ?

---

### 🗓️ **Planning & Livraison**

- [ ] Version déployée fin septembre **sans les données**
- [ ] Textes incomplets tolérés pour fin septembre
- [ ] Mise à jour du texte par Eleni prévue pour **mi-novembre**

# Project CODE TODO List

## PLugin asset management

- [x] Asset management should be logically following the readme
      not weird stuff like /styles or public/js in assets
      this.patterns = {
      css: options.cssPattern || join(this.srcDir, "styles", "\*_", "_.css"),
      js: options.jsPattern || "public/js/_.js",
      images:
      options.imagePattern ||
      join(this.srcDir, "assets", "_.{svg,png,jpg,jpeg,webp,gif}"),
      };
- [ ] Add node dependencies in module!
- [ ] Okay, we need to verify json validity in plugin to display feedback to user!

## Site Structure & Navigation

- [ ] Review and optimize site navigation flow
- [ ] Ensure consistent navbar implementation across all pages
- [ ] Verify footer content is up-to-date and consistent

## Page Content

- [ ] Audit all page content for accuracy and completeness
- [ ] Check language consistency between EN/FR versions
- [ ] Update meta descriptions and SEO elements

## Styling & UI

- [ ] Review CSS for unused or redundant styles
- [ ] Ensure responsive design works across all device sizes
- [ ] Check color scheme consistency with design tokens
- [ ] Optimize font loading and performance

## Performance Optimization

- [ ] Audit image sizes and formats (WebP conversion)
- [ ] Minify CSS and JavaScript assets
- [ ] Implement proper caching strategies
- [ ] Run Lighthouse tests and address issues

## JavaScript Functionality

- [ ] Review and optimize existing JS files
- [ ] Ensure progressive enhancement principles
- [ ] Add error handling where missing

## Accessibility

- [ ] Run accessibility audit
- [ ] Ensure proper semantic HTML
- [ ] Check color contrast ratios
- [ ] Verify keyboard navigation

## Build & Deployment

- [ ] Review build process efficiency
- [ ] Check Docker configuration
- [ ] Validate nginx configuration
  - [ ] focus on app.mydomain.com and host name
- [ ] Test deployment process
- [ ] redirect html (index.html) don't take into account the port when redirecting to fr or en (maybe find a better nginx ? trick ?)

## Documentation

- [ ] Update README with latest project info
- [ ] Document build process
- [ ] Add comments to complex code sections

## Quentin

- [ ] positionner les cartes de la page about
- [ ] ajouter la section funding de la page about
