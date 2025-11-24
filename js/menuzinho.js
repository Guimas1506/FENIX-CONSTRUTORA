const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

openMenu.addEventListener("click", () => {

  sideMenu.classList.add("open");
  overlay.classList.add("show");
});

closeMenu.addEventListener("click", () => {

  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
});

overlay.addEventListener("click", () => {
            sideMenu.style.display = "none"
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
});
