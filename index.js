// -------------------- Carrossel --------------------
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

// -------------------- Firebase --------------------
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

// -------------------- Elementos --------------------
const headerLogin = document.getElementById("header-login");
const userMenu = document.querySelector(".displau-subs");

const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");

// Botão admin (pode não existir em todas páginas)
const adminButton = document.getElementById("adminButton");

// -------------------- Estado do usuário --------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("UID do usuário:", user.uid);

    // Usuário logado
    headerLogin && (headerLogin.style.display = "none");

    const docRef = doc(db, "users", user.uid);
    let nome = user.displayName || user.email;
    let isAdmin = false;

    try {
      const docSnap = await getDoc(docRef);
      console.log("Documento encontrado:", docSnap.exists());
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Dados do usuário:", data);
        nome = data.nome || nome;
        isAdmin = data.admin || false;
      }
    } catch (err) {
      console.error("Erro ao pegar dados do usuário:", err);
    }

    // Atualiza informações no modal/header
    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${nome}`;
    if (userEmail) userEmail.textContent = user.email;

    // Mostrar ou ocultar botão de admin
    if (adminButton) adminButton.style.display = isAdmin ? "inline-block" : "none";

    // Modal mostra só o botão de logout
    if (userArea) {
      const logBtn = userArea.querySelector("#log");
      const registerBtn = userArea.querySelector("#register");
      logBtn.style.display = "none";
      registerBtn.style.display = "none";
      btnLogoutModal.style.display = "flex";
    }

  } else {
    // Usuário não logado
    headerLogin && (headerLogin.style.display = "flex");

    // Modal mostra os botões de login e cadastro
    if (userArea) {
      const logBtn = userArea.querySelector("#log");
      const registerBtn = userArea.querySelector("#register");
      logBtn.style.display = "flex";
      registerBtn.style.display = "flex";
      btnLogoutModal.style.display = "none";
      welcomeMsg.textContent = "Bem-vindo(a), Usuário";
      userEmail.textContent = "Email do usuário";
    }

    // Botão admin sempre escondido
    if (adminButton) adminButton.style.display = "none";
  }
});

// -------------------- Modal usuário --------------------
// Abrir modal
iconPerson && iconPerson.addEventListener("click", () => {
  if (userArea) userArea.style.display = "flex";
});

// Fechar modal
closeUserArea && closeUserArea.addEventListener("click", () => {
  if (userArea) userArea.style.display = "none";
});

// Fechar clicando fora
window.addEventListener("click", (e) => {
  if (e.target === userArea) userArea.style.display = "none";
});

// Logout
btnLogoutModal && btnLogoutModal.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logout realizado!");
      window.location.reload();
    })
    .catch((err) => alert(err.message));
});

// -------------------- CARREGAR IMÓVEIS --------------------
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

async function carregarImoveisUsuario() {
  console.log("🔍 Função carregarImoveisUsuario foi chamada");
  
  const container = document.getElementById("lista-imoveis-usuario");
  console.log("📦 Container encontrado:", container);
  
  if (!container) {
    console.error("❌ Container 'lista-imoveis-usuario' não foi encontrado no HTML!");
    return;
  }
  
  try {
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666; font-size: 18px;">⏳ Carregando imóveis...</p>';
    
    console.log("🔥 Buscando imóveis no Firebase...");
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    console.log("✅ Total de imóveis encontrados:", querySnapshot.size);
    
    if (querySnapshot.empty) {
      console.warn("⚠️ Nenhum imóvel encontrado na coleção");
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; font-size: 18px;">📭 Nenhum imóvel disponível no momento.</p>';
      return;
    }
    
    container.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const imovel = doc.data();
      console.log("🏠 Imóvel carregado:", imovel);
      const card = criarCardUsuario(imovel, doc.id);
      container.appendChild(card);
    });
    
    console.log("✨ Imóveis carregados com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao carregar imóveis:", error);
    container.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">❌ Erro: ${error.message}</p>`;
  }
}

function criarCardUsuario(imovel, id) {
  const card = document.createElement('div');
  card.className = 'imovel-card-usuario';
  
  card.innerHTML = `
    <img src="${imovel.imagemURL || './img/placeholder.png'}" alt="${imovel.nome}" onerror="this.src='./img/logo1.png'">
    <div class="card-content">
      <h3>${imovel.nome || 'Imóvel Sem Nome'}</h3>
      <p><strong>📍</strong> ${imovel.cidade || 'N/A'} - ${imovel.uf || ''}</p>
      <p><strong>💰</strong> R$ ${imovel.preco ? Number(imovel.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</p>
      <p><strong>📏</strong> ${imovel.areas || '0'}m²</p>
      <div class="card-detalhes">
        <span>🛏️ ${imovel.quartos || 0} quartos</span>
        <span>🚗 ${imovel.vagas || 0} vagas</span>
        <span>🚿 ${imovel.banheiros || 0} banheiros</span>
      </div>
      <button onclick="verDetalhesImovel('${id}')">Ver Detalhes</button>
    </div>
  `;
  
  return card;
}

window.verDetalhesImovel = function(id) {
  console.log("👀 Ver detalhes do imóvel:", id);
  alert('Ver detalhes do imóvel ID: ' + id);
}

// TENTA CARREGAR IMEDIATAMENTE
console.log("🚀 Script index.js carregado!");
carregarImoveisUsuario();

// E TAMBÉM quando o DOM estiver pronto (dupla garantia)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM carregado, tentando novamente...");
    carregarImoveisUsuario();
  });
} else {
  console.log("📄 DOM já estava pronto");
}