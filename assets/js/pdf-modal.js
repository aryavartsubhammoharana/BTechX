// BTechX - Common PDF Viewer Routing Logic (v15.4)
document.addEventListener("DOMContentLoaded", () => {
  // Purge any legacy modal leftover in cached DOM
  const legacyModal = document.getElementById("pdfModal");
  if (legacyModal) legacyModal.remove();

  const pdfLinks = document.querySelectorAll(".syl-link, .download-btn, .view-btn, .qna-btn");

  pdfLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // Allow default navigation for HTML pages or in-page anchor jumps
      if (href && (href.endsWith(".html") || href.includes(".html#") || href.startsWith("#subjects") || href.startsWith("#year-"))) {
        return;
      }

      e.preventDefault();

      let title = "Document Viewer";
      const subjectEl = link.closest("tr")?.querySelector(".syl-subject-name") || 
                        link.closest(".module-block")?.querySelector("h3") ||
                        link.closest(".note-card")?.querySelector("h3");
      if (subjectEl) {
        title = subjectEl.innerText.trim();
        if (link.classList.contains("qna-btn") || link.innerText.includes("QNA")) {
          title += " - Question Bank (QNA)";
        }
      }

      // Check current page nesting to route to viewer.html properly
      const currentPath = window.location.pathname;
      const isSubfolder = currentPath.includes("/1stYearSub/") || currentPath.includes("/2ndYearSub/");
      const viewerBase = isSubfolder ? "../viewer.html" : "viewer.html";

      // Handle empty or placeholder links immediately
      if (!href || href === "#" || href.includes("javascript:void") || link.innerText.includes("Coming Soon") || link.classList.contains("unavailable")) {
        window.location.href = `${viewerBase}?file=&title=${encodeURIComponent(title)}`;
        return;
      }

      // Normalize file path relative to root where viewer.html is located
      let normalizedFile = href;
      if (!normalizedFile.startsWith("http://") && !normalizedFile.startsWith("https://")) {
        normalizedFile = normalizedFile.replace(/^(\.\.\/)+/, "");
      }

      // Navigate to common standalone viewer in the same tab
      window.location.href = `${viewerBase}?file=${encodeURIComponent(normalizedFile)}&title=${encodeURIComponent(title)}`;
    });
  });
});
