// sign-in.js - COM BARRA DE FORÇA VISUAL
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
const btnLogoutMobile = document.getElementById("btnLogoutMobile");

// NOVOS ELEMENTOS DO MENU MOBILE
const userEmailMobile = document.getElementById("userEmailMobile");
const emailTextMobile = document.getElementById("emailTextMobile");
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

const linksMenuMobile = document.querySelectorAll('.menu-section a');
let usuarioLinkMobile = null;
let favoritosLinkMobile = null;
let loginLinkMobile = null;
let signinLinkMobile = null;

linksMenuMobile.forEach(link => {
  if (link.href && link.href.includes('User/user.html')) usuarioLinkMobile = link;
  if (link.href && link.href.includes('favoritos.html')) favoritosLinkMobile = link;
  if (link.href && link.href.includes('log-in.html')) loginLinkMobile = link;
  if (link.href && link.href.includes('sign-in.html')) signinLinkMobile = link;
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
    if (btnLogoutMobile) btnLogoutMobile.style.display = "flex";
    if (loginButton) loginButton.style.display = "none";
    if (registerButton) registerButton.style.display = "none";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;
    
    // MOSTRA EMAIL NO MENU MOBILE
    if (userEmailMobile) userEmailMobile.style.display = "block";
    if (emailTextMobile) emailTextMobile.textContent = user.email;

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

    if (usuarioLinkMobile) usuarioLinkMobile.style.display = 'flex';
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = 'flex';
    if (loginLinkMobile) loginLinkMobile.style.display = 'none';
    if (signinLinkMobile) signinLinkMobile.style.display = 'none';

  } else {
    console.log("❌ Usuário não logado");
    
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (btnLogoutMobile) btnLogoutMobile.style.display = "none";
    if (loginButton) loginButton.style.display = "flex";
    if (registerButton) registerButton.style.display = "flex";
    if (adminButton) adminButton.style.display = "none";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
    
    // ESCONDE EMAIL NO MENU MOBILE
    if (userEmailMobile) userEmailMobile.style.display = "none";
    if (emailTextMobile) emailTextMobile.textContent = "";

    if (usuarioLinkMobile) usuarioLinkMobile.style.display = 'none';
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = 'none';
    if (loginLinkMobile) loginLinkMobile.style.display = 'flex';
    if (signinLinkMobile) signinLinkMobile.style.display = 'flex';
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

if (btnLogoutMobile) {
  btnLogoutMobile.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logout realizado!");
      window.location.reload();
    }).catch((err) => alert(err.message));
  });
}

// ==================== VALIDAÇÃO DE SENHA COM BARRA VISUAL ====================
function atualizarRequisito(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = ok ? "green" : "red";
}

function atualizarBarraForca(nivel) {
  const bar1 = document.getElementById("strength-bar-1");
  const bar2 = document.getElementById("strength-bar-2");
  const bar3 = document.getElementById("strength-bar-3");
  const strengthText = document.getElementById("strength-text");
  
  if (!bar1 || !bar2 || !bar3 || !strengthText) return;
  
  // Remove todas as classes
  bar1.className = "strength-bar";
  bar2.className = "strength-bar";
  bar3.className = "strength-bar";
  strengthText.className = "strength-text";
  
  if (nivel === 1) {
    // Fraca - apenas primeira barra vermelha
    bar1.classList.add("active-weak");
    strengthText.classList.add("weak");
    strengthText.textContent = "Fraca";
  } else if (nivel === 2) {
    // Média - duas primeiras barras amarelas
    bar1.classList.add("active-medium");
    bar2.classList.add("active-medium");
    strengthText.classList.add("medium");
    strengthText.textContent = "Média";
  } else if (nivel === 3) {
    // Forte - todas as barras verdes
    bar1.classList.add("active-strong");
    bar2.classList.add("active-strong");
    bar3.classList.add("active-strong");
    strengthText.classList.add("strong");
    strengthText.textContent = "Forte";
  }
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

  // Atualiza barra de força visual
  let nivel = 1;
  if (letrasCount >= 6 && temEspecial && semEspacos) nivel = 2;
  if (nivel === 2 && letrasCount >= 8 && numerosCount >= 2) nivel = 3;

  atualizarBarraForca(nivel);
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
      right: 50px;
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
    
    setTimeout(() => {
      seta.style.transition = 'opacity 0.5s ease';
      seta.style.opacity = '0';
      setTimeout(() => {
        seta.remove();
        style.remove();
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

// ==================== TOOLTIP HOVER/TOUCH BEHAVIOR ====================
window.addEventListener('DOMContentLoaded', () => {
  const infoIcon = document.getElementById('infoIcon');
  const tooltip = document.getElementById('tooltipRequisitos');
  
  if (!infoIcon || !tooltip) return;
  
  let hideTimeout = null;
  let touchTimeout = null;
  
  function positionTooltip() {
    const iconRect = infoIcon.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Posiciona ao lado direito do ícone
    let left = iconRect.right + 10;
    let top = iconRect.top + (iconRect.height / 2) - (tooltipRect.height / 2);
    
    // Se passar da tela à direita, coloca à esquerda
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = iconRect.left - tooltipRect.width - 10;
    }
    
    // Ajusta se passar do topo ou fundo
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  
  function showTooltip() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    tooltip.classList.add('show');
    positionTooltip();
  }
  
  function hideTooltip() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      tooltip.classList.remove('show');
    }, 200);
  }
  
  // Hover (desktop)
  infoIcon.addEventListener('mouseenter', showTooltip);
  infoIcon.addEventListener('mouseleave', hideTooltip);
  
  // Touch (mobile)
  infoIcon.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (tooltip.classList.contains('show')) {
      tooltip.classList.remove('show');
      if (touchTimeout) clearTimeout(touchTimeout);
    } else {
      showTooltip();
      
      // Auto-esconde após 5 segundos
      if (touchTimeout) clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
      }, 5000);
    }
  });
  
  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (!infoIcon.contains(e.target) && !tooltip.contains(e.target)) {
      tooltip.classList.remove('show');
    }
  });
});