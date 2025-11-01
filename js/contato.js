// contato.js - Controle de autenticação e área do usuário
console.log("🚀 Script contato.js carregado com sucesso!");

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

console.log("🔥 Firebase inicializado - Página Contato");

// ==================== REFERÊNCIAS DOS ELEMENTOS ====================
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const adminButton = document.getElementById("adminButton");

// ==================== CONTROLE DE AUTENTICAÇÃO ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuário logado:", user.email);
    console.log("🆔 UID:", user.uid);
    
    // Usuário logado - Atualiza interface
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (logBtn) logBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${user.displayName || "Usuário"}`;
    if (userEmail) userEmail.textContent = user.email;

    // Verifica se é administrador
    const docRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(docRef);
      console.log("📄 Documento existe?", docSnap.exists());
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("📊 Dados do usuário:", userData);
        console.log("👑 Campo admin:", userData.admin);
        
        const isAdmin = userData.admin || false;
        console.log("✨ É admin?", isAdmin);
        
        if (adminButton) {
          adminButton.style.display = isAdmin ? "inline-block" : "none";
          console.log("🔧 Display do botão ADM:", adminButton.style.display);
        } else {
          console.error("❌ Botão adminButton não encontrado no DOM!");
        }
      } else {
        console.warn("⚠️ Documento do usuário não existe no Firestore!");
      }
    } catch (err) {
      console.error("❌ Erro ao verificar admin:", err);
    }
  } else {
    console.log("❌ Nenhum usuário logado");
    
    // Usuário não logado - Oculta elementos autenticados
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (logBtn) logBtn.style.display = "flex";
    if (registerBtn) registerBtn.style.display = "flex";
    if (adminButton) adminButton.style.display = "none";
  }
});

// ==================== EVENTOS DO MODAL ====================

// Abrir área do usuário ao clicar no ícone
if (iconPerson) {
  iconPerson.addEventListener("click", () => {
    console.log("👤 Ícone de usuário clicado");
    if (userArea) userArea.style.display = "flex";
  });
}

// Fechar modal pelo botão X
if (closeUserArea) {
  closeUserArea.addEventListener("click", () => {
    console.log("❌ Fechando modal");
    if (userArea) userArea.style.display = "none";
  });
}

// Fechar modal ao clicar fora dele
window.addEventListener("click", (e) => {
  if (e.target === userArea) {
    console.log("❌ Fechando modal (clique fora)");
    if (userArea) userArea.style.display = "none";
  }
});

// ==================== LOGOUT ====================
if (btnLogoutModal) {
  btnLogoutModal.addEventListener("click", () => {
    console.log("🚪 Realizando logout...");
    signOut(auth)
      .then(() => {
        alert("Logout realizado com sucesso!");
        window.location.reload();
      })
      .catch((err) => {
        console.error("❌ Erro no logout:", err);
        alert("Erro ao fazer logout: " + err.message);
      });
  });
}

