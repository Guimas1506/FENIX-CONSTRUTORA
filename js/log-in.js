// log-in.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { getFirestore, doc, getDoc, setDoc  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();

// ==================== MOSTRAR/ESCONDER SENHA ====================
window.togglePassword = function(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const img = button.querySelector('img');
  
  if (input.type === "password") {
    input.type = "text";
    img.src = "./img/hide.png";
    img.alt = "Esconder senha";
  } else {
    input.type = "password";
    img.src = "./img/visible.png";
    img.alt = "Mostrar senha";
  }
}

// Elementos do header/modal
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");

const linksModal = document.querySelectorAll(".logadores a");
let loginButton = null;
let registerButton = null;
let userButton = null;
let favoritosButton = null;

linksModal.forEach(link => {
  if (link.href && link.href.includes("log-in.html")) {
    loginButton = link;
  }
  if (link.href && link.href.includes("sign-in.html")) {
    registerButton = link;
  }
  if (link.href && link.href.includes("User/user.html")) {
    userButton = link;
  }
  if (link.href && link.href.includes("favoritos.html")) {
    favoritosButton = link;
  }
});

// ==================== CONTROLE DE USUÁRIO ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (loginButton) loginButton.style.display = "none";
    if (registerButton) registerButton.style.display = "none";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";

    // Pega dados do Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const nome = docSnap.exists() ? docSnap.data().nome : user.displayName || "Usuário";

    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
    if (userEmail) userEmail.textContent = user.email;
  } else {
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (loginButton) loginButton.style.display = "flex";
    if (registerButton) registerButton.style.display = "flex";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
  }
});

// Abre/fecha modal do usuário
iconPerson.addEventListener("click", () => userArea.style.display = "flex");
closeUserArea.addEventListener("click", () => userArea.style.display = "none");
window.addEventListener("click", (e) => {
  if (e.target === userArea) userArea.style.display = "none";
});

// POPUP
window.showPopup = function(message) {
  const popup = document.getElementById("popup");
  document.getElementById("popup-message").innerText = message;
  popup.style.display = "flex";
}
window.closePopup = function() {
  document.getElementById("popup").style.display = "none";
}
window.onclick = function(event) {
  const popup = document.getElementById("popup");
  if (event.target === popup) popup.style.display = "none";
}

// Login com email/senha
window.loginUser = async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showPopup("✅ Login realizado com sucesso!");
    setTimeout(() => window.location.href = "./index.html", 2000);
  } catch (error) {
    showPopup("❌ Erro ao entrar: " + error.message);
  }
};

// Login Google
window.loginGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);

    // Caso seja primeiro login, garante documento no Firestore
    const docRef = doc(db, "users", result.user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        nome: result.user.displayName || "",
        email: result.user.email || "",
        admin: false
      });
    }

    showPopup(`✅ Bem-vindo, ${result.user.displayName}!`);
    setTimeout(() => window.location.href = "./index.html", 2000);
  } catch (error) {
    showPopup("❌ Erro ao entrar com Google: " + error.message);
  }
};

// Redefinição de senha
window.resetPassword = () => {
  const email = document.getElementById("email").value;
  if (!email) {
    showPopup("⚠️ Digite seu e-mail para recuperar a senha.");
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => showPopup("📧 E-mail de redefinição enviado!"))
    .catch((error) => showPopup("❌ Erro: " + error.message));
};

// Logout
btnLogoutModal.addEventListener("click", () => {
  signOut(auth).then(() => {
    showPopup("Você saiu da conta.");
    setTimeout(() => window.location.reload(), 1500);
  }).catch((err) => showPopup("Erro ao sair: " + err.message));
});