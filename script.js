let oeuvres = [];
let modeRevision = false;
let erreurs = JSON.parse(localStorage.getItem("erreurs")) || [];

document.addEventListener("DOMContentLoaded", () => {
    const paintingsDiv = document.getElementById("paintings");
    if (paintingsDiv) {
        paintingsDiv.innerHTML = "<p>Chargement des œuvres...</p>";
    } else {
        console.error("L'élément avec l'ID 'paintings' n'a pas été trouvé.");
        return; // Arrête l'exécution si l'élément est absent
    }

    fetch("data/oeuvres.json")
        .then(res => {
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status} - Vérifiez le chemin du fichier`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Données chargées:", data);
            if (data && data.length > 0) {
                oeuvres = data;
                initQuiz();
            } else {
                throw new Error("Le fichier JSON ne contient pas de données valides");
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement des œuvres :", error);
            paintingsDiv.innerHTML = `<p>Erreur de chargement: ${error.message}</p>
                                     <p>Vérifiez que le fichier data/oeuvres.json existe et est valide.</p>`;
        });

    // Vérification de l'existence des éléments avant d'ajouter les listeners
    const resetButton = document.getElementById("reset-errors");
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            erreurs = [];
            localStorage.setItem("erreurs", JSON.stringify(erreurs));
            alert("Erreurs vidées !");
        });
    } else {
        console.error("L'élément avec l'ID 'reset-errors' n'a pas été trouvé.");
    }

    const modeNormalButton = document.getElementById("mode-normal");
    if (modeNormalButton) {
        modeNormalButton.addEventListener("click", () => {
            modeRevision = false;
            initQuiz();
        });
    } else {
        console.error("L'élément avec l'ID 'mode-normal' n'a pas été trouvé.");
    }

    const modeRevisionButton = document.getElementById("mode-revision");
    if (modeRevisionButton) {
        modeRevisionButton.addEventListener("click", () => {
            modeRevision = true;
            initQuiz();
        });
    } else {
        console.error("L'élément avec l'ID 'mode-revision' n'a pas été trouvé.");
    }

    const validateButton = document.getElementById("validate");
    if (validateButton) {
        validateButton.addEventListener("click", validateAnswers);
    } else {
        console.error("L'élément avec l'ID 'validate' n'a pas été trouvé.");
    }

    const modal = document.getElementById("modal");
    if (modal) {
        const closeModalButton = document.getElementById("close-modal");
        if (closeModalButton) {
            closeModalButton.addEventListener("click", () => {
                modal.classList.add("hidden");
            });
        } else {
            console.error("L'élément avec l'ID 'close-modal' n'a pas été trouvé.");
        }
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    } else {
        console.error("L'élément avec l'ID 'modal' n'a pas été trouvé.");
    }
});

function initQuiz() {
    const paintingsDiv = document.getElementById("paintings");
    if (!paintingsDiv) {
        console.error("L'élément avec l'ID 'paintings' n'a pas été trouvé.");
        return; // Arrête l'exécution si l'élément est absent
    }
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

        const infoBtn = document.createElement("button");
        infoBtn.textContent = "Infos";
        infoBtn.className = "info-btn";
        infoBtn.addEventListener("click", () => showMetadata(o));
        card.appendChild(infoBtn);

        const title = document.createElement("div");
        title.className = "painting-title";
        title.textContent = o.titre;
        card.appendChild(title);

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

        const dragZone = document.createElement("div");
        dragZone.className = "drag-items";
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

    if (dropZone.dataset.type !== type) return;

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
