// Navigation and Back to Top
document.addEventListener("DOMContentLoaded", () => {
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenu = document.getElementById("closeMenu");
    
    if (navToggle && mobileMenu) {
        navToggle.addEventListener("click", () => mobileMenu.classList.add("open"));
        if (closeMenu) {
            closeMenu.addEventListener("click", () => mobileMenu.classList.remove("open"));
        }
        mobileMenu.addEventListener("click", (e) => {
            if (e.target === mobileMenu) mobileMenu.classList.remove("open");
        });
    }

    const btt = document.getElementById("backToTop");
    if (btt) {
        let scrollTimeout;
        window.addEventListener("scroll", () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    btt.classList.toggle("visible", window.scrollY > 400);
                    scrollTimeout = null;
                }, 100);
            }
        }, { passive: true });
        btt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
});
