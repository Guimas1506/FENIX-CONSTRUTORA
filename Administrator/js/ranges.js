function updateValue(id) {
                  document.getElementById(id + '-value').textContent = document.getElementById(id).value;
                }
                ['quartos', 'banheiros', 'vagas', 'suites'].forEach(function(id) {
                  document.getElementById(id).addEventListener('input', function() {
                    updateValue(id);
                  });
                });