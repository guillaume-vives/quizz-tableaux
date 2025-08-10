const fs = require('fs');

// Charger le fichier que tu as téléchargé
const raw = JSON.parse(fs.readFileSync('extrait_200_oeuvres_via_url.json', 'utf8'));

const results = [];

raw.records.forEach(r => {
  const f = r.fields;

  if (f.image && f.image.length > 0) {
    results.push({
      titre: f.titre || "Titre inconnu",
      artiste: f.auteur || "Artiste inconnu",
      annee: f.date || "Date inconnue",
      courant: f.epoque_style_mouvement || "Courant inconnu",
      image: Array.isArray(f.image) ? f.image[0] : f.image,
      lien: f.url_referent || ""
    });
  }
});

fs.writeFileSync('oeuvres_200.json', JSON.stringify(results, null, 2), 'utf8');
console.log(`✅ Fichier oeuvres_200.json créé avec ${results.length} œuvres`);
