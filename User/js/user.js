import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

const userPhoto = document.getElementById("user-photo");
const welcomeMessage = document.getElementById("welcome-message");
const removeBtn = document.getElementById("remove-photo-btn");
const DEFAULT_PHOTO = 'img/do-utilizador.png';

// garante elemento e src inicial
if (userPhoto) {
  userPhoto.style.cursor = 'pointer';
  // se atributo src estiver vazio, aplica padrão
  if (!userPhoto.getAttribute('src')) userPhoto.src = DEFAULT_PHOTO;
}

// cria input invisível para upload
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

if (userPhoto) userPhoto.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const storagePath = `userPhotos/${uid}`;
  const storageRef = ref(storage, storagePath);

  try {
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    // salva na coleção "users" (prioridade) com merge
    await setDoc(doc(db, "usuarios", uid), { photoURL }, { merge: true });

    // atualiza também em "usuarios" como fallback (opcional)
    await setDoc(doc(db, "usuarios", uid), { photoURL }, { merge: true });

    if (userPhoto) userPhoto.src = photoURL || DEFAULT_PHOTO;
    alert("Foto atualizada com sucesso!");
  } catch (err) {
    console.error("Erro upload/atualizar foto:", err);
    alert("Erro ao atualizar foto: " + (err.message || err));
  } finally {
    // limpa input para permitir reupload do mesmo arquivo se quiser
    fileInput.value = '';
  }
});

// handler remover foto (se botão existir)
if (removeBtn) {
  removeBtn.addEventListener('click', async () => {
    if (!auth.currentUser) {
      alert('Usuário não autenticado.');
      return;
    }
    const confirmar = confirm('Deseja remover a foto do perfil? Isso restaurará a imagem padrão.');
    if (!confirmar) return;

    removeBtn.disabled = true;
    removeBtn.textContent = 'Removendo...';

    const uid = auth.currentUser.uid;
    const storagePath = `userPhotos/${uid}`;
    const storageRef = ref(storage, storagePath);

    try {
      // tenta apagar do Storage; ignora se não existir
      await deleteObject(storageRef).catch((err) => {
        if (!(err && err.code && err.code === 'storage/object-not-found')) throw err;
      });

      // remove referência de photoURL em ambas coleções (define null)
      await setDoc(doc(db, "usuarios", uid), { photoURL: null }, { merge: true });
      await setDoc(doc(db, "usuarios", uid), { photoURL: null }, { merge: true });

      if (userPhoto) userPhoto.src = DEFAULT_PHOTO;
      alert('Foto removida com sucesso.');
    } catch (err) {
      console.error('Erro ao remover foto:', err);
      alert('Erro ao remover foto: ' + (err.message || err));
    } finally {
      removeBtn.disabled = false;
      removeBtn.textContent = 'Remover foto';
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (welcomeMessage) welcomeMessage.textContent = "Bem-vindo de volta, Usuário!";
    if (userPhoto) userPhoto.src = DEFAULT_PHOTO;
    return;
  }

  let nome = user.displayName || user.email;
  let photoURL = user.photoURL || null;

  try {
    // 1) tenta do documento em "users" (prioridade)
    const usersRef = doc(db, "usuarios", user.uid);
    const usersSnap = await getDoc(usersRef);
    if (usersSnap.exists()) {
      const data = usersSnap.data();
      if (data.nome) nome = data.nome;
      if (data.photoURL) photoURL = data.photoURL;
    }

    // 2) fallback para "usuarios" caso não exista nome em "users"
    if ((!nome || nome === user.email) || !usersSnap.exists() || !usersSnap.data()?.nome) {
      const usuariosRef = doc(db, "usuarios", user.uid);
      const usuariosSnap = await getDoc(usuariosRef);
      if (usuariosSnap.exists()) {
        const udata = usuariosSnap.data();
        if (udata.nome) nome = udata.nome;
        if (udata.photoURL && !photoURL) photoURL = udata.photoURL;
      }
    }
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
  }

  // aplica foto (firestore users -> provider -> default)
  if (userPhoto) userPhoto.src = photoURL || user.photoURL || DEFAULT_PHOTO;
  if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo de volta, ${nome}!`;
});