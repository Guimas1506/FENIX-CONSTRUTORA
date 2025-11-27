// index.js
// ==================== FIREBASE SETUP ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

console.log("🔥 Firebase inicializado - Página Index");

// ==================== CARROSSEL AUTOMÁTICO ====================
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

// ==================== ELEMENTOS DO DOM ====================
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const btnLogoutMobile = document.getElementById("btnLogoutMobile");
const adminButton = document.getElementById("adminButton");

// Pega os links pelo href já que tem IDs duplicados
const linksModal = document.querySelectorAll(".logadores a");
let userButton = null;
let favoritosButton = null;

linksModal.forEach(link => {
  if (link.href && link.href.includes("User/user.html")) {
    userButton = link;
  }
  if (link.href && link.href.includes("favoritos.html")) {
    favoritosButton = link;
  }
});

// Seleciona os links do menu mobile
const linksMenuMobile = document.querySelectorAll(".menu-section a");
let usuarioLinkMobile = null;
let favoritosLinkMobile = null;
let loginLinkMobile = null;
let signinLinkMobile = null;

linksMenuMobile.forEach(link => {
  if (link.href && link.href.includes("User/user.html")) {
    usuarioLinkMobile = link;
  }
  if (link.href && link.href.includes("favoritos.html")) {
    favoritosLinkMobile = link;
  }
  if (link.href && link.href.includes("log-in.html")) {
    loginLinkMobile = link;
  }
  if (link.href && link.href.includes("sign-in.html")) {
    signinLinkMobile = link;
  }
});

// ==================== CONTROLE DE USUÁRIO ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuário logado:", user.uid);
    
    // Mostra/esconde elementos quando LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (btnLogoutMobile) btnLogoutMobile.style.display = "flex";
    if (logBtn) logBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;
    
    // Mostra Usuario e Favoritos no menu mobile quando logado
    if (usuarioLinkMobile) usuarioLinkMobile.style.display = "flex";
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = "flex";
    if (loginLinkMobile) loginLinkMobile.style.display = "none";
    if (signinLinkMobile) signinLinkMobile.style.display = "none";

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
    if (btnLogoutMobile) btnLogoutMobile.style.display = "none";
    if (logBtn) logBtn.style.display = "flex";
    if (registerBtn) registerBtn.style.display = "flex";
    if (adminButton) adminButton.style.display = "none";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
    
    // Esconde Usuario e Favoritos no menu mobile quando não logado
    if (usuarioLinkMobile) usuarioLinkMobile.style.display = "none";
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = "none";
    if (loginLinkMobile) loginLinkMobile.style.display = "flex";
    if (signinLinkMobile) signinLinkMobile.style.display = "flex";
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

// ==================== FUNÇÃO DE FAVORITAR ====================
window.toggleFavorito = async function(event, id) {
  event.stopPropagation();
  event.preventDefault();
  
  const user = auth.currentUser;
  
  // Verifica se está logado
  if (!user) {
    alert("Por favor, faça login para favoritar imóveis!");
    if (userArea) userArea.style.display = "flex";
    return;
  }
  
  const btn = document.getElementById(`fav-${id}`);
  if (!btn) return;
  
  const span = btn.querySelector('span');
  const isFavorited = span.textContent === '♥';
  
  try {
    // Importa funções do Firestore
    const { doc: docRef, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
    
    const favoritosRef = docRef(db, "favoritos", user.uid);
    const favoritosSnap = await getDoc(favoritosRef);
    
    if (isFavorited) {
      // DESFAVORITAR
      if (favoritosSnap.exists()) {
        await updateDoc(favoritosRef, {
          imoveis: arrayRemove(id)
        });
      }
      
      span.textContent = '♡';
      span.style.color = '#FE4F3F';
      btn.style.background = 'rgba(255,255,255,0.95)';
      btn.style.borderColor = '#FE4F3F';
      console.log("💔 DESFAVORITADO!");
      
    } else {
      // FAVORITAR
      if (favoritosSnap.exists()) {
        await updateDoc(favoritosRef, {
          imoveis: arrayUnion(id)
        });
      } else {
        await setDoc(favoritosRef, {
          imoveis: [id],
          userId: user.uid
        });
      }
      
      span.textContent = '♥';
      span.style.color = '#FF0000';
      btn.style.background = '#FFE5E5';
      btn.style.borderColor = '#FF0000';
      console.log("❤️ FAVORITADO!");
    }
    
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 200);
    
  } catch (error) {
    console.error("Erro ao favoritar:", error);
    alert("Erro ao favoritar. Tente novamente.");
  }
}

