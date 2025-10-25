// carregar-imoveis.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

console.log("🔥 Firebase inicializado para carregar imóveis");

// ==================== FUNÇÃO DE FAVORITAR (DECLARADA PRIMEIRO) ====================
window.toggleFavorito = function(event, id) {
  event.stopPropagation();
  event.preventDefault();
  
  const btn = document.getElementById(`fav-${id}`);
  const span = btn.querySelector('span');
  
  console.log("🔍 Clicou no favorito, texto atual:", span.textContent);
  
  if (span.textContent === '♡') {
    // FAVORITAR - muda para coração cheio
    span.textContent = '♥';
    span.style.color = '#FF0000';
    btn.style.background = '#FFE5E5';
    btn.style.borderColor = '#FF0000';
    console.log("❤️ FAVORITADO!");
    
  } else {
    // DESFAVORITAR - volta para coração vazio
    span.textContent = '♡';
    span.style.color = '#FE4F3F';
    btn.style.background = 'rgba(255,255,255,0.95)';
    btn.style.borderColor = '#FE4F3F';
    console.log("💔 DESFAVORITADO!");
  }
  
  // Animação
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
  }, 200);
}

// ==================== FUNÇÃO DE CARREGAR IMÓVEIS ====================
async function carregarImoveisUsuario() {
  console.log("🔍 Tentando carregar imóveis...");
  
  const container = document.getElementById("lista-imoveis-usuario");
  console.log("📦 Container:", container);
  
  if (!container) {
    console.error("❌ Container não encontrado!");
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
    background: transparent !important;
  `;
  
  try {
    container.innerHTML = '<p style="text-align: center; padding: 20px; font-size: 18px; grid-column: 1 / -1;">⏳ Carregando imóveis...</p>';
    
    console.log("📡 Buscando na coleção 'imoveis'...");
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    console.log("✅ Documentos encontrados:", querySnapshot.size);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">📭 Nenhum imóvel disponível.</p>';
      return;
    }
    
    container.innerHTML = '';
    
    let contador = 0;
    querySnapshot.forEach((doc) => {
      if (contador >= 8) return; // Limita a 8
      
      const imovel = doc.data();
      console.log("🏠 Imóvel:", imovel.nome);
      
      const card = document.createElement('div');
      card.className = 'imovel-card-usuario';
      
      // FORÇA O ESTILO DO CARD
      card.style.cssText = `
        background: white !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1) !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        flex-direction: column !important;
      `;
      
      card.innerHTML = `
        <div style="position: relative;">
          <img src="${imovel.imagemURL || './img/logo1.png'}" 
               alt="${imovel.nome}"
               style="width: 100%; height: 200px; object-fit: cover; display: block;">
          
          <!-- CORAÇÃO DE FAVORITO -->
          <button onclick="toggleFavorito(event, '${doc.id}')" 
                  class="btn-favorito" 
                  id="fav-${doc.id}"
                  style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95); border: 2px solid #FE4F3F; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            <span style="color: #FE4F3F;">♡</span>
          </button>
        </div>
        
        <div class="card-content" style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
          <h3 style="margin: 0 0 10px 0; color: #FE4F3F; font-size: 1.2em; font-weight: 700;">
            ${imovel.nome || 'Sem nome'}
          </h3>
          <p style="margin: 5px 0; color: #333; font-size: 0.95em;">
  ${imovel.cidade || 'N/A'} - ${imovel.uf || ''}
</p>
<p style="margin: 5px 0; color: #333; font-size: 0.95em;">
  R$ ${Number(imovel.preco || 0).toLocaleString('pt-BR')}
</p>
<p style="margin: 5px 0; color: #333; font-size: 0.95em;">
  ${imovel.areas || 0}m²
</p>
          <div style="display: flex; gap: 12px; margin: 10px 0; padding: 10px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
            <span style="font-size: 0.9em; color: #666;">🛏️ ${imovel.quartos || 0}</span>
            <span style="font-size: 0.9em; color: #666;">🚗 ${imovel.vagas || 0}</span>
            <span style="font-size: 0.9em; color: #666;">🚿 ${imovel.banheiros || 0}</span>
          </div>
          <button onclick="alert('${imovel.nome}')" 
                  style="width: 100%; padding: 12px; margin-top: auto; background: #FE4F3F; color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: background 0.3s ease;">
            Ver Detalhes
          </button>
        </div>
      `;
      
      container.appendChild(card);
      contador++;
    });
    
    console.log(`✨ ${contador} imóveis carregados!`);
    
  } catch (error) {
    console.error("❌ ERRO:", error);
    container.innerHTML = `<p style="color: red; text-align: center; padding: 20px; grid-column: 1 / -1;">Erro: ${error.message}</p>`;
  }
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM pronto, iniciando carregamento...");
  carregarImoveisUsuario();
});