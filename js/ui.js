/* ==========================================================================
   Shared UI (mobile nav, footer year)
   ========================================================================== */

const NavUI = {
  init() {
    const btn = document.getElementById("mobile-menu-btn");
    const panel = document.getElementById("mobile-nav");
    const close = document.getElementById("nav-close");
    const backdrop = document.getElementById("nav-backdrop");
    const links = panel.querySelectorAll("a");
    const open = () => { panel.classList.add("open"); backdrop.style.display = "block"; btn.setAttribute("aria-expanded", "true"); };
    const closeNav = () => { panel.classList.remove("open"); backdrop.style.display = "none"; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", open);
    close.addEventListener("click", closeNav);
    backdrop.addEventListener("click", closeNav);
    links.forEach(a => a.addEventListener("click", closeNav));
  }
};

function setFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
}

if (typeof window !== "undefined") {
  window.NavUI = NavUI;
  window.setFooterYear = setFooterYear;
}
