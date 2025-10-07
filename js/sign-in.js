
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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
const db = getFirestore(app); // Firestore
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

function atualizarRequisito(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = ok ? "green" : "red";
}

window.validarSenha = function() {
  const senha = document.getElementById("password").value;
  const letrasCount = (senha.match(/[a-zA-Z]/g) || []).length;
  const numerosCount = (senha.match(/[0-9]/g) || []).length;
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const semEspacos = !/\s/.test(senha);

  atualizarRequisito("req-caracteres", letrasCount >= 6);
  atualizarRequisito("req-especial", temEspecial);
  atualizarRequisito("req-espacos", semEspacos);

  const infoIcon = document.getElementById("infoIcon");
  if (letrasCount >= 6 && temEspecial && semEspacos) {
    infoIcon.style.backgroundColor = "green";
  } else {
    infoIcon.style.backgroundColor = "red";
  }

  const barraImg = document.getElementById("senha-forca-img");
  let nivel = 1;
  if (letrasCount >= 6 && temEspecial && semEspacos) nivel = 2;
  if (nivel === 2 && letrasCount >= 8 && numerosCount >= 2) nivel = 3;

  if (nivel === 1) barraImg.src = "./img/senha-fraca.png";
  else if (nivel === 2) barraImg.src = "./img/senha-media.png";
  else if (nivel === 3) barraImg.src = "./img/senha-forte.png";
};

window.registerUser = async function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("password").value;
  const confSenha = document.getElementById("confirm-password").value;

  const letrasCount = (senha.match(/[a-zA-Z]/g) || []).length;
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const semEspacos = !/\s/.test(senha);

  if (senha !== confSenha) {
    alert("As senhas não coincidem!");
    return;
  }

  if (!(letrasCount >= 6 && temEspecial && semEspacos)) {
    alert("A senha deve ter no mínimo 6 letras, pelo menos 1 caractere especial e não pode conter espaços!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nome });

    // Adiciona usuário ao Firestore com admin = false
    await setDoc(doc(db, "users", user.uid), {
      nome: nome,
      email: email,
      admin: false
    });

    alert("Cadastro realizado com sucesso! Bem-vindo, " + (nome || email));
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  }
};

async function socialLogin(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    alert(`Bem-vindo, ${user.displayName || user.email}!`);
    window.location.href = "index.html";
  } catch (error) {
    console.error("socialLogin error:", error);
  }
}

window.registerGoogle = () => socialLogin(googleProvider);
window.registerFacebook = () => socialLogin(facebookProvider);