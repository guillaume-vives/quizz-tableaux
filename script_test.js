"use strict";

let modeRevision = false;
let erreurs = [];
let oeuvres = []; // Ajout de la variable globale

function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function handleDragEnter(ev) {
    ev.preventDefault();
    if (ev.target.classList.contains("drop-zone")) {
        ev.target.classList.add("dragover");
    }
}

function handleDragLeave(ev) {
    ev.preventDefault();
    if (ev.target.classList.contains("drop-zone")) {
        ev.target.classList.remove("dragover");
    }
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.textContent);
    ev.dataTransfer.setData("type", ev.target.dataset.type);
    ev.target.classList.add("dragging");
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const type = ev.dataTransfer.getData("type");
    const dropZone = ev.target.classList.contains("drop-zone") ? ev.target : ev.target.closest(".drop-zone");
    if (!dropZone) return;

    // Vérifie le type
    if (dropZone.dataset.type !== type) return;

    // Empêche deux drag and drop sur la même case
    if (dropZone.querySelector(".dropped-painter")) return;

    dropZone.classList.remove("dragover");

    // Supprimer le texte par défaut
    dropZone.textContent = "";

    const droppedElement = document.createElement("div");
    droppedElement.textContent = data;
    droppedElement.className = "dropped-painter";
    droppedElement.addEventListener("click", function() {
        dropZone.removeChild(droppedElement);
         // Restaurer le texte par défaut
        dropZone.textContent = dropZone.dataset.type === "artiste" ? "Artiste" : "Courant";
    });
    dropZone.appendChild(droppedElement);

    document.querySelectorAll(".dragging").forEach(el => {
        el.classList.remove("dragging");
    });
}

function showMetadata(oeuvre) {
    const metaDiv = document.getElementById("metadata");
    // Générer le lien Wikipedia basé sur le titre de l'oeuvre et l'artiste
    const wikiSearch = encodeURIComponent(`${oeuvre.titre} ${oeuvre.artiste} peinture`);
    const wikiLink = `https://fr.wikipedia.org/wiki/Special:Search?search=${wikiSearch}`;

    metaDiv.innerHTML = `
        <h2>${oeuvre.titre}</h2>
        <p><strong>Artiste :</strong> ${oeuvre.artiste}</p>
        <p><strong>Année :</strong> ${oeuvre.annee}</p>
        <p><strong>Courant :</strong> ${oeuvre.mouvement}</p>
        <div class="links-container">
            <p><a href="${oeuvre.lien}" target="_blank">Voir la fiche originale</a></p>
            <p><a href="${wikiLink}" target="_blank">Rechercher sur Wikipédia</a></p>
        </div>
    `;
    document.getElementById("modal").classList.remove("hidden");
}

function showZoomableImage(imageSrc, title) {
    // Créer un conteneur modal pour l'image
    const modal = document.createElement("div");
    modal.className = "image-modal";

    // Créer le conteneur pour l'image zoomable
    const imageContainer = document.createElement("div");
    imageContainer.className = "zoomable-image-container";

    // Créer l'image
    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = title;
    img.className = "zoomable-image";

    // Ajouter des contrôles de zoom
    const zoomControls = document.createElement("div");
    zoomControls.className = "zoom-controls";

    const zoomInBtn = document.createElement("button");
    zoomInBtn.innerHTML = "+";
    zoomInBtn.title = "Zoom in";

    const zoomOutBtn = document.innerHTML = "-";
    zoomOutBtn.title = "Zoom out";

    const resetZoomBtn = document.innerHTML = "&#x1f5d8;"; // symbole reset
    resetZoomBtn.title = "Reset zoom";

    const closeBtn = document.innerHTML = "×";
    closeBtn.className = "close-modal-btn";

    // Ajouter un titre
    const titleElem = document.createElement("h3");
    titleElem.textContent = title;

    // Assembler les éléments
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(resetZoomBtn);

    imageContainer.appendChild(img);
    modal.appendChild(closeBtn);
    modal.appendChild(titleElem);
    imageContainer.appendChild(img);
    modal.appendChild(closeBtn);
    modal.appendChild(titleElem);
    modal.appendChild(imageContainer);
    modal.appendChild(zoomControls);

    document.body.appendChild(modal);

    // Variables pour le zoom et le déplacement
    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };

    // Fonction pour appliquer la transformation
    function setTransform() {
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    // Event listeners pour le zoom
    zoomInBtn.addEventListener("click", function() {
        scale += 0.1;
        setTransform();
    });

    zoomOutBtn.addEventListener("click", function() {
        scale = Math.max(0.5, scale - 0.1);
        setTransform();
    });

    resetZoomBtn.addEventListener("click", function() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        setTransform();
    });

    // Event listeners pour le déplacement de l'image
    img.addEventListener('mousedown', function(e) {
        e.preventDefault();
        start = { x: e.clientX - pointX, y: e.clientY - pointY };
        panning = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!panning) return;
        pointX = (e.clientX - start.x);
        pointY = (e.clientY - start.y);
        setTransform();
    });

    document.addEventListener('mouseup', function(e) {
        panning = false;
    });

    // Support pour le pinch zoom sur mobile
    let evCache = new Array();
    let prevDiff = -1;

    img.addEventListener('touchstart', function(e) {
        for (let i = 0; i < e.touches.length; i++) {
            evCache.push(e.touches[i]);
        }
    });

    img.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
            // Pinch zoom
            let curDiff = Math.abs(e.touches[0].clientX - e.touches[1].clientX);

            if (prevDiff > 0) {
                if (curDiff > prevDiff) {
                    // Les doigts s'écartent, zoom in
                    scale += 0.02;
                    setTransform();
                }
                if (curDiff < prevDiff) {
                    // Les doigts se rapprochent, zoom out
                    scale = Math.max(0.5, scale - 0.02);
                    setTransform();
                }
            }

            prevDiff = curDiff;
        } else if (e.touches.length === 1) {
            // Déplacement avec un doigt
            pointX = e.touches[0].clientX - start.x;
            pointY = e.touches[0].clientY - start.y;
            setTransform();
        }
    });

    img.addEventListener('touchend', function(e) {
        evCache = [];
        prevDiff = -1;
    });

    // Fermer le modal
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    document.body.appendChild(modal);
}


