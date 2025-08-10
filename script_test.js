"use strict";

let modeRevision = false;
let erreurs = [];

function initQuiz() {
    const paintingsDiv = document.getElementById("paintings");
    if (paintingsDiv) {
        paintingsDiv.innerHTML = "<p>Test réussi !</p>";
    } else {
        console.error("Element #paintings non trouvé !");
    }
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
            initQuiz(); // Appeler initQuiz après le chargement des données
        })
        .catch(error => {
            console.error("Erreur:", error);
            quizContainer.innerHTML = `<p>Erreur de chargement des données.</p>`; // Afficher un message d'erreur simple
        });
}

function validateAnswers() {
    // Vide pour le moment
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
closeModalBtn.addEventListener("click", () => { modal.classList.add("hidden"); });
modal.addEventListener("click", (e) => { if (e.target === modal) { modal.classList.add("hidden"); } });

document.addEventListener("DOMContentLoaded", loadData);
