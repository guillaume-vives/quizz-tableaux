"use strict";

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

document.addEventListener("DOMContentLoaded", loadData); // Appeler loadData au chargement du DOM
