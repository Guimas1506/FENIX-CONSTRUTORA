// info.js - Gerenciar informações pessoais
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, updateEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
  // Expand/collapse functionality
  const expandHeaders = document.querySelectorAll('.expand-header');
  expandHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const input = content.querySelector('input');
      const currentValue = header.querySelector('p').textContent;
      if (currentValue !== 'Não Informado') {
        input.value = currentValue;
      }
      content.classList.toggle('active');
      header.classList.toggle('active');
    });
  });

  // Load user data
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(docRef);
        let data = {};
        if (docSnap.exists()) {
          data = docSnap.data();
        }

        // Populate fields
        updateField('Nome', data.nome || 'Não Informado');
        updateField('Email', user.email || 'Não Informado');
        updateField('Telefone', data.telefone || 'Não Informado');
        updateField('UF', data.uf || 'Não Informado');
        updateField('Cidade', data.cidade || 'Não Informado');

        // Set up save buttons
        setupSaveButtons(user.uid, data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
  });
});

function updateField(fieldName, value) {
  const header = [...document.querySelectorAll('.expand-header')].find(h => h.querySelector('h3').textContent === fieldName);
  if (header) {
    const p = header.querySelector('p');
    p.textContent = value;
  }
}

function setupSaveButtons(uid, currentData) {
  const saveButtons = document.querySelectorAll('.expand-content button[type="button"]');

  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const content = button.parentElement;
      const input = content.querySelector('input');
      const fieldName = content.previousElementSibling.querySelector('h3').textContent;
      const value = input.value.trim();

      if (!value) {
        alert('Por favor, preencha o campo.');
        return;
      }

      try {
        const updates = {};
        switch (fieldName) {
          case 'Nome':
            updates.nome = value;
            break;
          case 'Email':
            await updateEmail(auth.currentUser, value);
            updates.email = value;
            break;
          case 'Telefone':
            updates.telefone = value;
            break;
          case 'UF':
            updates.uf = value;
            break;
          case 'Cidade':
            updates.cidade = value;
            break;
        }

        await setDoc(doc(db, "users", uid), updates, { merge: true });
        alert(`${fieldName} atualizado com sucesso!`);

        // Update display
        updateField(fieldName, value);

        // Close the expand
        content.classList.remove('active');
        content.previousElementSibling.classList.remove('active');

      } catch (error) {
        console.error(`Erro ao atualizar ${fieldName}:`, error);
        alert(`Erro ao atualizar ${fieldName}: ${error.message}`);
      }
    });
  });
}
