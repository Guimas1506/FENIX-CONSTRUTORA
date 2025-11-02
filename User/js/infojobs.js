        (function () {
  const boxes = document.querySelectorAll('.expand-box');

  boxes.forEach(box => {
    const header = box.querySelector('.expand-header');
    const content = box.querySelector('.expand-content');
    const saveBtn = content.querySelector('button');
    const input = content.querySelector('input');

    function setExpanded(expanded) {
      box.classList.toggle('expanded', expanded);
      box.setAttribute('aria-expanded', String(expanded));
      content.setAttribute('aria-hidden', String(!expanded));
      if (expanded) input.focus();
    }

    function toggle() {
      setExpanded(!box.classList.contains('expanded'));
    }

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    saveBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (!value) {
        alert('Informe um valor para salvar.');
        input.focus();
        return;
      }
      alert('Salvo: ' + value);
      setExpanded(false);
    });
  });
})();
