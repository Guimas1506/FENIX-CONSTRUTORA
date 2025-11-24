// servicos.js - Controle de autenticação e área do usuário
console.log("🚀 Script servicos.js carregado com sucesso!");

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

console.log("🔥 Firebase inicializado - Página Serviços");

// ==================== REFERÊNCIAS DOS ELEMENTOS ====================
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const adminButton = document.getElementById("adminButton");

// Pega os links pelo href já que tem IDs duplicados
const linksModal = document.querySelectorAll(".logadores a");
let userButton = null;
let favoritosButton = null;

console.log("📋 Total de links encontrados:", linksModal.length);

linksModal.forEach(link => {
  console.log("🔗 Link encontrado:", link.href);
  if (link.href && link.href.includes("User/user.html")) {
    userButton = link;
    console.log("✅ userButton encontrado");
  }
  if (link.href && link.href.includes("favoritos.html")) {
    favoritosButton = link;
    console.log("✅ favoritosButton encontrado");
  }
});

// ==================== CONTROLE DE AUTENTICAÇÃO ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuário logado:", user.email);
    console.log("🆔 UID:", user.uid);
    
    // Mostra/esconde elementos quando LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;
    
    // Esconde login e registro quando logado
    linksModal.forEach(link => {
      if (link.href && link.href.includes("log-in.html")) {
        link.style.display = "none";
      }
      if (link.href && link.href.includes("sign-in.html")) {
        link.style.display = "none";
      }
    });

    // Busca nome e status de admin do usuário
    let nome = user.displayName || "Usuário";
    let isAdmin = false;

    try {
      // Tenta primeiro na coleção "users"
      let docRef = doc(db, "users", user.uid);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        nome = data.nome || nome;
        isAdmin = data.admin || false;
        console.log("📊 Dados do usuário:", data);
        console.log("👑 Admin?", isAdmin);
      } else {
        // Se não existir, tenta na coleção "usuarios"
        docRef = doc(db, "usuarios", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nome = data.nome || nome;
          isAdmin = data.admin || false;
          console.log("📊 Dados do usuário (usuarios):", data);
          console.log("👑 Admin?", isAdmin);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
    }

    if (welcomeMsg) {
      welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
      console.log("✅ welcomeMsg atualizado para:", nome);
    }
    if (adminButton) {
      adminButton.style.display = isAdmin ? "inline-block" : "none";
      console.log("✅ adminButton display:", adminButton.style.display);
    }

  } else {
    console.log("❌ Nenhum usuário logado");
    
    // Mostra/esconde elementos quando NÃO LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (adminButton) adminButton.style.display = "none";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
    
    // Mostra login e registro quando não logado
    linksModal.forEach(link => {
      if (link.href && link.href.includes("log-in.html")) {
        link.style.display = "flex";
      }
      if (link.href && link.href.includes("sign-in.html")) {
        link.style.display = "flex";
      }
    });
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