import { auth, db } from '../../firebase.js';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let currentUser = null;

// util: encontra expand-box pelo texto do <h3>
function findBoxByTitle(rx) {
  const boxes = Array.from(document.querySelectorAll('.expand-box'));
  return boxes.find(box => {
    const h3 = box.querySelector('.expand-header h3');
    return h3 && rx.test(h3.textContent.trim());
  }) || null;
}

// obtém provider (signInProvider) de forma resiliente
async function detectProvider(user) {
  if (!user) return null;
  try {
    const tokenRes = await getIdTokenResult(user);
    return tokenRes?.signInProvider || null;
  } catch {
    return (Array.isArray(user.providerData) && user.providerData[0]) ? user.providerData[0].providerId : null;
  }
}

async function obterEmailDoUser(user) {
  if (!user) return null;
  if (user.email) return user.email;
  if (Array.isArray(user.providerData) && user.providerData.length) {
    const pd = user.providerData.find(p => p && p.email);
    if (pd && pd.email) return pd.email;
  }
  try { if (typeof user.reload === 'function') await user.reload(); } catch (err) { /* ignore */ }
  if (user.email) return user.email;
  if (Array.isArray(user.providerData) && user.providerData.length) {
    const pd2 = user.providerData.find(p => p && p.email);
    if (pd2 && pd2.email) return pd2.email;
  }
  try {
    const tokenRes = await getIdTokenResult(user);
    if (tokenRes?.claims?.email) return tokenRes.claims.email;
    const identities = tokenRes?.claims?.firebase?.identities;
    if (identities && typeof identities === 'object') {
      for (const key of Object.keys(identities)) {
        const arr = identities[key];
        if (Array.isArray(arr) && arr.length) {
          const maybe = arr.find(x => typeof x === 'string' && x.includes('@'));
          if (maybe) return maybe;
        }
      }
    }
  } catch (e) { /* ignore */ }
  // fallback Firestore
  try {
    const u = await getDoc(doc(db, 'users', user.uid));
    if (u.exists() && u.data().email) return u.data().email;
    const u2 = await getDoc(doc(db, 'usuarios', user.uid));
    if (u2.exists() && u2.data().email) return u2.data().email;
  } catch (e) { /* ignore */ }
  return null;
}

async function carregarDadosUsuario(uid) {
  try {
    const docRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const dados = docSnap.data();
    const nomeBox = findBoxByTitle(/nome/i);
    if (dados.nome && nomeBox) {
      const p = nomeBox.querySelector('.expand-header p');
      if (p) p.textContent = dados.nome;
    }
    const telefoneBox = findBoxByTitle(/telefone/i);
    if (dados.telefone && telefoneBox) {
      const p = telefoneBox.querySelector('.expand-header p');
      if (p) p.textContent = dados.telefone;
    }
    const ufBox = findBoxByTitle(/^uf$/i);
    if (dados.uf && ufBox) {
      const p = ufBox.querySelector('.expand-header p');
      if (p) p.textContent = dados.uf;
    }
    const cidadeBox = findBoxByTitle(/cidade/i);
    if (dados.cidade && cidadeBox) {
      const p = cidadeBox.querySelector('.expand-header p');
      if (p) p.textContent = dados.cidade;
    }
  } catch (err) {
    console.error('Erro ao carregar dados do Firestore:', err);
  }
}

// ajusta visibilidade de Email e Senha conforme provedor
async function adjustFieldsByProvider(provider, user) {
  const emailBox = findBoxByTitle(/email/i);
  const senhaBox = findBoxByTitle(/senha/i);

  // esconde/mostra o <hr> imediatamente anterior ao box para evitar linha dupla
  function setPrevHrVisibility(box, visible) {
    if (!box) return;
    let prev = box.previousElementSibling;
    let attempts = 0;
    while (prev && prev.tagName !== 'HR' && attempts < 6) {
      prev = prev.previousElementSibling;
      attempts++;
    }
    if (prev && prev.tagName === 'HR') prev.style.display = visible ? '' : 'none';
  }

  if (provider === 'google.com') {
    if (emailBox) {
      emailBox.style.display = 'none';
      setPrevHrVisibility(emailBox, false); // evita linha dupla
    }
    if (senhaBox) {
      const headerP = senhaBox.querySelector('.expand-header p');
      const content = senhaBox.querySelector('.expand-content');
      if (headerP) headerP.textContent = 'Conta Google';
      if (content) {
        content.innerHTML = `
          <p style="padding:15px;color:#666">
            Acesso vinculado a Conta Google
          </p>`;
      }
      senhaBox.style.display = 'block';
      setPrevHrVisibility(senhaBox, true);
    }
  } else {
    if (emailBox) {
      emailBox.style.display = '';
      setPrevHrVisibility(emailBox, true); // restaura linha
    }
    if (senhaBox) {
      senhaBox.style.display = '';
      setPrevHrVisibility(senhaBox, true);
      // quando senha box visível, (re)initialize reset button behavior
      initPasswordBoxBehavior(senhaBox, user);
    }
  }
}

