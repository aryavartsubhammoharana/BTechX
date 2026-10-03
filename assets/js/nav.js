// Navigation and Back to Top
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenu = document.getElementById("closeMenu");

    // Helper functions to open and close mobile drawer
    function openDrawer() {
        if (!mobileMenu) return;
        mobileMenu.classList.add("open");
        if (navToggle) navToggle.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove("open");
        if (navToggle) navToggle.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (navToggle && mobileMenu) {
        navToggle.addEventListener("click", () => {
            if (mobileMenu.classList.contains("open")) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });

        if (closeMenu) {
            closeMenu.addEventListener("click", closeDrawer);
        }

        // Close on clicking backdrop (outside .mobile-menu-panel)
        mobileMenu.addEventListener("click", (e) => {
            if (e.target === mobileMenu) {
                closeDrawer();
            }
        });

        // Close when clicking any menu link inside drawer
        const menuLinks = mobileMenu.querySelectorAll("a");
        menuLinks.forEach(link => {
            link.addEventListener("click", () => {
                closeDrawer();
            });
        });

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
                closeDrawer();
            }
        });
    }

    // Scroll state for navbar (.scrolled) and back-to-top button
    const btt = document.getElementById("backToTop");
    let isTicking = false;

    function handleScroll() {
        const scrollY = window.scrollY;

        // Dynamic scrolled navbar styling
        if (navbar) {
            if (scrollY > 20) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        }

        // Back to top button visibility
        if (btt) {
            btt.classList.toggle("visible", scrollY > 400);
        }

        isTicking = false;
    }

    window.addEventListener("scroll", () => {
        if (!isTicking) {
            window.requestAnimationFrame(handleScroll);
            isTicking = true;
        }
    }, { passive: true });

    // Initial check on load in case page is refreshed while scrolled
    handleScroll();

    if (btt) {
        btt.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});
