let oeuvres = [];
let modeRevision = false;
let erreurs = JSON.parse(localStorage.getItem("erreurs")) || [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("data/oeuvres.json")
    .then(res => res.json())
    .then(data => {
      oeuvres = data;
      initQuiz();
    });

  document.getElementById("mode-normal").addEventListener("click", () => {
    modeRevision = false;
    initQuiz();
  });

  document.getElementById("mode-revision").addEventListener("click", () => {
    modeRevision = true;
    initQuiz();
  });

  document.getElementById("reset-errors").addEventListener("click", () => {
    erreurs = [];
    localStorage.setItem("erreurs", JSON.stringify(erreurs));
    alert("Erreurs vidées !");
  });

  document.getElementById("validate").addEventListener("click", validateAnswers);

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden");
  });
});

function initQuiz() {
  const paintingsDiv = document.getElementById("paintings");
  paintingsDiv.innerHTML = "";

  let pool = modeRevision
    ? oeuvres.filter(o => erreurs.includes(o.titre))
    : shuffleArray(oeuvres).slice(0, 4);

  let paintersList = [...new Set(pool.map(o => o.artiste))];
  paintersList = shuffleArray(paintersList);

  const paintersDiv = document.getElementById("painters");
  paintersDiv.innerHTML = "";
  paintersList.forEach(name => {
    const div = document.createElement("div");
    div.className = "painter";
    div.textContent = name;
    div.draggable = true;
    div.addEventListener("dragstart", drag);
    paintersDiv.appendChild(div);
  });

  pool.forEach(o => {
    const card = document.createElement("div");
    card.className = "painting-card";

    const img = document.createElement("img");
    img.src = o.image;
    img.addEventListener("click", () => showMetadata(o));
    card.appendChild(img);

    const dropZone = document.createElement("div");
    dropZone.className = "drop-zone";
    dropZone.dataset.answer = o.artiste;
    dropZone.addEventListener("dragover", allowDrop);
    dropZone.addEventListener("drop", drop);
    card.appendChild(dropZone);

    paintingsDiv.appendChild(card);
  });
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.textContent);
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  ev.target.textContent = data;
}

function validateAnswers() {
  const zones = document.querySelectorAll(".drop-zone");
  zones.forEach(zone => {
    if (zone.textContent === zone.dataset.answer) {
      zone.classList.add("correct");
      zone.classList.remove("incorrect");
      erreurs = erreurs.filter(e => e !== zone.parentElement.querySelector("img").alt);
    } else {
      zone.classList.add("incorrect");
      zone.classList.remove("correct");
      const titre = zone.parentElement.querySelector("img").alt;
      if (!erreurs.includes(titre)) {
        erreurs.push(zone.dataset.answer);
      }
    }
  });
  localStorage.setItem("erreurs", JSON.stringify(erreurs));
}

function showMetadata(o) {
  const metaDiv = document.getElementById("metadata");
  metaDiv.innerHTML = `
    <h2>${o.titre}</h2>
    <p><strong>Artiste :</strong> ${o.artiste}</p>
    <p><strong>Année :</strong> ${o.annee}</p>
    <p><strong>Courant :</strong> ${o.courant}</p>
    <p><a href="${o.lien}" target="_blank">Voir la fiche Joconde</a></p>
  `;
  document.getElementById("modal").classList.remove("hidden");
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
