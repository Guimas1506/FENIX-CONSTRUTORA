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

// Elementos do header/modal
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");

// Atualiza header conforme login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    btnLogoutModal.style.display = "flex";
    logBtn.style.display = "none";
    registerBtn.style.display = "none";

    // Pega dados do Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const nome = docSnap.exists() ? docSnap.data().nome : user.displayName || "Usuário";

    welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
    userEmail.textContent = user.email;
  } else {
    btnLogoutModal.style.display = "none";
    logBtn.style.display = "flex";
    registerBtn.style.display = "flex";
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