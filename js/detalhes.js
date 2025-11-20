// detalhes.js - Carrega e exibe detalhes completos do imóvel
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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

console.log("🔥 Firebase inicializado - Página de Detalhes");

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
const btnFavorito = document.getElementById("btn-favorito");
const iconeFav = document.getElementById("icone-fav");
let imovelAtualId = null; // Guarda o ID do imóvel atual

async function configurarBotaoFavoritar(imovelId) {
  imovelAtualId = imovelId;
  
  if (!btnFavorito || !iconeFav) return;
  
  // Carrega estado inicial do favorito
  const user = auth.currentUser;
  if (user) {
    try {
      const favoritosDoc = await getDoc(doc(db, "favoritos", user.uid));
      if (favoritosDoc.exists()) {
        const favoritos = favoritosDoc.data().imoveis || [];
        const isFavorited = favoritos.includes(imovelId);
        
        if (isFavorited) {
          iconeFav.textContent = '♥';
          iconeFav.style.color = '#FF0000';
          btnFavorito.style.background = '#FFE5E5';
          btnFavorito.style.borderColor = '#FF0000';
        }
      }
    } catch (err) {
      console.log("Erro ao carregar favorito:", err);
    }
  }
  
  // Adiciona evento de clique
  btnFavorito.addEventListener("click", async () => {
    const user = auth.currentUser;
    
    // Verifica se está logado
    if (!user) {
      alert("Por favor, faça login para favoritar imóveis!");
      if (userArea) userArea.style.display = "flex";
      return;
    }
    
    const isFavorited = iconeFav.textContent === '♥';
    
    try {
      const { doc: docRef, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
      
      const favoritosRef = docRef(db, "favoritos", user.uid);
      const favoritosSnap = await getDoc(favoritosRef);
      
      if (isFavorited) {
        // DESFAVORITAR
        if (favoritosSnap.exists()) {
          await updateDoc(favoritosRef, {
            imoveis: arrayRemove(imovelAtualId)
          });
        }
        
        iconeFav.textContent = '♡';
        iconeFav.style.color = '#FE4F3F';
        btnFavorito.style.background = 'white';
        btnFavorito.style.borderColor = '#FE4F3F';
        console.log("💔 DESFAVORITADO!");
        
      } else {
        // FAVORITAR
        if (favoritosSnap.exists()) {
          await updateDoc(favoritosRef, {
            imoveis: arrayUnion(imovelAtualId)
          });
        } else {
          await setDoc(favoritosRef, {
            imoveis: [imovelAtualId],
            userId: user.uid
          });
        }
        
        iconeFav.textContent = '♥';
        iconeFav.style.color = '#FF0000';
        btnFavorito.style.background = '#FFE5E5';
        btnFavorito.style.borderColor = '#FF0000';
        console.log("❤️ FAVORITADO!");
      }
      
      // Animação
      btnFavorito.style.transform = 'scale(1.1)';
      setTimeout(() => {
        btnFavorito.style.transform = 'scale(1)';
      }, 200);
      
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      alert("Erro ao favoritar. Tente novamente.");
    }
  });
}

// ==================== CARREGAR DETALHES DO IMÓVEL ====================
let imagensImovel = [];
let imagemAtualIndex = 0;

async function carregarDetalhesImovel() {
  const urlParams = new URLSearchParams(window.location.search);
  const imovelId = urlParams.get('id');

  console.log("🔍 ID do imóvel:", imovelId);

  if (!imovelId) {
    document.getElementById("loading").innerHTML = `
      <p style="color: #FF4444;">❌ Nenhum imóvel foi selecionado.</p>
      <a href="Imovel.html" style="color: #FE4F3F; text-decoration: underline;">Voltar para a lista de imóveis</a>
    `;
    return;
  }

  try {
    const docRef = doc(db, "imoveis", imovelId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      document.getElementById("loading").innerHTML = `
        <p style="color: #FF4444;">❌ Imóvel não encontrado.</p>
        <a href="Imovel.html" style="color: #FE4F3F; text-decoration: underline;">Voltar para a lista de imóveis</a>
      `;
      return;
    }

    const imovel = docSnap.data();
    console.log("✅ Imóvel carregado:", imovel);

    // Carrega galeria de imagens
    imagensImovel = imovel.imagens || [imovel.imagemURL] || ['./img/logo1.png'];
    imagensImovel = imagensImovel.filter(url => url); // Remove vazios
    
    if (imagensImovel.length === 0) {
      imagensImovel = ['./img/logo1.png'];
    }
    
    configurarGaleria();
    
    // Restante dos dados...
    document.getElementById("nome-imovel").textContent = imovel.nome || 'Sem nome';
    document.getElementById("localizacao-completa").textContent = `${imovel.cidade || 'N/A'} - ${imovel.uf || ''}`;
    document.getElementById("preco-imovel").textContent = `R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}`;
    
    // Status
    const statusTexto = document.getElementById("status-texto");
    const prazoTexto = document.getElementById("prazo-texto");
    statusTexto.textContent = imovel.stats || 'N/A';
    
    if (imovel.dia) {
      const dataFormatada = new Date(imovel.dia + 'T00:00:00').toLocaleDateString('pt-BR');
      prazoTexto.textContent = `Previsão: ${dataFormatada}`;
      prazoTexto.style.display = 'inline';
    } else {
      prazoTexto.style.display = 'none';
    }

    // Características
    document.getElementById("plantas-num").textContent = imovel.plantas || 0;
    document.getElementById("area-num").textContent = imovel.areas || 0;
    document.getElementById("quartos-num").textContent = imovel.quartos || 0;
    document.getElementById("vagas-num").textContent = imovel.vagas || 0;
    document.getElementById("banheiros-num").textContent = imovel.banheiros || 0;

    // Descrição
    document.getElementById("descricao-texto").textContent = imovel.descricao || 'Sem descrição disponível.';

    // Endereço
    document.getElementById("endereco-rua").textContent = imovel.endereco || 'Endereço não informado';
    document.getElementById("endereco-cidade").textContent = `${imovel.cidade || 'N/A'} - ${imovel.uf || ''}`;

    // Características extras
    const extrasLista = document.getElementById("extras-lista");
    const extrasSection = document.getElementById("extras-section");
    const extras = [];
    
    if (imovel.piscina) extras.push('🏊 Piscina');
    if (imovel.churras) extras.push('🍖 Churrasqueira');
    if (imovel.fit) extras.push('💪 Academia');

    if (extras.length > 0) {
      extrasLista.innerHTML = extras.map(e => `<div class="extra-item">${e}</div>`).join('');
      extrasSection.style.display = 'block';
    } else {
      extrasSection.style.display = 'none';
    }

    // Esconde loading e mostra conteúdo
    document.getElementById("loading").style.display = "none";
    document.getElementById("conteudo-imovel").style.display = "block";

    // Configura botão de favoritar
    configurarBotaoFavoritar(imovelId);

    // Configura botão do WhatsApp
    configurarBotaoWhatsApp(imovel.nome, imovelId);

    // Carrega imóveis similares
    carregarImoveisSimilares(imovel.cidade, imovel.uf, imovelId);

  } catch (error) {
    console.error("❌ Erro ao carregar imóvel:", error);
    document.getElementById("loading").innerHTML = `
      <p style="color: #FF4444;">❌ Erro ao carregar o imóvel: ${error.message}</p>
      <a href="Imovel.html" style="color: #FE4F3F; text-decoration: underline;">Voltar para a lista de imóveis</a>
    `;
  }
}

// ==================== CONFIGURAR GALERIA DE IMAGENS ====================
function configurarGaleria() {
  const imgDestaque = document.getElementById("imagem-destaque");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const indicador = document.getElementById("indicador-imagens");
  const imgAtual = document.getElementById("imagem-atual");
  const totalImgs = document.getElementById("total-imagens");
  const miniaturasContainer = document.getElementById("miniaturas-container");
  
  console.log(`📷 ${imagensImovel.length} imagens encontradas`);
  
  // Mostra primeira imagem
  imgDestaque.src = imagensImovel[0];
  imgDestaque.onerror = function() {
    this.src = './img/logo1.png';
  };
  
  // Se houver mais de 1 imagem, mostra controles
  if (imagensImovel.length > 1) {
    btnPrev.style.display = "flex";
    btnNext.style.display = "flex";
    indicador.style.display = "block";
    miniaturasContainer.style.display = "flex";
    
    totalImgs.textContent = imagensImovel.length;
    
    // Cria miniaturas
    imagensImovel.forEach((url, index) => {
      const miniatura = document.createElement('div');
      miniatura.className = 'miniatura' + (index === 0 ? ' ativa' : '');
      miniatura.innerHTML = `<img src="${url}" alt="Imagem ${index + 1}" onerror="this.src='./img/logo1.png'">`;
      miniatura.onclick = () => mudarImagem(index);
      miniaturasContainer.appendChild(miniatura);
    });
    
    // Eventos dos botões
    btnPrev.onclick = () => mudarImagem(imagemAtualIndex - 1);
    btnNext.onclick = () => mudarImagem(imagemAtualIndex + 1);
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') mudarImagem(imagemAtualIndex - 1);
      if (e.key === 'ArrowRight') mudarImagem(imagemAtualIndex + 1);
    });
  }
}