// monta/reativa comportamento do box de senha (botão reset) quando mostrado
function initPasswordBoxBehavior(senhaBox, user) {
  if (!senhaBox) return;
  const content = senhaBox.querySelector('.expand-content');
  if (!content) return;

  // reescreve conteúdo para garantir estado limpo e evitar listeners duplicados
  content.innerHTML = `
    <p style="padding: 15px; color: #666; margin-bottom: 10px;">
      Para alterar a senha, será enviado um e‑mail de redefinição para sua conta.
    </p>
    <button type="button" id="send-reset-email-btn">Enviar e‑mail de redefinição</button>
    <div id="password-message" role="status" aria-live="polite" style="margin-top:10px;color:#333;"></div>
  `;
  const btn = content.querySelector('#send-reset-email-btn');
  const msgEl = content.querySelector('#password-message');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    msgEl.textContent = '';
    const userNow = (auth && auth.currentUser) ? auth.currentUser : user;
    if (!userNow) {
      msgEl.style.color = 'red';
      msgEl.textContent = 'Usuário não autenticado.';
      return;
    }

    // detect provider e impede envio para contas federadas (Google)
    let provider = null;
    try {
      const tokenRes = await getIdTokenResult(userNow);
      provider = tokenRes?.signInProvider || null;
    } catch {
      provider = (Array.isArray(userNow.providerData) && userNow.providerData[0]) ? userNow.providerData[0].providerId : null;
    }

    if (provider === 'google.com') {
      alert('Acesso vinculado a Conta Google');
      return;
    }

    const email = await obterEmailDoUser(userNow);
    if (!email || typeof email !== 'string') {
      msgEl.style.color = 'red';
      msgEl.textContent = 'E‑mail não disponível para envio.';
      return;
    }

    if (!confirm(`Deseja enviar o e‑mail de redefinição para ${email}?`)) return;

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      // envia reset (mesma assinatura usada em log-in.js)
      await sendPasswordResetEmail(auth, email);
      msgEl.style.color = 'green';
      msgEl.textContent = `E‑mail de redefinição enviado para ${email}. Verifique sua caixa de entrada.`;
      // se houver função showPopup (como em log-in.js), usa-la também
      if (typeof window.showPopup === 'function') window.showPopup('📧 E-mail de redefinição enviado!');
    } catch (error) {
      const code = error?.code || 'unknown';
      const message = error?.message || String(error);
      msgEl.style.color = 'red';
      msgEl.textContent = `Erro ao enviar e‑mail (${code}): ${message}`;
      console.error('sendPasswordResetEmail error:', code, message, error);

      // dicas rápidas para erros comuns
      if (code === 'auth/user-not-found') {
        console.warn('auth/user-not-found — verifique se o e‑mail existe no Firebase Auth');
      } else if (code === 'auth/invalid-email') {
        console.warn('auth/invalid-email — email com formato inválido:', email);
      } else if (code === 'auth/too-many-requests') {
        console.warn('auth/too-many-requests — tente novamente mais tarde');
      } else if (code === 'auth/operation-not-allowed') {
        console.warn('auth/operation-not-allowed — habilite Email/Password em Firebase Console > Authentication > Sign-in method');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar e‑mail de redefinição';
    }
  });
}

