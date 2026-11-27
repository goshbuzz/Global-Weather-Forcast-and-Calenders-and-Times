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

function initReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

if (typeof window !== "undefined") {
  window.NavUI = NavUI;
  window.setFooterYear = setFooterYear;
  window.initReveals = initReveals;
}

if (typeof window !== "undefined") {
  window.NavUI = NavUI;
  window.setFooterYear = setFooterYear;
}
