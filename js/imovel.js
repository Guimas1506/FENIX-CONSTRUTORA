// imovel.js - Carrega e exibe lista de imóveis com paginação
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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

console.log("🔥 Firebase inicializado - Página Imóveis");

// ==================== CONTROLE DE USUÁRIO ====================
const logBtn = document.getElementById("log");
const registerBtn = document.getElementById("register");
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const adminButton = document.getElementById("adminButton");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (logBtn) logBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = `Bem-vindo(a), ${user.displayName || "Usuário"}`;
    if (userEmail) userEmail.textContent = user.email;

    const docRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const isAdmin = docSnap.data().admin || false;
        if (adminButton) adminButton.style.display = isAdmin ? "inline-block" : "none";
      }
    } catch (err) {
      console.error("Erro ao verificar admin:", err);
    }
  } else {
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (logBtn) logBtn.style.display = "flex";
    if (registerBtn) registerBtn.style.display = "flex";
    if (adminButton) adminButton.style.display = "none";
  }
});

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

// ==================== SISTEMA DE CARREGAR MAIS ====================
let todosImoveis = [];
let imoveisExibidos = 0;
let imoveisFiltrados = []; // Lista filtrada pela pesquisa
let favoritosUsuario = []; // IDs dos imóveis favoritados
const IMOVEIS_INICIAIS = 16;
const IMOVEIS_POR_CARREGAMENTO = 8;

// ==================== CARREGAR FAVORITOS DO USUÁRIO ====================
async function carregarFavoritosUsuario() {
  favoritosUsuario = [];
  const user = auth.currentUser;
  
  if (!user) {
    console.log("👤 Usuário não logado - sem favoritos");
    return;
  }
  
  try {
    const favoritosDoc = await getDoc(doc(db, "favoritos", user.uid));
    if (favoritosDoc.exists()) {
      favoritosUsuario = favoritosDoc.data().imoveis || [];
      console.log(`❤️ ${favoritosUsuario.length} favoritos carregados`);
    }
  } catch (err) {
    console.log("Erro ao carregar favoritos:", err);
  }
}

// ==================== FUNÇÃO DE PESQUISA POR NOME ====================
window.pesquisarPorNome = function() {
  const input = document.getElementById("input-pesquisa-nome");
  const btnLimpar = document.getElementById("btn-limpar-pesquisa");
  const termoPesquisa = input.value.toLowerCase().trim();
  
  console.log("🔍 Pesquisando por:", termoPesquisa);
  
  // Mostra/esconde botão de limpar
  btnLimpar.style.display = termoPesquisa ? "block" : "none";
  
  // Aplica todos os filtros
  aplicarTodosFiltros();
}

// Event listener para pesquisa em tempo real
const inputPesquisa = document.getElementById("input-pesquisa-nome");
if (inputPesquisa) {
  inputPesquisa.addEventListener("input", window.pesquisarPorNome);
}

