// sign-in.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


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
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

console.log("🔥 Firebase inicializado - Página Sign-in");

// ==================== ELEMENTOS DO DOM ====================
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const adminButton = document.getElementById("adminButton");

// Pega os links pelo href já que tem IDs duplicados
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
    console.log("✅ Usuário logado:", user.uid);
    
    // Mostra/esconde elementos quando LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (loginButton) loginButton.style.display = "none";
    if (registerButton) registerButton.style.display = "none";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;

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
      } else {
        // Se não existir, tenta na coleção "usuarios"
        docRef = doc(db, "usuarios", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nome = data.nome || nome;
          isAdmin = data.admin || false;
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
    }

    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
    if (adminButton) adminButton.style.display = isAdmin ? "inline-block" : "none";

  } else {
    console.log("❌ Usuário não logado");
    
    // Mostra/esconde elementos quando NÃO LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (loginButton) loginButton.style.display = "flex";
    if (registerButton) registerButton.style.display = "flex";
    if (adminButton) adminButton.style.display = "none";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
  }
});

// ==================== MODAL DO USUÁRIO ====================
if (iconPerson) {
  iconPerson.addEventListener("click", () => {
    if (userArea) userArea.style.display = "flex";
  });
}

if (closeUserArea) {
  closeUserArea.addEventListener("click", () => {
    if (userArea) userArea.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === userArea) {
    if (userArea) userArea.style.display = "none";
  }
});

if (btnLogoutModal) {
  btnLogoutModal.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logout realizado!");
      window.location.reload();
    }).catch((err) => alert(err.message));
  });
}

// ==================== VALIDAÇÃO DE SENHA ====================
function atualizarRequisito(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = ok ? "green" : "red";
}

window.validarSenha = function() {
  const senha = document.getElementById("password").value;
  const letrasCount = (senha.match(/[a-zA-Z]/g) || []).length;
  const numerosCount = (senha.match(/[0-9]/g) || []).length;
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const semEspacos = !/\s/.test(senha);

  atualizarRequisito("req-caracteres", letrasCount >= 6);
  atualizarRequisito("req-especial", temEspecial);
  atualizarRequisito("req-espacos", semEspacos);

  const infoIcon = document.getElementById("infoIcon");
  if (letrasCount >= 6 && temEspecial && semEspacos) {
    infoIcon.style.backgroundColor = "green";
  } else {
    infoIcon.style.backgroundColor = "red";
  }

  const barraImg = document.getElementById("senha-forca-img");
  let nivel = 1;
  if (letrasCount >= 6 && temEspecial && semEspacos) nivel = 2;
  if (nivel === 2 && letrasCount >= 8 && numerosCount >= 2) nivel = 3;

  if (nivel === 1) barraImg.src = "./img/senha-fraca.png";
  else if (nivel === 2) barraImg.src = "./img/senha-media.png";
  else if (nivel === 3) barraImg.src = "./img/senha-forte.png";
};

// ==================== REGISTRO DE USUÁRIO ====================
window.registerUser = async function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("password").value;
  const confSenha = document.getElementById("confirm-password").value;

  const letrasCount = (senha.match(/[a-zA-Z]/g) || []).length;
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const semEspacos = !/\s/.test(senha);

  if (senha !== confSenha) {
    alert("As senhas não coincidem!");
    return;
  }

  if (!(letrasCount >= 6 && temEspecial && semEspacos)) {
    alert("A senha deve ter no mínimo 6 letras, pelo menos 1 caractere especial e não pode conter espaços!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nome });

    // Adiciona usuário ao Firestore com admin = false
    await setDoc(doc(db, "users", user.uid), {
      nome: nome,
      email: email,
      admin: false
    });

    alert("Cadastro realizado com sucesso! Bem-vindo, " + (nome || email));
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  }
};

// ==================== LOGIN SOCIAL ====================
async function socialLogin(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Bem-vindo, ${user.displayName || user.email}!`);
    window.location.href = "index.html";
  } catch (error) {
    console.error("socialLogin error:", error);
  }
}

window.registerGoogle = () => socialLogin(googleProvider);
window.registerFacebook = () => socialLogin(facebookProvider);