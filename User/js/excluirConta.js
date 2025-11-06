import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// função global chamada pelo onclick do botão
window.confirmarExclusao = async function confirmarExclusao() {
  if (!auth.currentUser) {
    alert('Usuário não autenticado. Faça login antes de excluir a conta.');
    return;
  }

  const confirmar = confirm('Confirma a exclusão da sua conta? Esta ação é irreversível.');
  if (!confirmar) return;

  const uid = auth.currentUser.uid;

  try {
    // 1) Apaga dados no Firestore (tenta em "users" e "usuarios")
    await deleteDoc(doc(db, "users", uid)).catch(() => {});
    await deleteDoc(doc(db, "usuarios", uid)).catch(() => {});

    // 2) Remove foto do Storage (se existir)
    const photoRef = ref(storage, `userPhotos/${uid}`);
    await deleteObject(photoRef).catch((err) => {
      // ignora erro quando objeto não existe
      if (!(err && err.code && err.code === 'storage/object-not-found')) throw err;
    });

    // 3) Tenta apagar o usuário do Auth
    await auth.currentUser.delete();

    alert('Conta excluída com sucesso.');
    // redireciona para página pública (ajuste o caminho conforme seu projeto)
    window.location.href = '../index.html';
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    // caso precise reautenticar o usuário
    if (err && (err.code === 'auth/requires-recent-login' || err.message?.includes('requires-recent-login'))) {
      alert('Por segurança, é necessário fazer login novamente antes de excluir a conta. Você será redirecionado para a tela de login.');
      // desloga e redireciona ao login para reautenticação
      try { await auth.signOut(); } catch(e){/*ignore*/ }
      window.location.href = '../log-in.html';
      return;
    }

    alert('Erro ao excluir conta: ' + (err.message || err));
  }
};