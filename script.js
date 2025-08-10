let oeuvres = [];
let modeRevision = false;
let modeCourant = false;  // Variable pour le mode courant
let erreurs = JSON.parse(localStorage.getItem("erreurs")) || [];

document.addEventListener("DOMContentLoaded", () => {
    fetch("data/oeuvres.json")
        .then(res => res.json())
        .then(data => {
            console.log("Données chargées:", data);
            oeuvres = data;
            initQuiz();
        })
        .catch(error => console.error("Erreur lors du chargement des œuvres :", error));

    document.getElementById("mode-normal").addEventListener("click", () => {
        modeRevision = false;
        modeCourant = false;
        initQuiz();
    });

    document.getElementById("mode-revision").addEventListener("click", () => {
        modeRevision = true;
        modeCourant = false;
        initQuiz();
    });

    document.getElementById("mode-courant").addEventListener("click", () => {
        modeRevision = false;
        modeCourant = true;
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

    // Fermeture de la modale en cliquant en dehors du contenu
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
});

function initQuiz() {
    const paintingsDiv = document.getElementById("paintings");
    paintingsDiv.innerHTML = "";

    // Vérifier que les oeuvres sont bien chargées
    if (!oeuvres || oeuvres.length === 0) {
        console.error("Aucune œuvre n'a été chargée");
        return;
    }

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

    // Vérifier que les mouvements sont bien définis
    pool.forEach(o => {
        if (!o.mouvement) {
            console.error("Mouvement manquant pour", o.titre);
        }
    });

    // Déterminer ce qui doit être associé en fonction du mode
    const associationProperty = modeCourant ? 'mouvement' : 'artiste';
    let paintersList = [...new Set(pool.map(o => o[associationProperty]))];
    paintersList = shuffleArray([...paintersList]);

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

        const title = document.createElement("div");
        title.className = "painting-title";
        title.textContent = o.titre;
        card.appendChild(title);

        const dropZone = document.createElement("div");
        dropZone.className = "drop-zone";
        dropZone.dataset.answer = o[associationProperty];
        dropZone.addEventListener("dragover", allowDrop);
        dropZone.addEventListener("dragenter", handleDragEnter);
        dropZone.addEventListener("dragleave", handleDragLeave);
        dropZone.addEventListener("drop", drop);
        card.appendChild(dropZone);

        paintingsDiv.appendChild(card);
    });
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

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.textContent);
    ev.target.classList.add("dragging");
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    
    // S'assurer que nous avons la zone de drop correcte
    const dropZone = ev.target.classList.contains("drop-zone") ? 
                     ev.target : 
                     ev.target.closest(".drop-zone");
    
    if (!dropZone) return;
    
    // Enlever la classe dragover
    dropZone.classList.remove("dragover");
    
    // Vérifier si la zone a déjà un élément
    const existingPainter = dropZone.querySelector(".dropped-painter");
    if (existingPainter) {
        dropZone.removeChild(existingPainter);
    }

    const droppedElement = document.createElement("div");
    droppedElement.textContent = data;
    droppedElement.className = "dropped-painter";
    dropZone.appendChild(droppedElement);
    
    // Supprimer la classe dragging de tous les éléments
    document.querySelectorAll(".dragging").forEach(el => {
        el.classList.remove("dragging");
    });
}

function validateAnswers() {
    const zones = document.querySelectorAll(".drop-zone");
    let totalCorrect = 0;
    
    zones.forEach(zone => {
        const titreImage = zone.parentElement.querySelector("img").alt;
        const droppedPainterElement = zone.querySelector(".dropped-painter");
        const droppedPainter = droppedPainterElement ? droppedPainterElement.textContent : "";
        
        if (droppedPainter === zone.dataset.answer) {
            zone.classList.add("correct");
            zone.classList.remove("incorrect");
            erreurs = erreurs.filter(e => e !== titreImage);
            totalCorrect++;
        } else {
            zone.classList.add("incorrect");
            zone.classList.remove("correct");
            if (!erreurs.includes(titreImage)) {
                erreurs.push(titreImage);
            }
            
            // Afficher la réponse correcte
            if (droppedPainterElement) {
                droppedPainterElement.textContent += ` ✗ (${zone.dataset.answer})`;
            } else {
                const correctAnswer = document.createElement("div");
                correctAnswer.className = "dropped-painter correct-answer";
                correctAnswer.textContent = `Réponse: ${zone.dataset.answer}`;
                zone.appendChild(correctAnswer);
            }
        }
    });
    
    localStorage.setItem("erreurs", JSON.stringify(erreurs));
    
    // Feedback sur le résultat
    if (totalCorrect === zones.length) {
        alert("Parfait ! Toutes les réponses sont correctes !");
    } else {
        alert(`Vous avez ${totalCorrect} réponse(s) correcte(s) sur ${zones.length}.`);
    }
}

function showMetadata(o) {
    const metaDiv = document.getElementById("metadata");
    metaDiv.innerHTML = `
        <h2>${o.titre}</h2>
        <p><strong>Artiste :</strong> ${o.artiste}</p>
        <p><strong>Année :</strong> ${o.annee}</p>
        <p><strong>Courant :</strong> ${o.mouvement}</p>
        <p><a href="${o.lien}" target="_blank">Voir la fiche</a></p>
    `;
    document.getElementById("modal").classList.remove("hidden");
}

function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
