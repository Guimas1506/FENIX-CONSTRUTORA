// favoritos.js - Lógica da página de favoritos
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYDGROxguHYX-YA-J-HqRRGSF3uN-ZEAs",
  authDomain: "fenix-construtora-a34b5.firebaseapp.com",
  projectId: "fenix-construtora-a34b5",
  storageBucket: "fenix-construtora-a34b5.firebasestorage.app",
  messagingSenderId: "928009241790",
  appId: "1:928009241790:web:333b16b217a2ece01d8aef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("❤️ Página de Favoritos carregada");

// ==================== ELEMENTOS DO DOM ====================
const loading = document.getElementById("loading-favoritos");
const naoLogado = document.getElementById("nao-logado");
const vazioFavoritos = document.getElementById("vazio-favoritos");
const listaFavoritos = document.getElementById("lista-favoritos");

// Elementos do modal de usuário
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

linksModal.forEach(link => {
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
    
    // Esconde as linhas HR entre login/registro
    linhasHR.forEach(linha => {
      linha.style.display = "none";
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
    if (adminButton) adminButton.style.display = isAdmin ? "flex" : "none";
    
    // Carrega favoritos
    carregarFavoritos(user);
    
  } else {
    console.log("❌ Usuário não logado");
    
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
    
    // Mostra as linhas HR entre login/registro
    linhasHR.forEach(linha => {
      linha.style.display = "block";
    });
    
    // Mostra mensagem de não logado
    mostrarNaoLogado();
  }
});

// Modal de usuário
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

// ==================== MOSTRAR NÃO LOGADO ====================
function mostrarNaoLogado() {
  loading.style.display = "none";
  naoLogado.style.display = "block";
  vazioFavoritos.style.display = "none";
  listaFavoritos.style.display = "none";
}

// ==================== CARREGAR FAVORITOS ====================
async function carregarFavoritos(user) {
  console.log("📂 Carregando favoritos do usuário:", user.uid);
  
  try {
    // Busca favoritos do usuário
    const favoritosDoc = await getDoc(doc(db, "favoritos", user.uid));
    
    if (!favoritosDoc.exists() || !favoritosDoc.data().imoveis || favoritosDoc.data().imoveis.length === 0) {
      // Não tem favoritos
      loading.style.display = "none";
      vazioFavoritos.style.display = "block";
      listaFavoritos.style.display = "none";
      console.log("💔 Nenhum favorito encontrado");
      return;
    }
    
    const favoritosIds = favoritosDoc.data().imoveis;
    console.log(`❤️ ${favoritosIds.length} favoritos encontrados`);
    
    // Busca detalhes de cada imóvel
    const imoveis = [];
    for (const imovelId of favoritosIds) {
      try {
        const imovelDoc = await getDoc(doc(db, "imoveis", imovelId));
        if (imovelDoc.exists()) {
          const data = imovelDoc.data();
          data.id = imovelId;
          imoveis.push(data);
        }
      } catch (err) {
        console.error(`Erro ao buscar imóvel ${imovelId}:`, err);
      }
    }
    
    if (imoveis.length === 0) {
      loading.style.display = "none";
      vazioFavoritos.style.display = "block";
      listaFavoritos.style.display = "none";
      return;
    }
    
    // Exibe favoritos
    exibirFavoritos(imoveis, user.uid);
    
  } catch (error) {
    console.error("❌ Erro ao carregar favoritos:", error);
    loading.innerHTML = `<p style="color: red;">Erro ao carregar favoritos: ${error.message}</p>`;
  }
}

// ==================== EXIBIR FAVORITOS ====================
function exibirFavoritos(imoveis, userId) {
  console.log("📋 Exibindo", imoveis.length, "favoritos");
  
  loading.style.display = "none";
  naoLogado.style.display = "none";
  vazioFavoritos.style.display = "none";
  listaFavoritos.style.display = "grid";
  
  // Contador
  const contadorDiv = document.createElement('div');
  contadorDiv.className = 'contador-favoritos';
  contadorDiv.innerHTML = `
    <div style="display: flex; align-items: center;">
      <span class="numero">${imoveis.length}</span>
      <span class="texto">imóve${imoveis.length === 1 ? 'l' : 'is'} favoritado${imoveis.length === 1 ? '' : 's'}</span>
    </div>
  `;
  listaFavoritos.parentElement.insertBefore(contadorDiv, listaFavoritos);
  
  // Cards dos imóveis
  listaFavoritos.innerHTML = '';
  
  imoveis.forEach(imovel => {
    const card = document.createElement('div');
    card.className = 'favorito-card';
    
    card.innerHTML = `
      <div class="favorito-card-image">
        <img src="${imovel.imagemURL || './img/logo1.png'}" 
             alt="${imovel.nome}"
             onerror="this.src='./img/logo1.png'">
        <button class="btn-remover-favorito" onclick="removerFavorito('${imovel.id}', '${userId}')">
          ♥
        </button>
      </div>
      
      <div class="favorito-card-content">
        <h3>${imovel.nome || 'Sem nome'}</h3>
        
        <div class="favorito-info">
          📍 ${imovel.cidade || 'N/A'} - ${imovel.uf || ''}
        </div>
        
        <div class="favorito-info">
          💰 R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}
        </div>
        
        <div class="favorito-info">
          📏 ${imovel.areas || 0}m²
        </div>
        
        <div class="favorito-detalhes">
          <span>🛏️ ${imovel.quartos || 0}</span>
          <span>🚗 ${imovel.vagas || 0}</span>
          <span>🚿 ${imovel.banheiros || 0}</span>
        </div>
        
        <a href="detalhes.html?id=${imovel.id}" class="btn-ver-detalhes">
          Ver Detalhes
        </a>
      </div>
    `;
    
    listaFavoritos.appendChild(card);
  });
  
  console.log("✅ Favoritos exibidos");
}

// ==================== REMOVER FAVORITO ====================
window.removerFavorito = async function(imovelId, userId) {
  if (!confirm("Deseja remover este imóvel dos favoritos?")) {
    return;
  }
  
  console.log("🗑️ Removendo favorito:", imovelId);
  
  try {
    const favoritosRef = doc(db, "favoritos", userId);
    await updateDoc(favoritosRef, {
      imoveis: arrayRemove(imovelId)
    });
    
    console.log("✅ Favorito removido");
    
    // Recarrega a página
    window.location.reload();
    
  } catch (error) {
    console.error("❌ Erro ao remover favorito:", error);
    alert("Erro ao remover favorito. Tente novamente.");
  }
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM carregado - Página de Favoritos");
});