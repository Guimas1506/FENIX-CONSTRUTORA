function setActive(element) {
  document.querySelectorAll(".active").forEach(el => {
    el.classList.remove("active");
  });
  element.classList.add("active");
}

// Abre/fecha o submenu do Gerenciar
function toggleSubMenu(element) {
  const submenu = element.nextElementSibling;

  submenu.classList.toggle("show");
  setActive(element);
}