function mudarImagem(novoIndex) {
  // Garante que o índice está no range válido
  if (novoIndex < 0) novoIndex = imagensImovel.length - 1;
  if (novoIndex >= imagensImovel.length) novoIndex = 0;
  
  imagemAtualIndex = novoIndex;
  
  // Atualiza imagem principal
  const imgDestaque = document.getElementById("imagem-destaque");
  imgDestaque.src = imagensImovel[novoIndex];
  
  // Atualiza indicador
  document.getElementById("imagem-atual").textContent = novoIndex + 1;
  
  // Atualiza miniaturas
  document.querySelectorAll('.miniatura').forEach((mini, index) => {
    if (index === novoIndex) {
      mini.classList.add('ativa');
    } else {
      mini.classList.remove('ativa');
    }
  });
  
  console.log(`📷 Imagem ${novoIndex + 1} de ${imagensImovel.length}`);
}

// ==================== CONFIGURAR BOTÃO WHATSAPP ====================
function configurarBotaoWhatsApp(nomeImovel, imovelId) {
  const btnWhatsApp = document.getElementById("btn-whatsapp");
  const numeroWhatsApp = "5511992788458"; // Número do WhatsApp (sem espaços, hífens ou +)
  
  if (!btnWhatsApp) return;
  
  btnWhatsApp.addEventListener("click", () => {
    const user = auth.currentUser;
    
    // Verifica se o usuário está logado
    if (!user) {
      alert("Por favor, faça login para entrar em contato via WhatsApp.");
      // Abre o modal de login
      if (userArea) userArea.style.display = "flex";
      return;
    }
    
    // Pega informações do usuário
    const nomeUsuario = user.displayName || "Usuário";
    const emailUsuario = user.email;
    
    // Link do imóvel (URL atual)
    const linkImovel = window.location.href;
    
    // Monta a mensagem
    const mensagem = `Olá, sou ${nomeUsuario} e estou interessado(a) no ${nomeImovel}. Link: ${linkImovel}. Meu email de contato é ${emailUsuario}`;
    
    // Codifica a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Monta o link do WhatsApp
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
    
    // Abre o WhatsApp em nova aba
    window.open(linkWhatsApp, '_blank');
    
    console.log("📱 Redirecionando para WhatsApp:", linkWhatsApp);
  });
}

