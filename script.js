// Fonctions utilitaires d'abord
function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Variables globales
let oeuvres = [];
let modeRevision = false;
let erreurs = [];

// Fonction principale - point d'entrée
function init() {
    console.log("Initialisation du quiz...");
    
    // Charger les erreurs depuis localStorage
    try {
        erreurs = JSON.parse(localStorage.getItem("erreurs")) || [];
    } catch (e) {
        console.error("Erreur lors du chargement des erreurs:", e);
        erreurs = [];
    }

    // Vérifier que les éléments HTML existent
    const paintingsDiv = document.getElementById("paintings");
    if (!paintingsDiv) {
        console.error("Element #paintings non trouvé!");
        return;
    }
    
    const modeNormalBtn = document.getElementById("mode-normal");
    const modeRevisionBtn = document.getElementById("mode-revision");
    const resetErrorsBtn = document.getElementById("reset-errors");
    const validateBtn = document.getElementById("validate");
    const modal = document.getElementById("modal");
    const closeModalBtn = document.getElementById("close-modal");
    
    if (!modeNormalBtn || !modeRevisionBtn || !resetErrorsBtn || !validateBtn || !modal || !closeModalBtn) {
        console.error("Un ou plusieurs éléments de contrôle sont manquants!");
        return;
    }
    
    // Ajout des écouteurs d'événements
    modeNormalBtn.addEventListener("click", () => {
        modeRevision = false;
        initQuiz();
    });
    
    modeRevisionBtn.addEventListener("click", () => {
        modeRevision = true;
        initQuiz();
    });
    
    resetErrorsBtn.addEventListener("click", () => {
        erreurs = [];
        localStorage.setItem("erreurs", JSON.stringify(erreurs));
        alert("Erreurs vidées !");
    });
    
    validateBtn.addEventListener("click", validateAnswers);
    
    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
    
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
    
    // Chargement des données
    loadData();
}

// Chargement des données
function loadData() {
    const paintingsDiv = document.getElementById("paintings");
    paintingsDiv.innerHTML = "<p>Chargement des œuvres...</p>";
    
    fetch("data/oeuvres.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement du fichier JSON. Status: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${data.length} œuvres chargées avec succès`);
            oeuvres = data;
            initQuiz();
        })
        .catch(error => {
            console.error("Erreur:", error);
            paintingsDiv.innerHTML = `<div class="error">
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
                <p>Vérifiez que le fichier data/oeuvres.json existe et est accessible.</p>
            </div>`;
        });
}

// Initialisation du quiz
function initQuiz() {
    console.log("Initialisation du quiz...");
    const paintingsDiv = document.getElementById("paintings");
    if (!paintingsDiv) {
        console.error("Element #paintings non trouvé lors de l'initialisation du quiz!");
        return;
    }
    
    paintingsDiv.innerHTML = "";
    
    if (!oeuvres || oeuvres.length === 0) {
        paintingsDiv.innerHTML = "<p>Aucune œuvre n'a été chargée</p>";
        return;
    }
    
    // Sélection des œuvres à afficher
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
    
    console.log(`${pool.length} œuvres sélectionnées pour le quiz`);
    
    // Extraction des listes d'artistes et de courants
    let artistesList = [...new Set(pool.map(o => o.artiste))];
    let courantsList = [...new Set(pool.map(o => o.mouvement))];
    artistesList = shuffleArray([...artistesList]);
    courantsList = shuffleArray([...courantsList]);
    
    // Création des cartes
    pool.forEach(oeuvre => {
        const card = createPaintingCard(oeuvre, artistesList, courantsList);
        paintingsDiv.appendChild(card);
    });
}

// Création d'une carte de tableau
function createPaintingCard(oeuvre, artistesList, courantsList) {
    const card = document.createElement("div");
    card.className = "painting-card";
    
    // Image
    const img = document.createElement("img");
    img.src = oeuvre.image;
    img.alt = oeuvre.titre;
    img.style.cursor = "pointer";
    img.addEventListener("click", () => openFullscreen(img));
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
    dropArtiste.addEventListener("drop", drop);
    card.appendChild(dropCourant);
    
    // Zone de drag and drop
    const dragZone = document.createElement("div");
    dragZone.className = "drag-items";
    const items = shuffleArray([
        ...artistesList.map(a => ({ type: "artiste", value: a })),
        ...courantsList.map(c => ({ type: "courant", value: a }))
    ]);
    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "painter " + item.type;
        div.textContent = item.value;
        div.draggable = true;
        div.dataset.type = item.type;
        div.addEventListener("dragstart", drag);
        dragZone.appendChild(div);
    });
    card.appendChild(dragZone);
    
    return card;
}

// Fonctions de gestion du drag and drop
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
    
    const droppedElement = document.createElement("div");
    droppedElement.textContent = data;
    droppedElement.className = "dropped-painter";
    droppedElement.addEventListener("click", function() {
        dropZone.removeChild(droppedElement);
    });
    dropZone.appendChild(droppedElement);
    
    document.querySelectorAll(".dragging").forEach(el => {
        el.classList.remove("dragging");
    });
}

// Afficher la métadonnée d'une œuvre
function showMetadata(oeuvre) {
    const metaDiv = document.getElementById("metadata");
    metaDiv.innerHTML = `
        <h2>${oeuvre.titre}</h2>
        <p><strong>Artiste :</strong> ${oeuvre.artiste}</p>
        <p><strong>Année :</strong> ${oeuvre.annee}</p>
        <p><strong>Courant :</strong> ${oeuvre.mouvement}</p>
        <p><a href="${oeuvre.lien}" target="_blank">Voir la fiche</a></p>
    `;
    document.getElementById("modal").classList.remove("hidden");
}

// Ouvrir l'image en plein écran
function openFullscreen(img) {
    if (img.requestFullscreen) {
        img.requestFullscreen();
    } else if (img.webkitRequestFullscreen) { /* Safari */
        img.webkitRequestFullscreen();
    } else if (img.msRequestFullscreen) { /* IE11 */
        img.msRequestFullscreen();
    }
}

// Validation des réponses
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

// Attendre que le DOM soit complètement chargé avant d'initialiser
document.addEventListener("DOMContentLoaded", init);
