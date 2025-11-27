// sign-in.js - COM FUNCIONALIDADE DE MOSTRAR/ESCONDER SENHA
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

// ==================== CONTROLE DE USUÁRIO ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuário logado:", user.uid);
    
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (loginButton) loginButton.style.display = "none";
    if (registerButton) registerButton.style.display = "none";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;

    let nome = user.displayName || "Usuário";
    let isAdmin = false;

    try {
      let docRef = doc(db, "users", user.uid);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        nome = data.nome || nome;
        isAdmin = data.admin || false;
      } else {
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

// ==================== FUNÇÃO PARA MOSTRAR SETA ====================
function mostrarSetaRequisitos() {
  const setaExistente = document.querySelector('.seta-requisitos');
  if (setaExistente) {
    setaExistente.remove();
  }
  
  const infoIcon = document.getElementById("infoIcon");
  if (!infoIcon) return;
  
  const seta = document.createElement('div');
  seta.className = 'seta-requisitos';
  seta.innerHTML = `
    <div class="seta-animada">
      <span class="texto-seta">Veja os requisitos aqui!</span>
      <span class="seta-simbolo">→</span>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    .seta-requisitos {
      position: absolute;
      bottom: -30px;
      right: 45px;
      z-index: 150;
      pointer-events: none;
    }
    
    .seta-animada {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .texto-seta {
      background: #FF0000;
      color: white;
      padding: 8px 15px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 4px 15px rgba(255, 0, 0, 0.5);
      animation: pulseBg 1.5s ease-in-out infinite;
    }
    
    .seta-simbolo {
      color: #FF0000;
      font-size: 35px;
      font-weight: bold;
      animation: pulseArrow 1s ease-in-out infinite;
      text-shadow: 0 2px 8px rgba(255, 0, 0, 0.5);
    }
    
    @keyframes pulseArrow {
      0%, 100% {
        transform: translateX(0);
        opacity: 1;
      }
      50% {
        transform: translateX(8px);
        opacity: 0.7;
      }
    }
    
    @keyframes pulseBg {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;
  
  document.head.appendChild(style);
  
  const senhaContainer = document.querySelector('.senha-container');
  if (senhaContainer) {
    senhaContainer.appendChild(seta);
    
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
    
    setTimeout(() => {
      seta.style.transition = 'opacity 0.5s ease';
      seta.style.opacity = '0';
      setTimeout(() => {
        seta.remove();
        style.remove();
        if (tooltip) {
          tooltip.style.display = '';
        }
      }, 500);
    }, 6000);
  }
}

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
    mostrarSetaRequisitos();
    alert("A senha não atende aos requisitos mínimos!\n\n✓ Mínimo de 6 letras\n✓ Pelo menos 1 caractere especial\n✓ Não pode conter espaços\n\nVeja os detalhes no botão 'i' vermelho abaixo do campo de senha.");
    document.getElementById("password").focus();
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nome });

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