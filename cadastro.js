import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = formCadastro.email.value;
  const senha = formCadastro.senha.value;

  createUserWithEmailAndPassword(auth, email, senha)
    .then((userCredential) => {
      const user = userCredential.user;
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    })
    .catch((error) => {
      alert(`Erro: ${error.message}`);
    });
});
