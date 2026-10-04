// Navigation and Back to Top
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const navToggle = document.getElementById("navToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenu = document.getElementById("closeMenu");

    // Helper functions to open and close mobile drawer
    function openDrawer() {
        if (!mobileMenu) return;
        if (navbar && navbar.classList.contains("scrolled")) {
            mobileMenu.classList.add("is-scrolled");
        } else {
            mobileMenu.classList.remove("is-scrolled");
        }
        mobileMenu.classList.add("open");
        if (navToggle) navToggle.classList.add("active");
        document.body.style.overflow = "hidden";
        if (typeof updateStorageUI === "function") {
            updateStorageUI();
        }
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

    // ══════════════════════════════════════════════════════════════════════
    // BROWSER STORAGE PROFILE INDICATOR (Desktop Navbar & Mobile Drawer)
    // ══════════════════════════════════════════════════════════════════════

    function getStorageStats() {
        let totalChars = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const val = localStorage.getItem(key) || '';
                    totalChars += key.length + val.length;
                }
            }
        } catch (e) {}

        const totalBytes = totalChars * 2; // UTF-16 chars = ~2 bytes
        const maxBytes = 5 * 1024 * 1024; // 5 MB standard allocation
        const freeBytes = Math.max(0, maxBytes - totalBytes);

        const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
        const freeMB = (freeBytes / (1024 * 1024)).toFixed(2);
        const freePercent = ((freeBytes / maxBytes) * 100).toFixed(1);
        const usedPercent = (100 - parseFloat(freePercent)).toFixed(1);

        return {
            totalMB: '5.00 MB',
            usedMB,
            freeMB,
            freePercent,
            usedPercent,
            totalBytes
        };
    }

    function updateStorageUI() {
        const stats = getStorageStats();

        // 1. Update Desktop Popover
        const popoverFreeVal = document.getElementById("popoverFreeVal");
        const popoverUsedVal = document.getElementById("popoverUsedVal");
        const popoverProgressFill = document.getElementById("popoverProgressFill");
        const desktopStorageDot = document.getElementById("desktopStorageDot");

        if (popoverFreeVal) {
            popoverFreeVal.innerText = `${stats.freeMB} MB (${stats.freePercent}% Baaki)`;
        }
        if (popoverUsedVal) {
            popoverUsedVal.innerText = `${stats.usedMB} MB / 5.00 MB`;
        }
        if (popoverProgressFill) {
            popoverProgressFill.style.width = `${stats.freePercent}%`;
            if (parseFloat(stats.freePercent) < 15) {
                popoverProgressFill.style.background = "#ef4444";
                if (desktopStorageDot) desktopStorageDot.style.background = "#ef4444";
            } else if (parseFloat(stats.freePercent) < 40) {
                popoverProgressFill.style.background = "#eab308";
                if (desktopStorageDot) desktopStorageDot.style.background = "#eab308";
            } else {
                popoverProgressFill.style.background = "linear-gradient(90deg, #22c55e, #38bdf8)";
                if (desktopStorageDot) desktopStorageDot.style.background = "#22c55e";
            }
        }

        // 2. Update Mobile Drawer Widget
        const mobileFreeVal = document.getElementById("mobileFreeVal");
        const mobileFreeBadge = document.getElementById("mobileFreeBadge");
        const mobileProgressFill = document.getElementById("mobileProgressFill");

        if (mobileFreeVal) {
            mobileFreeVal.innerText = `${stats.freeMB} MB Baaki`;
        }
        if (mobileFreeBadge) {
            mobileFreeBadge.innerText = `${stats.freePercent}% Free`;
        }
        if (mobileProgressFill) {
            mobileProgressFill.style.width = `${stats.freePercent}%`;
            if (parseFloat(stats.freePercent) < 15) {
                mobileProgressFill.style.background = "#ef4444";
            } else if (parseFloat(stats.freePercent) < 40) {
                mobileProgressFill.style.background = "#eab308";
            } else {
                mobileProgressFill.style.background = "linear-gradient(90deg, #22c55e, #38bdf8)";
            }
        }
    }

    function initStorageWidgets() {
        // Desktop Navbar Injection (Next to Tools)
        const navbarLinks = document.querySelector(".navbar-links");
        if (navbarLinks && !document.getElementById("desktopStorageProfile")) {
            const wrapper = document.createElement("div");
            wrapper.className = "storage-profile-wrapper";
            wrapper.id = "desktopStorageProfile";
            wrapper.innerHTML = `
                <button class="storage-profile-btn" id="storageProfileBtn" type="button" title="Browser Storage Status (5 MB)" aria-label="Storage Profile">
                    <i class="fas fa-user-circle"></i>
                    <span class="storage-status-dot" id="desktopStorageDot"></span>
                </button>
                <div class="storage-profile-popover" id="storageProfilePopover">
                    <div class="spp-header">
                        <div class="spp-avatar">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="spp-title-group">
                            <div class="spp-title">Browser Storage</div>
                            <div class="spp-badge">5.00 MB Total Capacity</div>
                        </div>
                    </div>
                    <div class="spp-stats-row">
                        <div class="spp-stat">
                            <span class="spp-label">Space Baaki (Free)</span>
                            <span class="spp-val free-val" id="popoverFreeVal">5.00 MB (100%)</span>
                        </div>
                        <div class="spp-stat" style="text-align: right;">
                            <span class="spp-label">Space Used</span>
                            <span class="spp-val" id="popoverUsedVal">0.00 MB</span>
                        </div>
                    </div>
                    <div class="spp-progress-bar">
                        <div class="spp-progress-fill" id="popoverProgressFill" style="width: 100%;"></div>
                    </div>
                    <div class="spp-footer">
                        <span class="spp-desc"><i class="fas fa-highlighter"></i> Saved highlights &amp; data</span>
                        <button class="spp-clear-btn" id="storageClearBtn" type="button" title="Clear saved highlight data">Clear Data</button>
                    </div>
                </div>
            `;
            navbarLinks.appendChild(wrapper);

            const profileBtn = wrapper.querySelector("#storageProfileBtn");
            const popover = wrapper.querySelector("#storageProfilePopover");
            const clearBtn = wrapper.querySelector("#storageClearBtn");

            profileBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = popover.classList.toggle("open");
                profileBtn.classList.toggle("active", isOpen);
                if (isOpen) updateStorageUI();
            });

            document.addEventListener("click", (e) => {
                if (!wrapper.contains(e.target)) {
                    popover.classList.remove("open");
                    profileBtn.classList.remove("active");
                }
            });

            if (clearBtn) {
                clearBtn.addEventListener("click", () => {
                    if (confirm("Clear saved PDF highlights & local browser data?")) {
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (k && (k.startsWith("btechx_") || k.includes("hl_") || k.includes("pdf"))) {
                                keysToRemove.push(k);
                            }
                        }
                        keysToRemove.forEach(k => localStorage.removeItem(k));
                        updateStorageUI();
                        alert("Storage cleared successfully!");
                    }
                });
            }
        }

        // Mobile Drawer Injection (Bottom of drawer panel)
        const mobilePanel = document.querySelector(".mobile-menu-panel");
        if (mobilePanel && !document.getElementById("mobileStorageWidget")) {
            const msw = document.createElement("div");
            msw.className = "mobile-storage-widget";
            msw.id = "mobileStorageWidget";
            msw.innerHTML = `
                <div class="msw-header">
                    <div class="msw-avatar">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="msw-info">
                        <span class="msw-title">Browser Storage</span>
                        <span class="msw-val" id="mobileFreeVal">5.00 MB Baaki</span>
                    </div>
                    <span class="msw-badge" id="mobileFreeBadge">100% Free</span>
                </div>
                <div class="msw-progress-bar">
                    <div class="msw-progress-fill" id="mobileProgressFill" style="width: 100%;"></div>
                </div>
                <div class="msw-sub">
                    <span>5 MB Maximum Allocated</span>
                    <span>Highlights &amp; Offline Cache</span>
                </div>
            `;
            mobilePanel.appendChild(msw);
        }

        updateStorageUI();
    }

    initStorageWidgets();

    // Sync storage if highlights are updated in another tab or viewer
    window.addEventListener("storage", () => {
        updateStorageUI();
    });

    // Track internal link navigation so intro isn't triggered when switching pages (About -> Home, etc.)
    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
            try {
                sessionStorage.setItem("btxLastInternalNav", Date.now().toString());
            } catch (err) {}
        } else if (href.includes(window.location.hostname) || href.includes("btechx")) {
            try {
                sessionStorage.setItem("btxLastInternalNav", Date.now().toString());
            } catch (err) {}
        }
    }, { capture: true, passive: true });
});
