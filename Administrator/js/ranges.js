document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.range-row').forEach(row => {
    const input = row.querySelector('.range-input');
    const display = row.querySelector('.range-value');
    if (!input || !display) return;
    display.textContent = String(input.value).padStart(2, '0');
    input.addEventListener('input', () => {
      display.textContent = String(input.value).padStart(2, '0');
    });
  });
});