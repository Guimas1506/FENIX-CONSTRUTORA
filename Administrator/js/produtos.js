// Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Config Firebase
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
const storage = getStorage(app);
const auth = getAuth(app);

// Container de imóveis
const container = document.getElementById("lista-imoveis-container");
let listaImoveis = [];
let listaFiltradaAtual = []; // Lista após aplicar TODOS os filtros

// ==================== FUNÇÃO DE PESQUISA POR NOME ====================
window.pesquisarPorNomeAdmin = function() {
  const input = document.getElementById("input-pesquisa-nome-admin");
  const btnLimpar = document.getElementById("btn-limpar-pesquisa-admin");
  
  if (!input || !btnLimpar) {
    console.error("Elementos de pesquisa não encontrados!");
    return;
  }
  
  const termoPesquisa = input.value.toLowerCase().trim();
  
  console.log("🔍 Admin - Pesquisando por:", termoPesquisa);
  
  // Mostra/esconde botão de limpar
  btnLimpar.style.display = termoPesquisa ? "block" : "none";
  
  // Reaplica todos os filtros incluindo o nome
  aplicarFiltros();
}

// INICIALIZA Event listener quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM carregado - Configurando event listeners");
  
  const inputPesquisaAdmin = document.getElementById("input-pesquisa-nome-admin");
  if (inputPesquisaAdmin) {
    inputPesquisaAdmin.addEventListener("input", window.pesquisarPorNomeAdmin);
    console.log("✅ Event listener da pesquisa configurado");
  } else {
    console.error("❌ Input de pesquisa não encontrado no DOM");
  }
});

// Função para mostrar imóveis COM GRID DE 4 COLUNAS
function mostrarImoveis(lista) {
  console.log("📋 Mostrando", lista.length, "imóveis");
  container.innerHTML = "";
  
  if (lista.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; font-size: 1.1em; grid-column: 1 / -1;">Nenhum imóvel encontrado com os filtros aplicados.</p>';
    return;
  }
  
  // GRID COM 4 COLUNAS
  container.setAttribute('style', 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; padding: 30px; width: 93%; margin: 0 auto;');
  
  lista.forEach((data) => {
    const card = document.createElement("div");
    card.setAttribute('style', 'background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1); display: flex; flex-direction: column;');

    card.innerHTML = `
      <img src="${data.imagemURL || 'img/placeholder.png'}" 
           alt="${data.nome}"
           onerror="this.src='img/logo1.png'"
           style="width: 100%; height: 200px; object-fit: cover; display: block;">
      
      <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
        <h3 style="margin: 0 0 10px 0; color: #FE4F3F; font-size: 1.2em; font-weight: 700;">
          ${data.nome}
        </h3>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          <strong>Cidade:</strong> ${data.cidade} - ${data.uf}
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          <strong>Endereço:</strong> ${data.endereco}
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          <strong>Preço:</strong> R$ ${Number(data.preco || 0).toLocaleString('pt-BR')}
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          <strong>Área:</strong> ${data.areas || 0}m²
        </p>
        <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
          <strong>Status:</strong> ${data.stats || 'N/A'}
        </p>
        
        <div style="display: flex; gap: 12px; margin: 10px 0; padding: 10px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
          <span style="font-size: 0.9em; color: #666;">🛏️ ${data.quartos || 0}</span>
          <span style="font-size: 0.9em; color: #666;">🚗 ${data.vagas || 0}</span>
          <span style="font-size: 0.9em; color: #666;">🚿 ${data.banheiros || 0}</span>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: auto;">
          <button class="btn-editar-admin" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Editar
          </button>
          <button class="btn-excluir-admin" style="flex: 1; padding: 10px; background: #f44336; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Excluir
          </button>
        </div>
      </div>
    `;

    const btnEditar = card.querySelector(".btn-editar-admin");
    const btnExcluir = card.querySelector(".btn-excluir-admin");
    
    btnEditar.addEventListener("click", () => {
      window.location.href = `adicionar-produto.html?id=${data.id}`;
    });

    btnExcluir.addEventListener("click", async () => {
      if (!confirm("Tem certeza que quer excluir este imóvel?")) return;
      try {
        await deleteDoc(doc(db, "imoveis", data.id));
        if (data.imagemPath) {
          await deleteObject(ref(storage, data.imagemPath));
        }
        alert("Imóvel excluído!");
        card.remove();
        listaImoveis = listaImoveis.filter(i => i.id !== data.id);
        listaFiltradaAtual = listaFiltradaAtual.filter(i => i.id !== data.id);
      } catch (err) {
        alert("Erro ao excluir: " + err.message);
      }
    });

    container.appendChild(card);
  });
}

// Carrega todos os imóveis
async function carregarImoveis() {
  console.log("🔄 Carregando imóveis...");
  try {
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    listaImoveis = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      data.id = docSnap.id;
      listaImoveis.push(data);
    });
    console.log("✅ Total de imóveis carregados:", listaImoveis.length);
    if (listaImoveis.length > 0) {
      console.log("Exemplo de imóvel:", listaImoveis[0]);
    }
    listaFiltradaAtual = [...listaImoveis];
    mostrarImoveis(listaFiltradaAtual);
  } catch (err) {
    console.error("❌ Erro ao carregar:", err);
  }
}

