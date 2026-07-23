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
      <div class="pdf-not-found">
        <i class="fas fa-file-excel" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 15px;"></i>
        <h4 style="color: var(--text); margin-bottom: 5px;">PDF Not Available</h4>
        <p style="color: var(--text-muted); font-size: 0.95rem;">This document is not uploaded yet. Please check back later.</p>
      </div>
    `;
  };

  const showIframe = (href) => {
    let finalUrl = href;
    // Use Google Drive Viewer for mobile/tablet if not on local file system
    if (window.innerWidth <= 1024 && !window.location.protocol.startsWith("file")) {
       const a = document.createElement("a");
       a.href = href;
       const absoluteUrl = a.href;
       finalUrl = `https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;
    }

    pdfModalBody.innerHTML = `
      <iframe src="${finalUrl}" width="100%" height="100%" frameborder="0" style="border-radius: 0 0 12px 12px;"></iframe>
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
      pdfModal.classList.add("active");
      
      let title = "Document Viewer";
      const subjectEl = link.closest("tr")?.querySelector(".syl-subject-name") || link.closest(".module-block")?.querySelector("h3");
      if (subjectEl) {
         title = subjectEl.innerText;
      }
      pdfModalTitle.innerText = title;
      
      if (!href || href === "#" || href.includes("javascript:void") || link.innerText.includes("Coming Soon") || link.classList.contains("unavailable")) {
        showNotFound();
        return;
      }

      pdfModalBody.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color: var(--text);"><i class="fas fa-spinner fa-spin fa-2x"></i></div>`;

      fetch(href, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            showIframe(href);
          } else {
            showNotFound();
          }
        })
        .catch(() => {
          pdfModalBody.innerHTML = `
            <object data="${href}" type="application/pdf" width="100%" height="100%" style="border-radius: 0 0 12px 12px;" id="pdfObjFallback">
               <div class="pdf-not-found">
                 <i class="fas fa-file-excel" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                 <h4 style="color: var(--text); margin-bottom: 5px;">PDF Not Available</h4>
                 <p style="color: var(--text-muted); font-size: 0.95rem;">This document is not uploaded yet or missing locally.</p>
               </div>
            </object>
          `;
          const obj = document.getElementById("pdfObjFallback");
          if(obj) {
            obj.onerror = showNotFound;
          }
        });
    });
  });
});
