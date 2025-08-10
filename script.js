let oeuvres = [];
let modeRevision = false;
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

    // Listes uniques artistes et courants pour ce pool
    let artistesList = [...new Set(pool.map(o => o.artiste))];
    let courantsList = [...new Set(pool.map(o => o.mouvement))];
    artistesList = shuffleArray([...artistesList]);
    courantsList = shuffleArray([...courantsList]);

    pool.forEach(o => {
        const card = document.createElement("div");
        card.className = "painting-card";

        const img = document.createElement("img");
        img.src = o.image;
        img.alt = o.titre;
        img.style.cursor = "pointer";
        img.addEventListener("click", () => openFullscreen(img));
        card.appendChild(img);

        // Bouton infos
        const infoBtn = document.createElement("button");
        infoBtn.textContent = "Infos";
        infoBtn.className = "info-btn";
        infoBtn.addEventListener("click", () => showMetadata(o));
        card.appendChild(infoBtn);

        const title = document.createElement("div");
        title.className = "painting-title";
        title.textContent = o.titre;
        card.appendChild(title);

        // Drop artiste
        const dropArtiste = document.createElement("div");
        dropArtiste.className = "drop-zone artiste";
        dropArtiste.dataset.answer = o.artiste;
        dropArtiste.dataset.type = "artiste";
        dropArtiste.textContent = "Artiste";
        dropArtiste.addEventListener("dragover", allowDrop);
        dropArtiste.addEventListener("dragenter", handleDragEnter);
        dropArtiste.addEventListener("dragleave", handleDragLeave);
        dropArtiste.addEventListener("drop", drop);
        card.appendChild(dropArtiste);

        // Drop courant
        const dropCourant = document.createElement("div");
        dropCourant.className = "drop-zone courant";
        dropCourant.dataset.answer = o.mouvement;
        dropCourant.dataset.type = "courant";
        dropCourant.textContent = "Courant";
        dropCourant.addEventListener("dragover", allowDrop);
        dropCourant.addEventListener("dragenter", handleDragEnter);
        dropCourant.addEventListener("dragleave", handleDragLeave);
        dropCourant.addEventListener("drop", drop);
        card.appendChild(dropCourant);

        // Ajout : zone de drag sous l'image
        const dragZone = document.createElement("div");
        dragZone.className = "drag-items";
        // Mélange artistes et courants pour cette carte
        const items = shuffleArray([
            ...artistesList.map(a => ({ type: "artiste", value: a })),
            ...courantsList.map(c => ({ type: "courant", value: c }))
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

        paintingsDiv.appendChild(card);
    });
}

function openFullscreen(img) {
    if (img.requestFullscreen) {
        img.requestFullscreen();
    } else if (img.webkitRequestFullscreen) { /* Safari */
        img.webkitRequestFullscreen();
    } else if (img.msRequestFullscreen) { /* IE11 */
        img.msRequestFullscreen();
    }
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

// Pour permettre la suppression d'un drag and drop dans la liste de gauche
function removeIfDropped(ev) {
    // Ne rien faire ici, mais tu peux personnaliser si besoin
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
