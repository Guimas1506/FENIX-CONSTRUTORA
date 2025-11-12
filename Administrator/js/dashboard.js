// dashboard.js - Lógica e estatísticas da Dashboard
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

console.log("🚀 Dashboard inicializada");

// ==================== VERIFICAÇÃO DE ADMIN ====================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("❌ Usuário não autenticado");
    return window.location.href = "../log-in.html";
  }
  
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists() || !docSnap.data().admin) {
      console.log("❌ Usuário não é admin");
      return window.location.href = "../index.html";
    }
    console.log("✅ Admin autenticado");
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
    return window.location.href = "../index.html";
  }
});

// ==================== CARREGAR DADOS ====================
let todosImoveis = [];
let chartStatus = null;
let chartPreco = null;

async function carregarDados() {
  console.log("📊 Carregando dados para dashboard...");
  
  try {
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    todosImoveis = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      todosImoveis.push(data);
    });
    
    console.log(`✅ ${todosImoveis.length} imóveis carregados`);
    
    // Calcula e exibe estatísticas
    calcularEstatisticas();
    criarGraficos();
    listarPorEstado();
    listarUltimosImoveis();
    
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
  }
}

// ==================== CALCULAR ESTATÍSTICAS ====================
function calcularEstatisticas() {
  console.log("🔢 Calculando estatísticas...");
  
  const total = todosImoveis.length;
  const naplanta = todosImoveis.filter(i => i.stats === "Na Planta").length;
  const prontos = todosImoveis.filter(i => i.stats === "Pronto").length;
  
  // Valor total
  const valorTotal = todosImoveis.reduce((sum, i) => sum + (parseFloat(i.preco) || 0), 0);
  
  // Áreas
  const areas = todosImoveis.map(i => parseFloat(i.areas) || 0).filter(a => a > 0);
  const areaMedia = areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0;
  const areaMaior = areas.length > 0 ? Math.max(...areas) : 0;
  const areaMenor = areas.length > 0 ? Math.min(...areas) : 0;
  
  // Atualiza cards
  document.getElementById("total-imoveis").textContent = total;
  document.getElementById("total-naplanta").textContent = naplanta;
  document.getElementById("total-prontos").textContent = prontos;
  document.getElementById("valor-total").textContent = `R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  
  document.getElementById("area-media").textContent = `${areaMedia.toFixed(0)} m²`;
  document.getElementById("area-maior").textContent = `${areaMaior.toFixed(0)} m²`;
  document.getElementById("area-menor").textContent = `${areaMenor.toFixed(0)} m²`;
  
  console.log("✅ Estatísticas calculadas");
}

// ==================== CRIAR GRÁFICOS ====================
function criarGraficos() {
  console.log("📈 Criando gráficos...");
  
  // Gráfico de Status
  criarGraficoStatus();
  
  // Gráfico de Preço
  criarGraficoPreco();
  
  console.log("✅ Gráficos criados");
}

function criarGraficoStatus() {
  const canvas = document.getElementById("chart-status");
  if (!canvas) return;
  
  const naplanta = todosImoveis.filter(i => i.stats === "Na Planta").length;
  const prontos = todosImoveis.filter(i => i.stats === "Pronto").length;
  
  if (chartStatus) {
    chartStatus.destroy();
  }
  
  chartStatus = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Na Planta', 'Pronto'],
      datasets: [{
        data: [naplanta, prontos],
        backgroundColor: ['#2196F3', '#4CAF50'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14,
              weight: '600'
            },
            padding: 15
          }
        }
      }
    }
  });
}

function criarGraficoPreco() {
  const canvas = document.getElementById("chart-preco");
  if (!canvas) return;
  
  // Categoriza por faixas de preço
  const faixas = {
    'Até 250k': 0,
    '250k - 500k': 0,
    '500k - 1M': 0,
    'Acima de 1M': 0
  };
  
  todosImoveis.forEach(imovel => {
    const preco = parseFloat(imovel.preco) || 0;
    if (preco <= 250000) faixas['Até 250k']++;
    else if (preco <= 500000) faixas['250k - 500k']++;
    else if (preco <= 1000000) faixas['500k - 1M']++;
    else faixas['Acima de 1M']++;
  });
  
  if (chartPreco) {
    chartPreco.destroy();
  }
  
  chartPreco = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(faixas),
      datasets: [{
        label: 'Quantidade de Imóveis',
        data: Object.values(faixas),
        backgroundColor: '#FE4F3F',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ==================== LISTAR POR ESTADO ====================
function listarPorEstado() {
  console.log("🗺️ Listando por estado...");
  
  const container = document.getElementById("lista-por-estado");
  if (!container) return;
  
  // Conta imóveis por estado
  const porEstado = {};
  todosImoveis.forEach(imovel => {
    const uf = imovel.uf || 'N/A';
    porEstado[uf] = (porEstado[uf] || 0) + 1;
  });
  
  // Ordena por quantidade (decrescente)
  const ordenado = Object.entries(porEstado)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10
  
  if (ordenado.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum dado disponível</p>';
    return;
  }
  
  container.innerHTML = ordenado.map(([uf, qtd]) => `
    <div class="list-item">
      <span class="list-label">${uf}</span>
      <span class="list-value">${qtd}</span>
    </div>
  `).join('');
  
  console.log("✅ Lista por estado criada");
}

// ==================== LISTAR ÚLTIMOS IMÓVEIS ====================
function listarUltimosImoveis() {
  console.log("🆕 Listando últimos imóveis...");
  
  const container = document.getElementById("ultimos-imoveis");
  if (!container) return;
  
  // Pega os últimos 5 (assumindo que os últimos adicionados estão no final)
  const ultimos = todosImoveis.slice(-5).reverse();
  
  if (ultimos.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhum imóvel cadastrado</p>';
    return;
  }
  
  container.innerHTML = `
    <table class="imoveis-table">
      <thead>
        <tr>
          <th>Imagem</th>
          <th>Nome</th>
          <th>Cidade</th>
          <th>Preço</th>
          <th>Área</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${ultimos.map(imovel => `
          <tr>
            <td>
              <img src="${imovel.imagemURL || 'img/logo1.png'}" 
                   alt="${imovel.nome}"
                   onerror="this.src='img/logo1.png'">
            </td>
            <td><strong>${imovel.nome || 'Sem nome'}</strong></td>
            <td>${imovel.cidade || 'N/A'} - ${imovel.uf || ''}</td>
            <td>R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}</td>
            <td>${imovel.areas || 0}m²</td>
            <td>
              <span class="badge ${imovel.stats === 'Pronto' ? 'badge-pronto' : 'badge-naplanta'}">
                ${imovel.stats || 'N/A'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  console.log("✅ Lista de últimos imóveis criada");
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM carregado - Iniciando dashboard");
  carregarDados();
});