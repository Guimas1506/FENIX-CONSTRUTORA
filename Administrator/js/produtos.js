import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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

// Container de imóveis
const container = document.getElementById("lista-imoveis-container");
let listaImoveis = []; // lista completa do Firestore

// Função para exibir imóveis
function mostrarImoveis(lista) {
  container.innerHTML = "";
  lista.forEach((data) => {
    const card = document.createElement("div");
    card.classList.add("imovel-card");

    card.innerHTML = `
      <img src="${data.imagemURL}" alt="${data.nome}" class="imovel-img">
      <div class="imovel-info">
        <h3>${data.nome}</h3>
        <p><strong>Cidade:</strong> ${data.cidade} - ${data.uf}</p>
        <p><strong>Endereço:</strong> ${data.endereco}</p>
        <p><strong>Preço:</strong> R$ ${Number(data.preco).toLocaleString()}</p>
      </div>
      <div class="imovel-actions">
        <button class="editar-btn">Editar</button>
        <button class="excluir-btn">Excluir</button>
      </div>
    `;

    card.querySelector(".editar-btn").addEventListener("click", () => {
      window.location.href = `adicionar-produto.html?id=${data.id}`;
    });

    card.querySelector(".excluir-btn").addEventListener("click", async () => {
      if (!confirm("Tem certeza que quer excluir este imóvel?")) return;

      try {
        await deleteDoc(doc(db, "imoveis", data.id));

        if (data.imagemPath) {
          const imageRef = ref(storage, data.imagemPath);
          await deleteObject(imageRef);
        }

        alert("Imóvel excluído!");
        card.remove();
        listaImoveis = listaImoveis.filter(i => i.id !== data.id); // remove da lista local
      } catch (err) {
        alert("Erro ao excluir imóvel: " + err.message);
      }
    });

    container.appendChild(card);
  });
}

// Carrega todos os imóveis do Firestore
async function carregarImoveis() {
  try {
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    listaImoveis = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      data.id = docSnap.id;
      listaImoveis.push(data);
    });

    mostrarImoveis(listaImoveis);
  } catch (err) {
    console.error("Erro ao carregar imóveis:", err);
  }
}

// Filtra imóveis de acordo com os filtros selecionados
function aplicarFiltros() {
  const tipo = document.getElementById("all-types").value;
  const status = document.getElementById("Status").value;
  const uf = document.getElementById("UF").value;
  const cidade = document.getElementById("city").value;
  const venda = document.getElementById("sale").value;
  const areaMax = parseFloat(document.getElementById("area-range")?.value) || Infinity;
  const precoMax = parseFloat(document.getElementById("preco-range")?.value) || Infinity;

  const filtrados = listaImoveis.filter(imovel => {
    if (tipo && imovel.tipo !== tipo) return false;
    if (status && imovel.stats !== status) return false;
    if (uf && imovel.uf !== uf) return false;
    if (cidade && imovel.cidade.toLowerCase() !== cidade.toLowerCase()) return false;
    if (venda && imovel.venda !== venda) return false;
    if (imovel.areas && imovel.areas > areaMax) return false;
    if (imovel.preco && imovel.preco > precoMax) return false;
    return true;
  });

  mostrarImoveis(filtrados);
}

// Inicializa
carregarImoveis();

// Evento do botão "Aplicar"
document.getElementById("aplicar")?.addEventListener("click", (e) => {
  e.preventDefault();
  aplicarFiltros();
});



    // 🔒 VERIFICA SE USUÁRIO É ADMIN
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("Nenhum usuário logado, redirecionando para login...");
        window.location.href = "../log-in.html";
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.admin === true) {
            console.log("✅ Acesso de administrador confirmado!");
            return; // deixa o usuário continuar
          }
        }

        console.warn("Usuário logado mas não é admin. Redirecionando...");
        window.location.href = "../index.html";
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
        window.location.href = "../index.html";
      }
    });