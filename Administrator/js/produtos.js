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

// Função para mostrar imóveis
function mostrarImoveis(lista) {
  container.innerHTML = "";
  lista.forEach((data) => {
    const card = document.createElement("div");
    card.classList.add("imovel-card");

    card.innerHTML = `
      <img src="${data.imagemURL || 'img/placeholder.png'}" alt="${data.nome}" class="imovel-img">
      <div class="imovel-info">
        <h3>${data.nome}</h3>
        <p><strong>Cidade:</strong> ${data.cidade} - ${data.uf}</p>
        <p><strong>Endereço:</strong> ${data.endereco}</p>
        <p><strong>Preço:</strong> R$ ${Number(data.preco || 0).toLocaleString()}</p>
      </div>
      <div class="imovel-actions">
        <button class="editar-btn">Editar</button>
        <button class="excluir-btn">Excluir</button>
      </div>
    `;

    // Editar
    card.querySelector(".editar-btn").addEventListener("click", () => {
      window.location.href = `adicionar-produto.html?id=${data.id}`;
    });

    // Excluir
    card.querySelector(".excluir-btn").addEventListener("click", async () => {
      if (!confirm("Tem certeza que quer excluir este imóvel?")) return;
      try {
        await deleteDoc(doc(db, "imoveis", data.id));

        if (data.imagemPath) {
          await deleteObject(ref(storage, data.imagemPath));
        }

        alert("Imóvel excluído!");
        card.remove();
        listaImoveis = listaImoveis.filter(i => i.id !== data.id);
      } catch (err) {
        alert("Erro ao excluir imóvel: " + err.message);
      }
    });

    container.appendChild(card);
  });
}

// Carrega todos os imóveis
async function carregarImoveis() {
  try {
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    listaImoveis = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      data.id = docSnap.id;
      listaImoveis.push(data);
    });

    mostrarImoveis(listaImoveis);
  } catch (err) {
    console.error("Erro ao carregar imóveis:", err);
  }
}

// Filtros compatíveis com os campos do Firestore
function aplicarFiltros() {
  const uf = document.getElementById("UF").value;
  const cidade = document.getElementById("city").value.toLowerCase();
  const precoMax = parseFloat(document.getElementById("preco-range")?.value) || Infinity;
  const areaMax = parseFloat(document.getElementById("area-range")?.value) || Infinity;

  const filtrados = listaImoveis.filter(imovel => {
    if (uf && imovel.uf !== uf) return false;
    if (cidade && imovel.cidade.toLowerCase() !== cidade) return false;
    if (imovel.preco && imovel.preco > precoMax) return false;
    if (imovel.areas && imovel.areas > areaMax) return false;
    return true;
  });

  mostrarImoveis(filtrados);
}

// Botão aplicar filtros
document.getElementById("aplicar")?.addEventListener("click", (e) => {
  e.preventDefault();
  aplicarFiltros();
});

// Verifica se o usuário é admin
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../log-in.html";

  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists() || !docSnap.data().admin) {
      window.location.href = "../index.html";
    }
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
    window.location.href = "../index.html";
  }
});

// Inicializa
carregarImoveis();
