
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

  const logBtn = document.getElementById("log");
  const registerBtn = document.getElementById("register");

  // Atualiza visibilidade dos botões conforme login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      btnLogoutModal.style.display = "flex";
      logBtn.style.display = "none";
      registerBtn.style.display = "none";
    } else {
      btnLogoutModal.style.display = "none";
      logBtn.style.display = "flex";
      registerBtn.style.display = "flex";
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