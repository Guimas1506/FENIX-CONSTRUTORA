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
const iconPerson = document.querySelector(".icon-person");
const userArea = document.getElementById("userArea");
const closeUserArea = document.getElementById("closeUserArea");
const welcomeMsg = document.getElementById("welcomeMsg");
const userEmail = document.getElementById("userEmail");
const btnLogoutModal = document.getElementById("btnLogoutModal");
const btnLogoutMobile = document.getElementById("btnLogoutMobile");
const adminButton = document.getElementById("adminButton");

// NOVOS ELEMENTOS DO MENU MOBILE
const userEmailMobile = document.getElementById("userEmailMobile");
const emailTextMobile = document.getElementById("emailTextMobile");

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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuário logado:", user.uid);
    
    // Mostra/esconde elementos quando LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "flex";
    if (btnLogoutMobile) btnLogoutMobile.style.display = "flex";
    if (userButton) userButton.style.display = "flex";
    if (favoritosButton) favoritosButton.style.display = "flex";
    if (usuarioLinkMobile) usuarioLinkMobile.style.display = "flex";
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = "flex";
    if (userEmail) userEmail.textContent = user.email;
    
    // MOSTRA EMAIL NO MENU MOBILE
    if (userEmailMobile) userEmailMobile.style.display = "block";
    if (emailTextMobile) emailTextMobile.textContent = user.email;
    
    // Esconde login e registro quando logado
    linksModal.forEach(link => {
      if (link.href && link.href.includes("log-in.html")) {
        link.style.display = "none";
      }
      if (link.href && link.href.includes("sign-in.html")) {
        link.style.display = "none";
      }
    });
    
    // Esconde login e sign-in também no menu mobile
    if (loginLinkMobile) loginLinkMobile.style.display = "none";
    if (signinLinkMobile) signinLinkMobile.style.display = "none";

    // Busca nome e status de admin do usuário
    let nome = user.displayName || "Usuário";
    let photoURL = user.photoURL || null;
    let isAdmin = false;
    const DEFAULT_PHOTO = 'img/icon-usuario.png';

    try {
      // Verifica os Custom Claims para admin
      const tokenResult = await user.getIdTokenResult();
      isAdmin = tokenResult.claims.admin === true;
      console.log("🔐 Custom Claims:", tokenResult.claims);

      // Tenta primeiro na coleção "usuarios" (onde a foto é salva)
      let docRef = doc(db, "usuarios", user.uid);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        nome = data.nome || nome;
        // Se não tiver admin nos custom claims, verifica no Firestore
        if (!isAdmin && data.admin) isAdmin = data.admin;
        // Busca photoURL - se for null, usa a imagem padrão
        if (data.photoURL && data.photoURL !== null) {
          photoURL = data.photoURL;
        } else {
          photoURL = DEFAULT_PHOTO;
        }
        console.log("📊 Dados do usuário:", data);
        console.log("👑 Admin?", isAdmin);
      } else {
        // Se não existir, tenta na coleção "users"
        docRef = doc(db, "users", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nome = data.nome || nome;
          if (!isAdmin && data.admin) isAdmin = data.admin;
          if (data.photoURL && data.photoURL !== null) {
            photoURL = data.photoURL;
          } else {
            photoURL = DEFAULT_PHOTO;
          }
          console.log("📊 Dados do usuário (users):", data);
          console.log("👑 Admin?", isAdmin);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      photoURL = DEFAULT_PHOTO;
    }

    // Se ainda não tem foto, usa a padrão
    if (!photoURL) {
      photoURL = DEFAULT_PHOTO;
    }

    // Atualiza foto de perfil no header e no modal
    const profilePhotoHeader = document.getElementById("profilePhotoHeader");
    const profilePhotoModal = document.getElementById("profilePhotoModal");
    
    if (profilePhotoHeader) {
      profilePhotoHeader.src = photoURL;
      // Se não for a foto padrão, aplica o estilo circular
      if (photoURL !== DEFAULT_PHOTO) {
        profilePhotoHeader.style.borderRadius = "50%";
        profilePhotoHeader.style.objectFit = "cover";
      }
    }
    
    if (profilePhotoModal) {
      profilePhotoModal.src = photoURL;
      profilePhotoModal.style.borderRadius = "50%";
      profilePhotoModal.style.objectFit = "cover";
      profilePhotoModal.style.width = "100px";
      profilePhotoModal.style.height = "100px";
      profilePhotoModal.style.marginBottom = "15px";
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
    console.log("❌ Usuário não logado");
    
    // Mostra/esconde elementos quando NÃO LOGADO
    if (btnLogoutModal) btnLogoutModal.style.display = "none";
    if (btnLogoutMobile) btnLogoutMobile.style.display = "none";
    if (adminButton) adminButton.style.display = "none";
    if (userButton) userButton.style.display = "none";
    if (favoritosButton) favoritosButton.style.display = "none";
    if (usuarioLinkMobile) usuarioLinkMobile.style.display = "none";
    if (favoritosLinkMobile) favoritosLinkMobile.style.display = "none";
    if (welcomeMsg) welcomeMsg.textContent = "Bem-vindo(a), Usuário";
    if (userEmail) userEmail.textContent = "Email do usuário";
    
    // ESCONDE EMAIL NO MENU MOBILE
    if (userEmailMobile) userEmailMobile.style.display = "none";
    if (emailTextMobile) emailTextMobile.textContent = "";
    
    // Reseta fotos de perfil quando não logado
    const profilePhotoHeader = document.getElementById("profilePhotoHeader");
    const profilePhotoModal = document.getElementById("profilePhotoModal");
    
    if (profilePhotoHeader) {
      profilePhotoHeader.src = 'img/icon-usuario.png';
      profilePhotoHeader.style.borderRadius = "0";
      profilePhotoHeader.style.objectFit = "contain";
      profilePhotoHeader.style.width = "45px";
      profilePhotoHeader.style.height = "45px";
    }
    
    if (profilePhotoModal) {
      profilePhotoModal.src = 'img/icon-usuario.png';
      profilePhotoModal.style.borderRadius = "0";
      profilePhotoModal.style.objectFit = "contain";
    }
    
    // Mostra login e registro quando não logado
    linksModal.forEach(link => {
      if (link.href && link.href.includes("log-in.html")) {
        link.style.display = "flex";
      }
      if (link.href && link.href.includes("sign-in.html")) {
        link.style.display = "flex";
      }
    });
    
    // Mostra login e sign-in também no menu mobile
    if (loginLinkMobile) loginLinkMobile.style.display = "flex";
    if (signinLinkMobile) signinLinkMobile.style.display = "flex";
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

// Logout Mobile
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
  
  if (!user) {
    alert("Por favor, faça login para favoritar imóveis!");
    if (userArea) userArea.style.display = "flex";
    return;
  }
  //alert de produto adicionado
  try {
    const btnCheck = document.getElementById(`fav-${id}`);
    if (btnCheck) {
      const spanCheck = btnCheck.querySelector('span');
      if (spanCheck) {
        const computed = getComputedStyle(spanCheck).color || '';
        const normalized = computed.replace(/\s+/g, '').toLowerCase();
        const isFE4F3F = normalized === 'rgb(254,79,63)' || normalized === 'rgba(254,79,63,1)' || normalized === '#fe4f3f';
        if (isFE4F3F) {
          alert('Produto adicionado!');
        }
      }
    }
  } catch (e) {
    console.error('Erro ao verificar cor do span:', e);
  }
  //aqui acaba o alert
  const btn = document.getElementById(`fav-${id}`);
  if (!btn) return;
  
  const span = btn.querySelector('span');
  const isFavorited = span.textContent === '♥';
  
  try {
    const { doc: docRef, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
    
    const favoritosRef = docRef(db, "favoritos", user.uid);
    const favoritosSnap = await getDoc(favoritosRef);
    
    if (isFavorited) {
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

let todosImoveis = [];
let imoveisExibidos = 0;
let imoveisFiltrados = [];
let favoritosUsuario = [];
const IMOVEIS_INICIAIS = 16;
const IMOVEIS_POR_CARREGAMENTO = 8;

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

window.pesquisarPorNome = function() {
  const input = document.getElementById("input-pesquisa-nome");
  const btnLimpar = document.getElementById("btn-limpar-pesquisa");
  const termoPesquisa = input.value.toLowerCase().trim();
  
  console.log("🔍 Pesquisando por:", termoPesquisa);
  
  btnLimpar.style.display = termoPesquisa ? "block" : "none";
  
  aplicarTodosFiltros();
}

const inputPesquisa = document.getElementById("input-pesquisa-nome");
if (inputPesquisa) {
  inputPesquisa.addEventListener("input", window.pesquisarPorNome);
}

function aplicarTodosFiltros() {
  console.log("🔍 Aplicando TODOS os filtros...");
  
  const container = document.getElementById("lista-imoveis-pagina");
  
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
  
  imoveisFiltrados = todosImoveis.filter(imovel => {
    if (termoPesquisa !== "") {
      const nomeImovel = (imovel.nome || "").toLowerCase();
      if (!nomeImovel.includes(termoPesquisa)) {
        return false;
      }
    }
    
    if (statusSelecionado !== "") {
      if (imovel.stats !== statusSelecionado) {
        return false;
      }
    }
    
    if (ufSelecionado !== "") {
      if (imovel.uf !== ufSelecionado) {
        return false;
      }
    }
    
    if (cidadeSelecionada !== "") {
      if (imovel.cidade !== cidadeSelecionada) {
        return false;
      }
    }
    
    if (areaMax !== null) {
      const areaImovel = parseFloat(imovel.areas) || 0;
      if (areaImovel > areaMax) {
        return false;
      }
    }
    
    if (precoMax !== null) {
      const precoImovel = parseFloat(imovel.preco) || 0;
      if (precoImovel > precoMax) {
        return false;
      }
    }
    
    return true;
  });
  
  console.log(`✅ Resultado: ${imoveisFiltrados.length} de ${todosImoveis.length} imóveis`);
  
  container.innerHTML = '';
  imoveisExibidos = 0;
  
  if (imoveisFiltrados.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1; font-size: 18px;">📭 Nenhum imóvel encontrado com esses filtros.</p>';
    document.getElementById("btn-carregar-mais").style.display = "none";
  } else {
    exibirMaisImoveis(IMOVEIS_INICIAIS);
  }
}

function limparTodosFiltros() {
  console.log("🧹 Limpando TODOS os filtros...");
  
  const inputPesquisa = document.getElementById("input-pesquisa-nome");
  const btnLimparPesquisa = document.getElementById("btn-limpar-pesquisa");
  if (inputPesquisa) inputPesquisa.value = "";
  if (btnLimparPesquisa) btnLimparPesquisa.style.display = "none";
  
  const filtroStatus = document.getElementById("filtro-status");
  const filtroUf = document.getElementById("filtro-uf");
  const filtroCidade = document.getElementById("filtro-cidade");
  if (filtroStatus) filtroStatus.value = "";
  if (filtroUf) filtroUf.value = "";
  if (filtroCidade) filtroCidade.value = "";
  
  const filtroArea = document.getElementById("filtro-area");
  const filtroPreco = document.getElementById("filtro-preco");
  if (filtroArea) filtroArea.value = "";
  if (filtroPreco) filtroPreco.value = "";
  
  imoveisFiltrados = [...todosImoveis];
  
  const container = document.getElementById("lista-imoveis-pagina");
  container.innerHTML = '';
  imoveisExibidos = 0;
  exibirMaisImoveis(IMOVEIS_INICIAIS);
}
// Mostra um popup quando o botão "Aplicar Filtros" for pressionado
const btnAplicarFiltrosPopup = document.getElementById("btn-aplicar-filtros");
if (btnAplicarFiltrosPopup) {
  btnAplicarFiltrosPopup.addEventListener("click", () => {
    alert("Filtros aplicados");
  });
}
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
   const btnLimparFiltros = document.getElementById("btn-limpar-filtros");
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener("click", () => {
      alert("Filtros limpos");
      limparTodosFiltros();
    });
  }
  // REMOVIDO: Não aplicar estilos inline aqui - deixar o CSS controlar
  
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
    
    imoveisFiltrados = [...todosImoveis];
    
    console.log(`📊 Total de ${todosImoveis.length} imóveis carregados`);
    
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
    
    // REMOVIDO: Estilos inline - deixar o CSS controlar completamente
    
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
    
    container.appendChild(card);
  }
  
  imoveisExibidos = fim;
  
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

const btnCarregarMais = document.getElementById("btn-carregar-mais");
if (btnCarregarMais) {
  btnCarregarMais.addEventListener("click", () => {
    console.log("🔽 Botão 'Carregar Mais' clicado");
    exibirMaisImoveis(IMOVEIS_POR_CARREGAMENTO);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM pronto!");
  carregarTodosImoveis();
});