function createPaintingCard(oeuvre) {
    const card = document.createElement("div");
    card.className = "painting-card";

    // Image
    const img = document.createElement("img");
    img.src = oeuvre.image;
    img.alt = oeuvre.titre;
    img.style.cursor = "pointer";
    img.addEventListener("click", () => showZoomableImage(oeuvre.image, oeuvre.titre));
    card.appendChild(img);

    // Bouton d'info
    const infoBtn = document.createElement("button");
    infoBtn.textContent = "Infos";
    infoBtn.className = "info-btn";
    infoBtn.addEventListener("click", () => showMetadata(oeuvre));
    card.appendChild(infoBtn);

    // Titre
    const title = document.createElement("div");
    title.className = "painting-title";
    title.textContent = oeuvre.titre;
    card.appendChild(title);

    // Zone de drop pour l'artiste
    const dropArtiste = document.createElement("div");
    dropArtiste.className = "drop-zone artiste";
    dropArtiste.dataset.answer = oeuvre.artiste;
    dropArtiste.dataset.type = "artiste";
    dropArtiste.textContent = "Artiste";
    dropArtiste.addEventListener("dragover", allowDrop);
    dropArtiste.addEventListener("dragenter", handleDragEnter);
    dropArtiste.addEventListener("dragleave", handleDragLeave);
    dropArtiste.addEventListener("drop", drop);
    card.appendChild(dropArtiste);

    // Zone de drop pour le courant
    const dropCourant = document.createElement("div");
    dropCourant.className = "drop-zone courant";
    dropCourant.dataset.answer = oeuvre.mouvement;
    dropCourant.dataset.type = "courant";
    dropCourant.textContent = "Courant";
    dropCourant.addEventListener("dragover", allowDrop);
    dropCourant.addEventListener("dragenter", handleDragEnter);
    dropCourant.addEventListener("dragleave", handleDragLeave);
    dropCourant.addEventListener("drop", drop);
    card.appendChild(dropCourant);

    return card;
}

function initQuiz() {
    console.log("Initialisation du quiz...");
    const paintingsDiv = document.getElementById("paintings");
    paintingsDiv.innerHTML = "";

    const tableauxSection = document.createElement("div");
    tableauxSection.id = "tableaux-section";
    tableauxSection.className = "tableaux-section";

    paintingsDiv.appendChild(tableauxSection);

    let pool;
    if (modeRevision) {
        pool = oeuvres.filter(o => erreurs.includes(o.titre));
        if (pool.length === 0) {
            alert("Aucune erreur à réviser pour le moment!");
            modeRevision = false;
            pool = shuffleArray([...oeuvres]).slice(0, 4);
        }
    } else {
        pool = shuffleArray([...oeuvres]).slice(0, 4);
    }

    if (!pool || pool.length === 0) {
        tableauxSection.innerHTML = "<p>Aucune œuvre n'a été chargée</p>";
        return;
    }

    console.log(`${pool.length} œuvres sélectionnées pour le quiz`);

    let artistesList = [...new Set(pool.map(o => o.artiste))];
    let courantsList = [...new Set(pool.map(o => o.mouvement))];

    pool.forEach(oeuvre => {
        const card = createPaintingCard(oeuvre);
        tableauxSection.appendChild(card);
    });

    const artistesContainer = document.getElementById("artistes-container");
    artistesContainer.innerHTML = "<h3>Artistes</h3>";

    const courantsContainer = document.getElementById("courants-container");
    courantsContainer.innerHTML = "<h3>Courants artistiques</h3>";

    shuffleArray([...artistesList]).forEach(artiste => {
        const div = document.createElement("div");
        div.className = "option-item artiste";
        div.textContent = artiste;
        div.draggable = true;
        div.dataset.type = "artiste";
        div.addEventListener("dragstart", drag);
        artistesContainer.appendChild(div);
    });

    shuffleArray([...courantsList]).forEach(courant => {
        const div = document.createElement("div");
        div.className = "option-item courant";
        div.textContent = courant;
        div.draggable = true;
        div.dataset.type = "courant";
        div.addEventListener("dragstart", drag);
        courantsContainer.appendChild(div);
    });
}

