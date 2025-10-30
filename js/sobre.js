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

// Referências
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const adminButton = document.getElementById("adminButton");

// Atualiza visibilidade dos botões e verifica admin
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Usuário logado
    btnLogoutModal.style.display = "flex";
    logBtn.style.display = "none";
    registerBtn.style.display = "none";
    welcomeMsg.textContent = `Bem-vindo(a), ${user.displayName || "Usuário"}`;
    userEmail.textContent = user.email;

    // Verifica se é admin
    const docRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const isAdmin = docSnap.data().admin || false;
        if (adminButton) {
          adminButton.style.display = isAdmin ? "inline-block" : "none";
        }
      }
    } catch (err) {
      console.error("Erro ao verificar admin:", err);
    }
  } else {
    // Usuário não logado
    btnLogoutModal.style.display = "none";
    logBtn.style.display = "flex";
    registerBtn.style.display = "flex";
    if (adminButton) {
      adminButton.style.display = "none";
    }
  }
});

// Abrir área do usuário
if (iconPerson) {
  iconPerson.addEventListener("click", () => {
    userArea.style.display = "flex";
  });
}

// Fechar modal
if (closeUserArea) {
  closeUserArea.addEventListener("click", () => {
    userArea.style.display = "none";
  });
}

// Fechar ao clicar fora
window.addEventListener("click", (e) => {
  if (e.target === userArea) {
    userArea.style.display = "none";
  }
});

// Logout pelo modal
if (btnLogoutModal) {
  btnLogoutModal.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logout realizado!");
      window.location.reload();
    }).catch((err) => alert(err.message));
  });
}

