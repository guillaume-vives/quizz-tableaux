let oeuvres = [];
let modeRevision = false;
let modeCourant = false;  // Ajout d'une variable pour le mode courant
let erreurs = JSON.parse(localStorage.getItem("erreurs")) || [];

document.addEventListener("DOMContentLoaded", () => {
    fetch("data/oeuvres.json")
        .then(res => res.json())
        .then(data => {
            oeuvres = data;
            initQuiz();
        })
        .catch(error => console.error("Erreur lors du chargement des œuvres :", error));

    document.getElementById("mode-normal").addEventListener("click", () => {
        modeRevision = false;
        modeCourant = false;  // Réinitialisation du mode courant
        initQuiz();
    });

    document.getElementById("mode-revision").addEventListener("click", () => {
        modeRevision = true;
        modeCourant = false;  // Réinitialisation du mode courant
        initQuiz();
    });

    document.getElementById("mode-courant").addEventListener("click", () => {  // Ajout du listener pour le mode courant
        modeRevision = false;
        modeCourant = true;  // Activation du mode courant
        initQuiz();
    });

    document.getElementById("reset-errors").addEventListener("click", () => {
        erreurs = [];
        localStorage.setItem("erreurs", JSON.stringify(erreurs));
        alert("Erreurs vidées !");
    });

    document.getElementById("validate").addEventListener("click", validateAnswers);

    // Fermeture de la modale via le bouton
    const modal = document.getElementById("modal");
    document.getElementById("close-modal").addEventListener("click", () => {
        modal.classList.add("hidden");
    });
});

function initQuiz() {
    const paintingsDiv = document.getElementById("paintings");
    paintingsDiv.innerHTML = "";

    let pool = modeRevision
        ? oeuvres.filter(o => erreurs.includes(o.titre))
        : shuffleArray(oeuvres).slice(0, 4);

    let paintersList = [...new Set(pool.map(o => modeCourant ? o.mouvement : o.artiste))];  // Modification pour afficher le courant si le mode est activé
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
        img.alt = o.titre;
        img.addEventListener("click", () => showMetadata(o));
        card.appendChild(img);

        const dropZone = document.createElement("div");
        dropZone.className = "drop-zone";
        dropZone.dataset.answer = modeCourant ? o.mouvement : o.artiste;  // Modification pour afficher le courant si le mode est activé
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
    const droppedElement = document.createElement("div");  // Crée un nouvel élément div
    droppedElement.textContent = data;  // Définit le texte de l'élément
    droppedElement.className = "dropped-painter"; // Ajoute une classe pour le style
    ev.target.appendChild(droppedElement);  // Ajoute l'élément à la zone de drop
}


function validateAnswers() {
    const zones = document.querySelectorAll(".drop-zone");
    zones.forEach(zone => {
        const titreImage = zone.parentElement.querySelector("img").alt;
        const droppedPainterElement = zone.querySelector(".dropped-painter"); // Récupère l'élément déposé
        const droppedPainter = droppedPainterElement ? droppedPainterElement.textContent : ""; // Récupère le texte ou une chaîne vide si pas d'élément
        if (droppedPainter === zone.dataset.answer) {
            zone.classList.add("correct");
            zone.classList.remove("incorrect");
            erreurs = erreurs.filter(e => e !== titreImage);
        } else {
            zone.classList.add("incorrect");
            zone.classList.remove("correct");
            if (!erreurs.includes(titreImage)) {
                erreurs.push(titreImage);
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
        <p><strong>Courant :</strong> ${o.mouvement}</p>
        <p><a href="${o.lien}" target="_blank">Voir la fiche Joconde</a></p>
    `;
    document.getElementById("modal").classList.remove("hidden");
}

function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}