// atualiza o display do e-mail (apenas se campo visível)
async function updateEmailDisplay(user) {
  const provider = await detectProvider(user);
  if (provider === 'google.com') return; // não mostrar email para Google
  const email = await obterEmailDoUser(user);
  const emailBox = findBoxByTitle(/email/i);
  if (!emailBox) return;
  const headerP = emailBox.querySelector('.expand-header p');
  const content = emailBox.querySelector('.expand-content');
  if (email) {
    if (headerP) headerP.textContent = email;
    if (content) content.innerHTML = `<p style="padding:15px;color:#666">O e‑mail da conta é <strong>${email}</strong>. Não pode ser alterado aqui.</p>`;
  } else {
    if (headerP) headerP.textContent = 'Não informado';
    if (content) content.innerHTML = `<p style="padding:15px;color:#666">E‑mail não disponível no momento.</p>`;
  }
}

// salva valor em Firestore (usuarios)
async function salvarDado(campo, valor) {
  if (!currentUser) { alert('Usuário não autenticado.'); return; }
  try {
    await setDoc(doc(db, "usuarios", currentUser.uid), { [campo]: valor }, { merge: true });
    alert('Salvo: ' + valor);
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar: ' + (err.message || err));
  }
}

// inicialização dos boxes (eventos de abrir/fechar e botões salvar)
function initBoxes() {
  const boxes = Array.from(document.querySelectorAll('.expand-box'));
  boxes.forEach((box) => {
    const header = box.querySelector('.expand-header');
    const content = box.querySelector('.expand-content');
    if (!header || !content) return;

    function setExpanded(expanded) {
      box.classList.toggle('expanded', expanded);
      box.setAttribute('aria-expanded', String(expanded));
      content.setAttribute('aria-hidden', String(!expanded));
      if (expanded) {
        const input = content.querySelector('input');
        if (input) input.focus();
      }
    }

    header.addEventListener('click', () => setExpanded(!box.classList.contains('expanded')));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!box.classList.contains('expanded')); }
    });

    // attach save handlers by title
    const title = (header.querySelector('h3')?.textContent || '').trim().toLowerCase();
    const saveBtn = content.querySelector('button');
    const input = content.querySelector('input');

    if (/^nome$/i.test(title) && saveBtn && input) {
      saveBtn.addEventListener('click', async () => {
        const value = input.value.trim();
        if (!value) { alert('Informe um valor para salvar.'); input.focus(); return; }
        await salvarDado('nome', value);
        const p = header.querySelector('p'); if (p) p.textContent = value;
        input.value = '';
        setExpanded(false);
      });
    }

    if (/telefone/i.test(title) && saveBtn && input) {
      saveBtn.addEventListener('click', async () => {
        const value = input.value.trim();
        if (!value) { alert('Informe um valor para salvar.'); input.focus(); return; }
        await salvarDado('telefone', value);
        const p = header.querySelector('p'); if (p) p.textContent = value;
        input.value = '';
        setExpanded(false);
      });
    }

    if (/^uf$/i.test(title) && saveBtn && input) {
      saveBtn.addEventListener('click', async () => {
        const value = input.value.trim().toUpperCase();
        if (!value) { alert('Informe um valor para salvar.'); input.focus(); return; }
        await salvarDado('uf', value);
        const p = header.querySelector('p'); if (p) p.textContent = value;
        input.value = '';
        setExpanded(false);
      });
    }

    if (/cidade/i.test(title) && saveBtn && input) {
      saveBtn.addEventListener('click', async () => {
        const value = input.value.trim();
        if (!value) { alert('Informe um valor para salvar.'); input.focus(); return; }
        await salvarDado('cidade', value);
        const p = header.querySelector('p'); if (p) p.textContent = value;
        input.value = '';
        setExpanded(false);
      });
    }

    // note: email and senha boxes are handled separately (visibility / reset)
  });
}

// onAuthStateChanged: detect provider and adapt UI
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return;
  }
  currentUser = user;
  await carregarDadosUsuario(user.uid);
  const provider = await detectProvider(user);
  await adjustFieldsByProvider(provider, user); // hides/shows email & senha boxes
  if (provider !== 'google.com') {
    await updateEmailDisplay(user);
  }
});

// DOM ready init
document.addEventListener('DOMContentLoaded', () => {
  initBoxes();
  // se já autenticado, aplica ajustes imediatos
  if (auth && auth.currentUser) {
    (async () => {
      currentUser = auth.currentUser;
      const provider = await detectProvider(currentUser);
      await adjustFieldsByProvider(provider, currentUser);
      if (provider !== 'google.com') await updateEmailDisplay(currentUser);
      await carregarDadosUsuario(currentUser.uid);
    })();
  }
});