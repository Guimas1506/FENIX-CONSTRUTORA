// auth.js
import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Cadastro
const formCadastro = document.getElementById('form-cadastro');
if(formCadastro) {
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = formCadastro['email'].value;
        const senha = formCadastro['senha'].value;

        createUserWithEmailAndPassword(auth, email, senha)
            .then((userCredential) => {
                alert("Cadastro realizado com sucesso!");
                window.location.href = "log-in.html"; // redireciona para login
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}

// Login
const formLogin = document.getElementById('form-login');
if(formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = formLogin['email'].value;
        const senha = formLogin['senha'].value;

        signInWithEmailAndPassword(auth, email, senha)
            .then((userCredential) => {
                alert("Login realizado com sucesso!");
                window.location.href = "index.html"; // redireciona para página principal
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}
