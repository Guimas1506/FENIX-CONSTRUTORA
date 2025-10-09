                const desc = document.getElementById('descricao');
                const count = document.getElementById('desc-count');
                desc.addEventListener('input', function() {
                  count.textContent = `${desc.value.length}/500 caracteres`;
                });