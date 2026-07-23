// PDF Viewer Modal Logic
document.addEventListener("DOMContentLoaded", () => {
  if(!document.getElementById("pdfModal")) {
    const modalHTML = `
      <div id="pdfModal" class="pdf-modal">
        <div class="pdf-modal-content">
          <div class="pdf-modal-header">
            <h3 id="pdf-modal-title" style="margin:0; font-size: 1.2rem; color: var(--text);">Document Viewer</h3>
            <button id="pdfCloseBtn" class="pdf-close-btn">&times;</button>
          </div>
          <div id="pdfModalBody" class="pdf-modal-body">
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  const pdfModal = document.getElementById("pdfModal");
  const pdfCloseBtn = document.getElementById("pdfCloseBtn");
  const pdfModalBody = document.getElementById("pdfModalBody");
  const pdfModalTitle = document.getElementById("pdf-modal-title");

  const closeModal = () => {
    pdfModal.classList.remove("active");
    pdfModalBody.innerHTML = ""; 
  };

  if(pdfCloseBtn) pdfCloseBtn.addEventListener("click", closeModal);
  if(pdfModal) {
    pdfModal.addEventListener("click", (e) => {
      if (e.target === pdfModal) closeModal();
    });
  }

  const showNotFound = () => {
    pdfModalBody.innerHTML = `
      <div class="pdf-not-found" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; background: rgba(10, 10, 10, 0.9); height: 100%;">
        <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #ef4444; margin-bottom: 15px;"></i>
        <h4 style="color: var(--text); margin-bottom: 10px; font-size: 1.3rem;">PDF / Notes Not Available</h4>
        <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 80%; margin: 0 auto;">PDF is not available or Notes is not available in our file structure. Please check back later.</p>
      </div>
    `;
  };

  const showIframe = (href) => {
    pdfModalBody.innerHTML = `
      <iframe src="${href}" width="100%" height="100%" frameborder="0" style="border-radius: 0 0 12px 12px; background: #fff;"></iframe>
    `;
  };

  const pdfLinks = document.querySelectorAll(".syl-link, .download-btn, .view-btn");
  
  pdfLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      
      if (href && href.endsWith(".html")) {
         return; 
      }

      e.preventDefault();
      
      let title = "Document Viewer";
      const subjectEl = link.closest("tr")?.querySelector(".syl-subject-name") || link.closest(".module-block")?.querySelector("h3");
      if (subjectEl) {
         title = subjectEl.innerText;
      }
      pdfModalTitle.innerText = title;

      // Handle missing/dummy links immediately
      if (!href || href === "#" || href.includes("javascript:void") || link.innerText.includes("Coming Soon") || link.classList.contains("unavailable")) {
        pdfModal.classList.add("active");
        showNotFound();
        return;
      }

      // Show loading spinner
      pdfModal.classList.add("active");
      pdfModalBody.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color: var(--text);"><i class="fas fa-spinner fa-spin fa-2x"></i></div>`;

      // Construct absolute URL for Google Drive Viewer
      const tempAnchor = document.createElement("a");
      tempAnchor.href = href;
      const absoluteUrl = tempAnchor.href;

      // Check if file exists on server
      fetch(href, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const isMobile = window.innerWidth <= 1024;
            if (isMobile) {
              closeModal();
              // Open PDF directly in a new tab for mobile (uses browser's native PDF viewer)
              window.open(href, '_blank');
            } else {
              showIframe(href);
            }
          } else {
            showNotFound();
          }
        })
        .catch(() => {
          // Fallback for local testing (file:// protocol) where fetch throws CORS error
          if (window.location.protocol.startsWith("file")) {
            const isMobile = window.innerWidth <= 1024;
            if (isMobile) {
              closeModal();
              // Open locally
              window.open(href, '_blank');
            } else {
              showIframe(href);
            }
          } else {
            showNotFound();
          }
        });
    });
  });
});
