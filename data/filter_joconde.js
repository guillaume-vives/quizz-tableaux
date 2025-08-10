const fs = require('fs');
const { chain }  = require('stream-chain');
const { parser } = require('stream-json');
const { pick }   = require('stream-json/filters/Pick');
const { streamArray } = require('stream-json/streamers/StreamArray');

const pipeline = chain([
  fs.createReadStream('base-joconde.json'),
  parser(),
  pick({ filter: 'records' }),
  streamArray(),
]);

const results = [];

pipeline.on('data', ({ value }) => {
  const f = value.fields;

  // Vérification + normalisation
  const domaineStr = Array.isArray(f.domaine) ? f.domaine.join(' ').toLowerCase() :
                     (f.domaine || '').toLowerCase();

  if (domaineStr.includes('peinture') && f.image && f.image.length > 0) {
    results.push({
      titre: f.titre,
      artiste: f.auteur,
      annee: f.date,
      courant: f.epoque_style_mouvement,
      image: f.image,
      lien: f.url_referent || value.recordid
    });
    console.log(`Ajouté: ${f.titre} (${f.auteur})`); // log debug
  }

  if (results.length >= 200) {
    fs.writeFileSync('oeuvres_200.json', JSON.stringify(results, null, 2));
    console.log("✅ Fichier généré avec 200 œuvres");
    process.exit();
  }
});

pipeline.on('end', () => {
  console.log(`Fin du fichier. ${results.length} œuvres trouvées.`);
  if (results.length > 0) {
    fs.writeFileSync('oeuvres_200.json', JSON.stringify(results, null, 2));
    console.log("✅ Fichier sauvegardé avec moins de 200 œuvres");
  }
});