// ==================== APLICAR TODOS OS FILTROS ====================
function aplicarTodosFiltros() {
  console.log("🔍 Aplicando TODOS os filtros...");
  
  const container = document.getElementById("lista-imoveis-pagina");
  
  // Pega valores de todos os filtros
  const termoPesquisa = document.getElementById("input-pesquisa-nome")?.value.toLowerCase().trim() || "";
  const statusSelecionado = document.getElementById("filtro-status")?.value || "";
  const ufSelecionado = document.getElementById("filtro-uf")?.value || "";
  const cidadeSelecionada = document.getElementById("filtro-cidade")?.value || "";
  const areaInput = document.getElementById("filtro-area")?.value;
  const precoInput = document.getElementById("filtro-preco")?.value;
  
  const areaMax = areaInput && areaInput !== "" ? parseFloat(areaInput) : null;
  const precoMax = precoInput && precoInput !== "" ? parseFloat(precoInput) : null;
  
  console.log("📊 Filtros aplicados:", {
    nome: termoPesquisa || "Todos",
    status: statusSelecionado || "Todos",
    uf: ufSelecionado || "Todos",
    cidade: cidadeSelecionada || "Todas",
    areaMax: areaMax ? `até ${areaMax}m²` : "Todas",
    precoMax: precoMax ? `até R$ ${precoMax.toLocaleString('pt-BR')}` : "Todos"
  });
  
  // Filtra imóveis
  imoveisFiltrados = todosImoveis.filter(imovel => {
    // Filtro NOME
    if (termoPesquisa !== "") {
      const nomeImovel = (imovel.nome || "").toLowerCase();
      if (!nomeImovel.includes(termoPesquisa)) {
        return false;
      }
    }
    
    // Filtro STATUS
    if (statusSelecionado !== "") {
      if (imovel.stats !== statusSelecionado) {
        return false;
      }
    }
    
    // Filtro UF
    if (ufSelecionado !== "") {
      if (imovel.uf !== ufSelecionado) {
        return false;
      }
    }
    
    // Filtro CIDADE
    if (cidadeSelecionada !== "") {
      if (imovel.cidade !== cidadeSelecionada) {
        return false;
      }
    }
    
    // Filtro ÁREA
    if (areaMax !== null) {
      const areaImovel = parseFloat(imovel.areas) || 0;
      if (areaImovel > areaMax) {
        return false;
      }
    }
    
    // Filtro PREÇO
    if (precoMax !== null) {
      const precoImovel = parseFloat(imovel.preco) || 0;
      if (precoImovel > precoMax) {
        return false;
      }
    }
    
    return true;
  });
  
  console.log(`✅ Resultado: ${imoveisFiltrados.length} de ${todosImoveis.length} imóveis`);
  
  // Reseta a exibição
  container.innerHTML = '';
  imoveisExibidos = 0;
  
  if (imoveisFiltrados.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1; font-size: 18px;">📭 Nenhum imóvel encontrado com esses filtros.</p>';
    document.getElementById("btn-carregar-mais").style.display = "none";
  } else {
    exibirMaisImoveis(IMOVEIS_INICIAIS);
  }
}

// ==================== LIMPAR TODOS OS FILTROS ====================
function limparTodosFiltros() {
  console.log("🧹 Limpando TODOS os filtros...");
  
  // Limpa pesquisa
  const inputPesquisa = document.getElementById("input-pesquisa-nome");
  const btnLimparPesquisa = document.getElementById("btn-limpar-pesquisa");
  if (inputPesquisa) inputPesquisa.value = "";
  if (btnLimparPesquisa) btnLimparPesquisa.style.display = "none";
  
  // Limpa selects
  const filtroStatus = document.getElementById("filtro-status");
  const filtroUf = document.getElementById("filtro-uf");
  const filtroCidade = document.getElementById("filtro-cidade");
  if (filtroStatus) filtroStatus.value = "";
  if (filtroUf) filtroUf.value = "";
  if (filtroCidade) filtroCidade.value = "";
  
  // Limpa inputs numéricos
  const filtroArea = document.getElementById("filtro-area");
  const filtroPreco = document.getElementById("filtro-preco");
  if (filtroArea) filtroArea.value = "";
  if (filtroPreco) filtroPreco.value = "";
  
  // Reseta lista
  imoveisFiltrados = [...todosImoveis];
  
  // Reseta exibição
  const container = document.getElementById("lista-imoveis-pagina");
  container.innerHTML = '';
  imoveisExibidos = 0;
  exibirMaisImoveis(IMOVEIS_INICIAIS);
}

// ==================== EVENT LISTENERS DOS BOTÕES ====================
const btnAplicarFiltros = document.getElementById("btn-aplicar-filtros");
if (btnAplicarFiltros) {
  btnAplicarFiltros.addEventListener("click", aplicarTodosFiltros);
}

const btnLimparFiltros = document.getElementById("btn-limpar-filtros");
if (btnLimparFiltros) {
  btnLimparFiltros.addEventListener("click", limparTodosFiltros);
}

async function carregarTodosImoveis() {
  console.log("🔍 Carregando TODOS os imóveis...");
  
  const container = document.getElementById("lista-imoveis-pagina");
  console.log("📦 Container encontrado:", container);
  
  if (!container) {
    console.error("❌ Container 'lista-imoveis-pagina' não encontrado!");
    return;
  }
  
  // FORÇA O ESTILO DO CONTAINER
  container.style.cssText = `
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 25px !important;
    padding: 30px !important;
    width: 95% !important;
    margin: 0 auto !important;
  `;
  
  try {
    container.innerHTML = '<p style="text-align: center; padding: 20px; font-size: 18px; grid-column: 1 / -1; color: #666;">⏳ Carregando imóveis...</p>';
    
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    console.log("✅ Documentos encontrados:", querySnapshot.size);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">📭 Nenhum imóvel disponível.</p>';
      return;
    }
    
    todosImoveis = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      todosImoveis.push(data);
    });
    
    imoveisFiltrados = [...todosImoveis]; // Inicializa lista filtrada
    
    console.log(`📊 Total de ${todosImoveis.length} imóveis carregados`);
    
    // Carrega favoritos do usuário
    await carregarFavoritosUsuario();
    
    container.innerHTML = '';
    exibirMaisImoveis(IMOVEIS_INICIAIS);
    
  } catch (error) {
    console.error("❌ ERRO:", error);
    container.innerHTML = `<p style="color: red; text-align: center; padding: 20px; grid-column: 1 / -1;">Erro: ${error.message}</p>`;
  }
}