// FUNÇÃO DE FILTROS - COM INPUTS NUMÉRICOS E PESQUISA POR NOME
function aplicarFiltros() {
  console.log("🔍 Aplicando filtros...");
  
  // Pega valores dos filtros
  const statusSelecionado = document.getElementById("Status")?.value || "";
  const ufSelecionado = document.getElementById("UF")?.value || "";
  const cidadeSelecionada = document.getElementById("city")?.value || "";
  const areaInput = document.getElementById("area-input")?.value;
  const precoInput = document.getElementById("preco-input")?.value;
  
  // Pega termo de pesquisa (com verificação extra)
  const inputPesquisa = document.getElementById("input-pesquisa-nome-admin");
  const termoPesquisa = inputPesquisa ? inputPesquisa.value.toLowerCase().trim() : "";
  
  const areaMax = areaInput && areaInput !== "" ? parseFloat(areaInput) : null;
  const precoMax = precoInput && precoInput !== "" ? parseFloat(precoInput) : null;

  console.log("📊 Filtros aplicados:", {
    nome: termoPesquisa || "Todos",
    status: statusSelecionado || "Todos",
    uf: ufSelecionado || "Todas",
    cidade: cidadeSelecionada || "Todas",
    areaMax: areaMax ? `até ${areaMax}m²` : "Todas",
    precoMax: precoMax ? `até R$ ${precoMax.toLocaleString('pt-BR')}` : "Todos"
  });

  // Filtra a lista
  const filtrados = listaImoveis.filter(imovel => {
    // Filtro NOME (pesquisa)
    if (termoPesquisa !== "") {
      const nomeImovel = (imovel.nome || "").toLowerCase();
      if (!nomeImovel.includes(termoPesquisa)) {
        console.log(`❌ "${imovel.nome}" não contém "${termoPesquisa}"`);
        return false;
      }
    }

    // Filtro Status
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

    // Filtro Cidade
    if (cidadeSelecionada !== "") {
      if (imovel.cidade !== cidadeSelecionada) {
        return false;
      }
    }

    // Filtro Área
    if (areaMax !== null) {
      const areaImovel = parseFloat(imovel.areas) || 0;
      if (areaImovel > areaMax) {
        return false;
      }
    }

    // Filtro Preço
    if (precoMax !== null) {
      const precoImovel = parseFloat(imovel.preco) || 0;
      if (precoImovel > precoMax) {
        return false;
      }
    }

    return true;
  });

  console.log(`✅ Resultado: ${filtrados.length} de ${listaImoveis.length} imóveis`);
  listaFiltradaAtual = filtrados;
  mostrarImoveis(listaFiltradaAtual);
}

// Função para limpar filtros
function limparFiltros() {
  console.log("🧹 Limpando filtros...");
  
  // Reseta os selects
  const statusSelect = document.getElementById("Status");
  const ufSelect = document.getElementById("UF");
  const citySelect = document.getElementById("city");
  const areaInput = document.getElementById("area-input");
  const precoInput = document.getElementById("preco-input");
  const inputPesquisa = document.getElementById("input-pesquisa-nome-admin");
  const btnLimparPesquisa = document.getElementById("btn-limpar-pesquisa-admin");
  
  if (statusSelect) statusSelect.value = "";
  if (ufSelect) ufSelect.value = "";
  if (citySelect) citySelect.value = "";
  if (areaInput) areaInput.value = "";
  if (precoInput) precoInput.value = "";
  
  if (inputPesquisa) inputPesquisa.value = "";
  if (btnLimparPesquisa) btnLimparPesquisa.style.display = "none";
  
  // Mostra todos os imóveis
  listaFiltradaAtual = [...listaImoveis];
  mostrarImoveis(listaFiltradaAtual);
}

// Event Listeners
const btnAplicar = document.getElementById("aplicar");
if (btnAplicar) {
  btnAplicar.addEventListener("click", (e) => {
    e.preventDefault();
    aplicarFiltros();
  });
}

const btnLimpar = document.getElementById("limpar");
if (btnLimpar) {
  btnLimpar.addEventListener("click", (e) => {
    e.preventDefault();
    limparFiltros();
  });
}

// Verifica admin
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../log-in.html";
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists() || !docSnap.data().admin) {
      window.location.href = "../index.html";
    }
  } catch (err) {
    console.error("Erro admin:", err);
    window.location.href = "../index.html";
  }
});

// Inicializa
console.log("🚀 produtos.js carregado!");
carregarImoveis();