function loadData() {
    const quizContainer = document.getElementById("quiz-container");
    fetch("data/oeuvres.json") // Assurez-vous que le chemin est correct pour ce fichier
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement du fichier JSON. Status: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${data.length} œuvres chargées avec succès`);
            oeuvres = data; // Stocker les données dans la variable oeuvres
            initQuiz(); // Appeler initQuiz après le chargement des données
        })
        .catch(error => {
            console.error("Erreur:", error);
            quizContainer.innerHTML = `<p>Erreur de chargement des données.</p>`; // Afficher un message d'erreur simple
        });
}

function validateAnswers() {
    const cards = document.querySelectorAll(".painting-card");
    let totalCorrect = 0;
    let total = 0;
    
    cards.forEach(card => {
        const titreImage = card.querySelector("img").alt;
        const dropArtiste = card.querySelector(".drop-zone.artiste");
        const dropCourant = card.querySelector(".drop-zone.courant");
        
        const droppedArtiste = dropArtiste.querySelector(".dropped-painter");
        const droppedCourant = dropCourant.querySelector(".dropped-painter");
        
        let correct = true;
        
        // Vérifie artiste
        total++;
        if (droppedArtiste && droppedArtiste.textContent === dropArtiste.dataset.answer) {
            dropArtiste.classList.add("correct");
            dropArtiste.classList.remove("incorrect");
            totalCorrect++;
        } else {
            dropArtiste.classList.add("incorrect");
            dropArtiste.classList.remove("correct");
            correct = false;
            if (droppedArtiste) {
                droppedArtiste.textContent += ` ✗ (${dropArtiste.dataset.answer})`;
            } else {
                const correctAnswer = document.createElement("div");
                correctAnswer.className = "dropped-painter correct-answer";
                correctAnswer.textContent = `Réponse: ${dropArtiste.dataset.answer}`;
                dropArtiste.appendChild(correctAnswer);
            }
        }
        
        // Vérifie courant
        total++;
        if (droppedCourant && droppedCourant.textContent === dropCourant.dataset.answer) {
            dropCourant.classList.add("correct");
            dropCourant.classList.remove("incorrect");
            totalCorrect++;
        } else {
            dropCourant.classList.add("incorrect");
            dropCourant.classList.remove("correct");
            correct = false;
            if (droppedCourant) {
                droppedCourant.textContent += ` ✗ (${dropCourant.dataset.answer})`;
            } else {
                const correctAnswer = document.createElement("div");
                correctAnswer.className = "dropped-painter correct-answer";
                correctAnswer.textContent = `Réponse: ${dropCourant.dataset.answer}`;
                dropCourant.appendChild(correctAnswer);
            }
        }
        
        // Gestion des erreurs pour le mode révision
        if (!correct && !erreurs.includes(titreImage)) {
            erreurs.push(titreImage);
        }
        if (correct) {
            erreurs = erreurs.filter(e => e !== titreImage);
        }
    });
    
    localStorage.setItem("erreurs", JSON.stringify(erreurs));
    
    if (totalCorrect === total) {
        alert("Parfait ! Toutes les réponses sont correctes !");
    } else {
        alert(`Vous avez ${totalCorrect} réponse(s) correcte(s) sur ${total}.`);
    }
}

const modeNormalBtn = document.getElementById("mode-normal");
const modeRevisionBtn = document.getElementById("mode-revision");
const resetErrorsBtn = document.getElementById("reset-errors");
const validateBtn = document.getElementById("validate");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("close-modal");

modeNormalBtn.addEventListener("click", () => { modeRevision = false; initQuiz(); });
modeRevisionBtn.addEventListener("click", () => { modeRevision = true; initQuiz(); });
resetErrorsBtn.addEventListener("click", () => { erreurs = []; localStorage.setItem("erreurs", JSON.stringify(erreurs)); alert("Erreurs vidées !"); });
validateBtn.addEventListener("click", validateAnswers);
closeModalBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Ajout de cette ligne
    modal.classList.add("hidden");
});
modal.addEventListener("click", (e) => {
    e.stopPropagation(); // Ajout de cette ligne
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", loadData);
