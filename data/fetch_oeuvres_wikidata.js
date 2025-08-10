const fetch = require('node-fetch');
const fs = require('fs');

const LIMIT = 50;
const MAX_RETRIES = 3;
const DELAY_MS = 5000;
const MAX_PER_MOVEMENT = 1000;

const mouvements = [
  { qid: "Q34636", nom: "Art nouveau" },
  { qid: "Q37853", nom: "baroque" },
  { qid: "Q128115", nom: "art abstrait" },
  { qid: "Q37068", nom: "romantisme" },
  { qid: "Q40415", nom: "impressionnisme" },
  { qid: "Q186030", nom: "art contemporain" },
  { qid: "Q3408764", nom: "Pré-Code" },
  { qid: "Q189458", nom: "académisme" },
  { qid: "Q10857409", nom: "réalisme" },
  { qid: "Q80113", nom: "expressionnisme" },
  { qid: "Q39427", nom: "surréalisme" },
  { qid: "Q10822316", nom: "art concret" },
  { qid: "Q14378", nom: "néo-classicisme" },
  { qid: "Q131808", nom: "maniérisme" },
  { qid: "Q164800", nom: "symbolisme" },
  { qid: "Q177725", nom: "expressionnisme abstrait" },
  { qid: "Q610687", nom: "École vénitienne" },
  { qid: "Q184814", nom: "préraphaélisme" },
  { qid: "Q134147", nom: "pop art" },
  { qid: "Q4692", nom: "Renaissance" },
  { qid: "Q170292", nom: "classicisme" },
  { qid: "Q1125039", nom: "romantisme tardif" },
  { qid: "Q166713", nom: "postimpressionnisme" },
  { qid: "Q42934", nom: "cubisme" },
  { qid: "Q173782", nom: "Art déco" },
  { qid: "Q878985", nom: "modernisme" },
  { qid: "Q281108", nom: "art naïf" },
  { qid: "Q203209", nom: "art conceptuel" },
  { qid: "Q180902", nom: "réalisme socialiste" },
  { qid: "Q154432", nom: "Biedermeier" },
  { qid: "Q843393", nom: "Mail-Art" },
  { qid: "Q12272944", nom: "école d'art de Bansko" },
  { qid: "Q829895", nom: "Renaissance de Harlem" },
  { qid: "Q1378978", nom: "École crétoise" },
  { qid: "Q166593", nom: "fauvisme" },
  { qid: "Q3505455", nom: "surréalisme belge" },
  { qid: "Q273495", nom: "École de Nancy" },
  { qid: "Q1246516", nom: "art féministe" },
  { qid: "Q47783", nom: "postmodernisme" },
  { qid: "Q131221", nom: "futurisme" },
  { qid: "Q943853", nom: "Hudson River School" },
  { qid: "Q207103", nom: "constructivisme" }
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBatch(mouvementQid, offset, retries = 0) {
  const query = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?paintingLabel ?image ?authorLabel ?dateCreation WHERE {
  ?painting wdt:P31 wd:Q3305213.
  ?painting wdt:P18 ?image.
  ?painting wdt:P571 ?dateCreation.
  ?painting wdt:P135 wd:${mouvementQid}.
  FILTER(year(?dateCreation) >= 1600 && year(?dateCreation) <= 2000)
  OPTIONAL { ?painting wdt:P170 ?author. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
LIMIT ${LIMIT}
OFFSET ${offset}
`;

  const url = 'https://query.wikidata.org/sparql';
  const params = new URLSearchParams({ query });
  const headers = { 'Accept': 'application/sparql-results+json' };

  try {
    const response = await fetch(url + '?' + params.toString(), { headers });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();
    return data.results.bindings;
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.warn(`Erreur ${err.message}, tentative de retry ${retries + 1} après pause...`);
      await delay(DELAY_MS);
      return fetchBatch(mouvementQid, offset, retries + 1);
    } else {
      throw err;
    }
  }
}

(async () => {
  let allOeuvres = [];

  for (let mouv of mouvements) {
    console.log(`\n>>> Traitement mouvement ${mouv.nom} (${mouv.qid})`);

    let offset = 0;
    let count = 0;

    while (count < MAX_PER_MOVEMENT) {
      console.log(`  fetch offset ${offset}...`);
      let results;
      try {
        results = await fetchBatch(mouv.qid, offset);
      } catch (e) {
        console.error(`Erreur pour ${mouv.nom} :`, e.message);
        break;
      }

      if (results.length === 0) break;

      const oeuvresBatch = results.map(item => ({
        titre: item.paintingLabel?.value || "Sans titre",
        artiste: item.authorLabel ? item.authorLabel.value : "Inconnu",
        annee: item.dateCreation?.value?.slice(0, 4) || "Inconnue",
        image: item.image?.value || "",
        lien: item.painting?.value || "",
        mouvement: mouv.nom
      }));

      allOeuvres = allOeuvres.concat(oeuvresBatch);
      count += results.length;
      offset += LIMIT;

      if (count >= MAX_PER_MOVEMENT) break;

      await delay(DELAY_MS);
    }
    console.log(`  fetched: ${count} œuvres pour ${mouv.nom}`);
  }

  fs.writeFileSync('oeuvres.json', JSON.stringify(allOeuvres, null, 2), 'utf-8');
  console.log(`✅ Fichier oeuvres.json créé avec ${allOeuvres.length} œuvres.`);
})();