// ==================== CARREGAR IMÓVEIS SIMILARES ====================
async function carregarImoveisSimilares(cidade, uf, imovelAtualId) {
  const listaSimilares = document.getElementById("lista-similares");
  
  try {
    // Busca imóveis da mesma cidade/estado
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    const similares = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== imovelAtualId && (data.cidade === cidade || data.uf === uf)) {
        data.id = doc.id;
        similares.push(data);
      }
    });

    if (similares.length === 0) {
      listaSimilares.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1;">Nenhum imóvel similar encontrado.</p>';
      return;
    }

    // Limita a 4 imóveis similares
    const imoveisExibir = similares.slice(0, 4);

    listaSimilares.innerHTML = imoveisExibir.map(imovel => `
      <div class="card-similar" onclick="window.location.href='detalhes.html?id=${imovel.id}'">
        <img src="${imovel.imagemURL || './img/logo1.png'}" 
             alt="${imovel.nome}"
             onerror="this.src='./img/logo1.png'">
        <div class="info-similar">
          <h4>${imovel.nome}</h4>
          <p>📍 ${imovel.cidade} - ${imovel.uf}</p>
          <p class="preco-similar">R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error("❌ Erro ao carregar similares:", error);
    listaSimilares.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1;">Erro ao carregar imóveis similares.</p>';
  }
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM pronto! Carregando detalhes...");
  carregarDetalhesImovel();
});