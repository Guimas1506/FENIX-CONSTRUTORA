function atualizarRanges() {
  document.querySelectorAll('.range-row').forEach(row => {
    const input = row.querySelector('.range-input');
    const display = row.querySelector('.range-value');
    if (!input || !display) return;
    // Atualiza display com valor atual do input
    display.textContent = String(input.value).padStart(2, '0');

    // Atualiza display quando o usuário mexe no slide
    input.addEventListener('input', () => {
      display.textContent = String(input.value).padStart(2, '0');
    });
  });
}

// Espera o DOM carregar
document.addEventListener('DOMContentLoaded', atualizarRanges);
