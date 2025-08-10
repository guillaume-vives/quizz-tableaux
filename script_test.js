"use strict";

function initQuiz() {
    const paintingsDiv = document.getElementById("paintings");
    if (paintingsDiv) {
        paintingsDiv.innerHTML = "<p>Test réussi !</p>";
    } else {
        console.error("Element #paintings non trouvé !");
    }
}

document.addEventListener("DOMContentLoaded", initQuiz);
