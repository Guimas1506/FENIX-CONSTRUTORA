const opcoesGerente = document.querySelector(".options-gerence");
const seta = document.getElementById("seta");
const gerente = document.querySelector(".title-gerence");

let rotacionado = false;

gerente.addEventListener("click", () => {
    if (rotacionado) {
        seta.style.transform = "rotate(0deg)";
        opcoesGerente.style.display = "none";
    } else {
        seta.style.transform = "rotate(90deg)";
        opcoesGerente.style.display = "flex"; // ou "block"
    }
    rotacionado = !rotacionado;
});