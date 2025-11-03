      function toggleInfo(element) {
        const content = element.nextElementSibling;
        const parent = element.parentElement;
        parent.classList.toggle('active');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      }