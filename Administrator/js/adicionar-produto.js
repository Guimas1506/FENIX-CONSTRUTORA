// adicionar-produto.js - Com suporte a múltiplas imagens
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
const storage = getStorage(app);

const form = document.getElementById("prods");

// ==================== PREVIEW DAS IMAGENS ====================
window.previewImagem = function(numero) {
  const input = document.getElementById(`imagem-${numero}`);
  const preview = document.getElementById(`preview-${numero}`);
  const label = document.getElementById(`label-${numero}`);
  const btnRemover = document.querySelector(`#box-${numero} .btn-remover`);
  
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      label.textContent = "✓ Imagem adicionada";
      btnRemover.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
}

// ==================== REMOVER IMAGEM ====================
window.removerImagem = function(numero) {
  const input = document.getElementById(`imagem-${numero}`);
  const preview = document.getElementById(`preview-${numero}`);
  const label = document.getElementById(`label-${numero}`);
  const btnRemover = document.querySelector(`#box-${numero} .btn-remover`);
  
  input.value = "";
  preview.src = "";
  preview.style.display = "none";
  label.textContent = "📁 Clique para adicionar";
  btnRemover.style.display = "none";
}

// ==================== ATUALIZAR RANGES ====================
function atualizarRanges() {
  document.querySelectorAll('.range-row').forEach(row => {
    const input = row.querySelector('.range-input');
    const display = row.querySelector('.range-value');
    if (!input || !display) return;
    display.textContent = String(input.value).padStart(2, '0');

    input.addEventListener('input', () => {
      display.textContent = String(input.value).padStart(2, '0');
    });
  });
}

// ==================== MODO EDIÇÃO ====================
const urlParams = new URLSearchParams(window.location.search);
const idDoImovel = urlParams.get("id");

if (idDoImovel) {
  (async () => {
    const docRef = doc(db, "imoveis", idDoImovel);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Preenche campos básicos
      document.getElementById("search-name").value = data.nome || "";
      document.getElementById("UF").value = data.uf || "";
      document.getElementById("city").value = data.cidade || "";
      document.getElementById("rua").value = data.endereco || "";
      document.getElementById("preco").value = data.preco || "";
      document.getElementById("stats").value = data.stats || "";
      document.getElementById("dia").value = data.dia || "";
      document.getElementById("descricao").value = data.descricao || "";
      document.getElementById("plantas").value = data.plantas || 0;
      document.getElementById("areas").value = data.areas || 0;
      document.getElementById("quartos").value = data.quartos || 0;
      document.getElementById("vagas").value = data.vagas || 0;
      document.getElementById("banheiros").value = data.banheiros || 0;
      
      // Checkboxes
      if (data.piscina) document.getElementById("piscina").checked = true;
      if (data.churras) document.getElementById("churras").checked = true;
      if (data.fit) document.getElementById("fit").checked = true;
      
      // Carrega imagens existentes
      const imagens = data.imagens || [];
      imagens.forEach((url, index) => {
        const numero = index + 1;
        const preview = document.getElementById(`preview-${numero}`);
        const label = document.getElementById(`label-${numero}`);
        const btnRemover = document.querySelector(`#box-${numero} .btn-remover`);
        
        if (preview && url) {
          preview.src = url;
          preview.style.display = "block";
          label.textContent = "✓ Imagem carregada";
          btnRemover.style.display = "block";
        }
      });
      
      atualizarRanges();
    }
  })();
} else {
  document.addEventListener('DOMContentLoaded', atualizarRanges);
}

// ==================== SALVAR IMÓVEL ====================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log("📤 Iniciando salvamento...");
  
  // Coleta dados do formulário
  const nome = document.getElementById("search-name").value;
  const uf = document.getElementById("UF").value;
  const cidade = document.getElementById("city").value;
  const endereco = document.getElementById("rua").value;
  const preco = document.getElementById("preco").value;
  const stats = document.getElementById("stats").value;
  const dia = document.getElementById("dia").value;
  const descricao = document.getElementById("descricao").value;
  const plantas = document.getElementById("plantas").value;
  const areas = document.getElementById("areas").value;
  const quartos = document.getElementById("quartos").value;
  const vagas = document.getElementById("vagas").value;
  const banheiros = document.getElementById("banheiros").value;
  
  // Checkboxes
  const piscina = document.getElementById("piscina").checked;
  const churras = document.getElementById("churras").checked;
  const fit = document.getElementById("fit").checked;
  
  try {
    // Upload das imagens
    const imagensURLs = [];
    const imagensPaths = [];
    
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`imagem-${i}`);
      
      if (input.files[0]) {
        // Nova imagem para upload
        console.log(`📷 Fazendo upload da imagem ${i}...`);
        const file = input.files[0];
        const imagemPath = `imoveis/${Date.now()}-${i}-${file.name}`;
        const storageRef = ref(storage, imagemPath);
        const snapshot = await uploadBytes(storageRef, file);
        const imagemURL = await getDownloadURL(snapshot.ref);
        
        imagensURLs.push(imagemURL);
        imagensPaths.push(imagemPath);
        console.log(`✅ Imagem ${i} enviada`);
        
      } else {
        // Verifica se há imagem existente (modo edição)
        const preview = document.getElementById(`preview-${i}`);
        if (preview.src && preview.style.display !== "none") {
          imagensURLs.push(preview.src);
          imagensPaths.push(""); // Path vazio para imagens já existentes
        }
      }
    }
    
    console.log(`📊 Total de ${imagensURLs.length} imagens`);
    
    // Monta objeto de dados
    const dados = {
      nome,
      uf,
      cidade,
      endereco,
      preco,
      stats,
      dia,
      descricao,
      plantas,
      areas,
      quartos,
      vagas,
      banheiros,
      piscina,
      churras,
      fit,
      imagens: imagensURLs,
      imagensPaths: imagensPaths,
      // Mantém compatibilidade com código antigo
      imagemURL: imagensURLs[0] || "",
      imagemPath: imagensPaths[0] || ""
    };
    
    if (idDoImovel) {
      // EDIÇÃO
      await updateDoc(doc(db, "imoveis", idDoImovel), dados);
      alert("✅ Imóvel atualizado com sucesso!");
      console.log("✅ Atualização concluída");
    } else {
      // NOVO
      const novoDocRef = doc(collection(db, "imoveis"));
      await setDoc(novoDocRef, dados);
      alert("✅ Imóvel cadastrado com sucesso!");
      console.log("✅ Cadastro concluído");
      
      // Limpa formulário
      form.reset();
      for (let i = 1; i <= 4; i++) {
        removerImagem(i);
      }
      atualizarRanges();
    }
    
  } catch (error) {
    console.error("❌ Erro ao salvar:", error);
    alert("❌ Erro ao salvar imóvel: " + error.message);
  }
});

console.log("🚀 Script de adicionar produto carregado");