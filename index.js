// -------------------- Carrossel --------------------
var cont = 1;
document.getElementById("radio1").checked = true;

setInterval(() => {
  proximaImg();
}, 5000);

function proximaImg() {
  cont++;
  if (cont > 3) cont = 1;
  document.getElementById("radio" + cont).checked = true;
}

// -------------------- Firebase --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
const db = getFirestore(app);

// -------------------- Elementos --------------------
const headerLogin = document.getElementById("header-login");
const userMenu = document.querySelector(".displau-subs");

const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");

// Botão admin (pode não existir em todas páginas)
const adminButton = document.getElementById("adminButton");

// -------------------- Estado do usuário --------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("UID do usuário:", user.uid);

    // Usuário logado
    headerLogin && (headerLogin.style.display = "none");

    const docRef = doc(db, "users", user.uid);
    let nome = user.displayName || user.email;
    let isAdmin = false;

    try {
      const docSnap = await getDoc(docRef);
      console.log("Documento encontrado:", docSnap.exists());
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Dados do usuário:", data);
        nome = data.nome || nome;
        isAdmin = data.admin || false;
      }
    } catch (err) {
      console.error("Erro ao pegar dados do usuário:", err);
    }

    // Atualiza informações no modal/header
    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
    if (userEmail) userEmail.textContent = user.email;

    // Mostrar ou ocultar botão de admin
    if (adminButton) adminButton.style.display = isAdmin ? "inline-block" : "none";

    // Modal mostra só o botão de logout
    if (userArea) {
      const logBtn = userArea.querySelector("#log");
      const registerBtn = userArea.querySelector("#register");
      logBtn.style.display = "none";
      registerBtn.style.display = "none";
      btnLogoutModal.style.display = "flex";
    }

  } else {
    // Usuário não logado
    headerLogin && (headerLogin.style.display = "flex");

    // Modal mostra os botões de login e cadastro
    if (userArea) {
      const logBtn = userArea.querySelector("#log");
      const registerBtn = userArea.querySelector("#register");
      logBtn.style.display = "flex";
      registerBtn.style.display = "flex";
      btnLogoutModal.style.display = "none";
      welcomeMsg.textContent = "Bem-vindo(a), Usuário";
      userEmail.textContent = "Email do usuário";
    }

    // Botão admin sempre escondido
    if (adminButton) adminButton.style.display = "none";
  }
});

// -------------------- Modal usuário --------------------
// Abrir modal
iconPerson && iconPerson.addEventListener("click", () => {
  if (userArea) userArea.style.display = "flex";
});

// Fechar modal
closeUserArea && closeUserArea.addEventListener("click", () => {
  if (userArea) userArea.style.display = "none";
});

// Fechar clicando fora
window.addEventListener("click", (e) => {
  if (e.target === userArea) userArea.style.display = "none";
});

// Logout
btnLogoutModal && btnLogoutModal.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logout realizado!");
      window.location.reload();
    })
    .catch((err) => alert(err.message));
});
