var radio = document.querySelector(".manual-btn");
var cont = 1;

document.getElementById("radio1").checked = true;

setInterval(() => {
  proximaImg();
}, 5000);

function proximaImg() {
  cont++;

  if (cont > 3) {
    cont = 1;
  }

  document.getElementById("radio" + cont).checked = true;
};



  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCYDGROxguHYX-YA-J-HqRRGSF3uN-ZEAs",
    authDomain: "fenix-construtora-a34b5.firebaseapp.com",
    projectId: "fenix-construtora-a34b5",
    storageBucket: "fenix-construtora-a34b5.firebasestorage.app",
    messagingSenderId: "928009241790",
    appId: "1:928009241790:web:333b16b217a2ece01d8aef"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const headerLogin = document.getElementById("header-login");
  const userMenu = document.querySelector(".displau-subs");
  
  const btnLogout = document.getElementById("btn-logout");
  const barra = document.querySelector(".barra");

  // Verifica se há usuário logado
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Oculta botões login/sign-in
      headerLogin.style.display = "none";
      // Mostra menu do usuário
      userMenu.style.display = "flex";
      // Usa o displayName salvo no Firebase
      welcomeMsg.textContent = `Bem-vindo(a), ${user.displayName || user.email}`;
    } else {
      // Mostra botões login/sign-in
      headerLogin.style.display = "flex";
      userMenu.style.display = "none";
      
    }
  });



  

  // Referências
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");

// Abrir área do usuário
iconPerson.addEventListener("click", () => {
  userArea.style.display = "flex";
});

// Fechar modal
closeUserArea.addEventListener("click", () => {
  userArea.style.display = "none";
});

// Fechar ao clicar fora
window.addEventListener("click", (e) => {
  if (e.target === userArea) {
    userArea.style.display = "none";
  }
});

// Atualizar dados do usuário quando logado
onAuthStateChanged(auth, (user) => {
  if(user){
    welcomeMsg.textContent = `Bem-vindo(a), ${user.displayName || "Usuário"}`;
    userEmail.textContent = user.email;
  }
});

// Logout pelo modal
btnLogoutModal.addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logout realizado!");
    window.location.reload();
  }).catch((err) => alert(err.message));
});