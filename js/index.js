
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

    const logBtn = document.getElementById("log");
    const loginbtn = document.querySelector(".logadores #register");

    




    // Referências
    const iconPerson = document.querySelector(".icon-person");
    const userArea = document.getElementById("userArea");
    const closeUserArea = document.getElementById("closeUserArea");
    const welcomeMsg = document.getElementById("welcomeMsg");
    const userEmail = document.getElementById("userEmail");
    const btnLogoutModal = document.getElementById("btnLogoutModal");

    // Abrir área do usuário
    iconPerson.addEventListener("click", () => {
      userArea.style.display = "flex";
    });

    // Fechar modal
    closeUserArea.addEventListener("click", () => {
      userArea.style.display = "none";
    });

    // Fechar ao clicar fora
    window.addEventListener("click", (e) => {
      if (e.target === userArea) {
        userArea.style.display = "none";
      }
    });

    // Atualizar dados do usuário quando logado
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          if (btnLogoutModal) btnLogoutModal.style.display = "flex";
          if (logBtn) logBtn.style.display = "none";

          // set email if available
          userEmail.textContent = user.email || '';

          // try to fetch registered name from Firestore (collection: usuarios)
          let nome = user.displayName || null;
          try {
            const userDocRef = doc(db, 'usuarios', user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              if (data && data.nome) nome = data.nome;
            }
          } catch (err) {
            console.error('Erro ao buscar documento do usuário:', err);
          }

          welcomeMsg.textContent = `Bem-vindo(a), ${nome || 'Usuário'}`;
        } catch (err) {
          console.error('Erro no onAuthStateChanged handler:', err);
        }
      } else {
        if (btnLogoutModal) btnLogoutModal.style.display = "none";
        if (logBtn) logBtn.style.display = "flex";
        welcomeMsg.textContent = 'Bem-vindo(a), Usuário';
        userEmail.textContent = '';
      }
    });

    // Logout pelo modal
    btnLogoutModal.addEventListener("click", () => {
      signOut(auth).then(() => {
        alert("Logout realizado!");
        window.location.reload();
      }).catch((err) => alert(err.message));
    });