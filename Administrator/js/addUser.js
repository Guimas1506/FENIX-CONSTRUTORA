// Administrator/js/addUser.js
// Create a user document in Firestore (no Cloud Function). This does NOT create an Auth user.
import { db, storage } from '../../firebase.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js';

// try to find some inputs from page
const saveBtn = document.querySelector('.btn-salvar');
const fotoInput = document.getElementById('foto-perfil');
const previewFoto = document.getElementById('preview-foto');
let selectedFile = null;

// Preview da imagem quando selecionada
if(fotoInput){
  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file){
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        previewFoto.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

if(saveBtn){
  saveBtn.addEventListener('click', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('name')?.value.trim() || '';
    const email = (document.getElementById('email')?.value || '').trim();
    const tel = document.getElementById('tel')?.value.trim() || '';
    const statusEl = document.getElementById('Status');
    const role = statusEl ? (statusEl.value === 'ADM' ? 'admin' : 'user') : 'user';
    const password = (document.getElementById('password')?.value || '').trim();

    if(!name){ alert('Nome é obrigatório'); return; }
    if(!email){ alert('Email é obrigatório para criar a conta de autenticação'); return; }
    if(!password || password.length < 6){ alert('Senha deve ter ao menos 6 caracteres'); return; }

    // Create user via Firebase Auth REST API so we don't sign out the admin in the client
    const firebaseConfig = (await import('../../firebase.js')).defaultConfig || null;
    // fallback: extract API key directly from firebase.js file content (we already export it there)
    // but since firebase.js doesn't export the config, use known API key string present in that file
    const API_KEY = 'AIzaSyCYDGROxguHYX-YA-J-HqRRGSF3uN-ZEAs';

    try{
      // 1) create auth user
      const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
      const signupRes = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const signupJson = await signupRes.json();
      if(!signupRes.ok){
        const msg = signupJson.error?.message || JSON.stringify(signupJson);
        throw new Error('Erro ao criar Auth user: ' + msg);
      }

      const uid = signupJson.localId;
      const idToken = signupJson.idToken;

      // 2) set displayName using accounts:update (optional)
      try{
        const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;
        await fetch(updateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, displayName: name, returnSecureToken: false })
        });
      }catch(e){ console.warn('Could not set displayName via REST:', e); }

      // 2.5) Upload da imagem para Firebase Storage
      let photoURL = 'img/do-utilizador.png'; // default
      if(selectedFile){
        try{
          const storageRef = ref(storage, `usuarios/${uid}/perfil.jpg`);
          await uploadBytes(storageRef, selectedFile);
          photoURL = await getDownloadURL(storageRef);
          console.log('Imagem enviada com sucesso:', photoURL);
        }catch(uploadErr){
          console.warn('Erro ao fazer upload da imagem:', uploadErr);
          alert('Aviso: Imagem não foi enviada, usando imagem padrão');
        }
      }

      // 3) write Firestore documents with the returned uid
      const newRef = doc(db, 'usuarios', uid);
      const payload = {
        nome: name,
        email: email,
        telefone: tel || '-',
        cidade: '',
        uf: '',
        status: 'Ativo',
        role: role,
        admin: role === 'admin',
        photoURL: photoURL,
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, payload, { merge: true });

      try{
        const mirrorRef = doc(db, 'users', uid);
        await setDoc(mirrorRef, payload, { merge: true });
      }catch(e){ console.warn('Could not mirror to users collection:', e); }

      alert('Usuário criado com sucesso (Auth + Firestore). UID: ' + uid);
      window.location.href = 'usuario.html';
    }catch(err){
      console.error('Erro criando usuário:', err);
      alert('Erro ao criar usuário: ' + (err.message || err));
    }
  });
}