function exibirMaisImoveis(quantidade) {
  const container = document.getElementById("lista-imoveis-pagina");
  const btnCarregarMais = document.getElementById("btn-carregar-mais");
  
  if (!container) return;
  
  const inicio = imoveisExibidos;
  const fim = Math.min(inicio + quantidade, imoveisFiltrados.length);
  
  console.log(`📄 Adicionando imóveis ${inicio + 1} até ${fim}`);
  
  for (let i = inicio; i < fim; i++) {
    const imovel = imoveisFiltrados[i];
    const imovelId = imovel.id;
    const isFavorited = favoritosUsuario.includes(imovelId);
    
    const card = document.createElement('div');
    card.className = 'imovel-card-usuario';
    
    card.style.cssText = `
      background: white !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      flex-direction: column !important;
      cursor: pointer !important;
    `;
    
    card.innerHTML = `
      <div style="position: relative;">
        <img src="${imovel.imagemURL || './img/logo1.png'}" 
             alt="${imovel.nome}"
             onerror="this.src='./img/logo1.png'"
             style="width: 100%; height: 200px; object-fit: cover; display: block;">
        
        <button onclick="toggleFavorito(event, '${imovelId}')" 
                class="btn-favorito" 
                id="fav-${imovelId}"
                style="position: absolute; top: 10px; right: 10px; background: ${isFavorited ? '#FFE5E5' : 'rgba(255,255,255,0.95)'}; border: 2px solid ${isFavorited ? '#FF0000' : '#FE4F3F'}; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          <span style="color: ${isFavorited ? '#FF0000' : '#FE4F3F'};">${isFavorited ? '♥' : '♡'}</span>
        </button>
      </div>
      
      <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
        <h3 style="margin: 0 0 10px 0; color: #FE4F3F; font-size: 1.2em; font-weight: 700;">
          ${imovel.nome || 'Sem nome'}
        </h3>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          📍 ${imovel.cidade || 'N/A'} - ${imovel.uf || ''}
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          💰 R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          📏 ${imovel.areas || 0}m²
        </p>
        <div style="display: flex; gap: 12px; margin: 10px 0; padding: 10px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
          <span style="font-size: 0.9em; color: #666;">🛏️ ${imovel.quartos || 0}</span>
          <span style="font-size: 0.9em; color: #666;">🚗 ${imovel.vagas || 0}</span>
          <span style="font-size: 0.9em; color: #666;">🚿 ${imovel.banheiros || 0}</span>
        </div>
        <button onclick="window.location.href='detalhes.html?id=${imovelId}'" 
                style="width: 100%; padding: 12px; margin-top: auto; background: #FE4F3F; color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: background 0.3s ease;"
                onmouseover="this.style.background='#e63e2e'"
                onmouseout="this.style.background='#FE4F3F'">
          Ver Detalhes
        </button>
      </div>
    `;
    
    // Hover effect no card
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
    });
    
    container.appendChild(card);
  }
  
  imoveisExibidos = fim;
  
  // Controla botão "Carregar Mais"
  if (btnCarregarMais) {
    if (imoveisExibidos >= imoveisFiltrados.length) {
      btnCarregarMais.style.display = "none";
      console.log("✅ Todos os imóveis foram exibidos");
    } else {
      btnCarregarMais.style.display = "block";
      console.log(`📊 Mostrando ${imoveisExibidos} de ${imoveisFiltrados.length}`);
    }
  }
}

// Event listener do botão "Carregar Mais"
const btnCarregarMais = document.getElementById("btn-carregar-mais");
if (btnCarregarMais) {
  btnCarregarMais.addEventListener("click", () => {
    console.log("🔽 Botão 'Carregar Mais' clicado");
    exibirMaisImoveis(IMOVEIS_POR_CARREGAMENTO);
  });
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM pronto!");
  carregarTodosImoveis();
});