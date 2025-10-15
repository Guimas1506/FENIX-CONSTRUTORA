import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Config
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
const imagemInput = document.getElementById("imagem");
const preview = document.getElementById("preview");

// Função para atualizar os spans dos ranges
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

// Preview da imagem
imagemInput.addEventListener("change", () => {
  const file = imagemInput.files[0];
  if(file){
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// Verifica edição
const urlParams = new URLSearchParams(window.location.search);
const idDoImovel = urlParams.get("id");

if(idDoImovel){
  (async () => {
    const docRef = doc(db, "imoveis", idDoImovel);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      const data = docSnap.data();
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

      if(data.imagemURL){
        preview.src = data.imagemURL;
        preview.style.display = "block";
      }

      // Atualiza os spans dos ranges após preencher valores do Firebase
      atualizarRanges();
    }
  })();
} else {
  // Se não for edição, inicializa ranges normalmente
  document.addEventListener('DOMContentLoaded', atualizarRanges);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

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

  try {
    let imagemPath, imagemURL;

    if(imagemInput.files[0]){
      const file = imagemInput.files[0];
      imagemPath = `imoveis/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, imagemPath);
      const snapshot = await uploadBytes(storageRef, file);
      imagemURL = await getDownloadURL(snapshot.ref);
    }

    const dados = {
      nome, uf, cidade, endereco, preco, stats, dia, descricao,
      plantas, areas, quartos, vagas, banheiros
    };

    if(imagemPath){
      dados.imagemPath = imagemPath;
      dados.imagemURL = imagemURL;
    }

    if(idDoImovel){
      await updateDoc(doc(db, "imoveis", idDoImovel), dados);
      alert("Imóvel atualizado com sucesso!");
    } else {
      const novoDocRef = doc(collection(db, "imoveis"));
      await setDoc(novoDocRef, dados);
      alert("Imóvel cadastrado com sucesso!");
      form.reset();
      preview.style.display = "none";
      atualizarRanges(); // reinicializa os spans para novos valores
    }

  } catch (error) {
    console.error("Erro ao salvar imóvel:", error);
    alert("Erro ao salvar imóvel: " + error.message);
  }
});