// ==================== CARREGAR IMÓVEIS (MÁXIMO 8) ====================
async function carregarImoveisUsuario() {
  console.log("🔍 Carregando imóveis para a página inicial...");
  
  const container = document.getElementById("lista-imoveis-usuario");
  const btnVerMais = document.getElementById("btn-ver-mais");
  
  if (!container) {
    console.error("❌ Container 'lista-imoveis-usuario' não encontrado!");
    return;
  }
  
  // Limpa estilos inline para permitir que o CSS responsivo funcione
  if (container.style.cssText) {
    container.style.cssText = '';
  }
  
  try {
    container.innerHTML = '<p style="text-align: center; padding: 20px; font-size: 18px; grid-column: 1 / -1; color: #666;">⏳ Carregando imóveis...</p>';
    
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    console.log("✅ Total de imóveis encontrados:", querySnapshot.size);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">📭 Nenhum imóvel disponível.</p>';
      return;
    }
    
    // Carrega favoritos do usuário
    let favoritos = [];
    const user = auth.currentUser;
    if (user) {
      try {
        const favoritosDoc = await getDoc(doc(db, "favoritos", user.uid));
        if (favoritosDoc.exists()) {
          favoritos = favoritosDoc.data().imoveis || [];
        }
      } catch (err) {
        console.log("Erro ao carregar favoritos:", err);
      }
    }
    
    container.innerHTML = '';
    
    let contador = 0;
    const maxImoveis = 8;
    
    querySnapshot.forEach((docSnap) => {
      if (contador >= maxImoveis) return; // Limita a 8 imóveis
      
      const imovel = docSnap.data();
      const imovelId = docSnap.id;
      const isFavorited = favoritos.includes(imovelId);
      
      const card = document.createElement('div');
      card.className = 'imovel-card-usuario';

      card.innerHTML = `
        <div style="position: relative;">
          <img src="${imovel.imagemURL || './img/logo1.png'}" 
               alt="${imovel.nome}"
               onerror="this.src='./img/logo1.png'">

          <button onclick="toggleFavorito(event, '${imovelId}')" 
                  class="btn-favorito" 
                  id="fav-${imovelId}"
                  style="background: ${isFavorited ? '#FFE5E5' : 'rgba(255,255,255,0.95)'}; border-color: ${isFavorited ? '#FF0000' : '#FE4F3F'};">
            <span style="color: ${isFavorited ? '#FF0000' : '#FE4F3F'};">${isFavorited ? '♥' : '♡'}</span>
          </button>
        </div>

        <div class="card-content">
          <h3>${imovel.nome || 'Sem nome'}</h3>
          <p>📍 ${imovel.cidade || 'N/A'} - ${imovel.uf || ''}</p>
          <p>💰 R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}</p>
          <p>📏 ${imovel.areas || 0}m²</p>
          <div class="card-detalhes">
            <span>🛏️ ${imovel.quartos || 0}</span>
            <span>🚗 ${imovel.vagas || 0}</span>
            <span>🚿 ${imovel.banheiros || 0}</span>
          </div>
          <button onclick="window.location.href='detalhes.html?id=${imovelId}'">
            Ver Detalhes
          </button>
        </div>
      `;
      
      // Hover effect
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
      });
      
      container.appendChild(card);
      contador++;
    });
    
    console.log(`✨ ${contador} imóveis carregados!`);
    
    // Mostra botão "Ver Mais" se houver mais de 8 imóveis
    if (btnVerMais && querySnapshot.size > maxImoveis) {
      btnVerMais.style.display = "inline-block";
    }
    
  } catch (error) {
    console.error("❌ ERRO ao carregar imóveis:", error);
    container.innerHTML = `<p style="color: red; text-align: center; padding: 20px; grid-column: 1 / -1;">Erro: ${error.message}</p>`;
  }
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM pronto! Iniciando...");
  carregarImoveisUsuario();
});