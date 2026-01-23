/**
 * GDPR Popup Component
 * Displays the GDPR PDF in a modal popup with a close button
 */

const GDPR_POPUP_ID = 'gdpr-popup-modal';

/**
 * Creates and returns the GDPR popup HTML
 */
export function getGdprPopupHtml(): string {
    return `
    <div id="${GDPR_POPUP_ID}" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pt-20">
      <div class="relative w-full max-w-4xl h-[85vh] mx-4 bg-pong-darker rounded-xl border border-pong-light shadow-2xl flex flex-col overflow-hidden">
        <!-- Header with close button -->
        <div class="flex items-center justify-between p-4 border-b border-pong-light bg-pong-dark/50">
          <h3 class="font-game text-xl text-pong-primary">GDPR Privacy Policy</h3>
          <button id="gdpr-popup-close-btn" class="p-2 rounded-lg bg-pong-light/10 hover:bg-pong-light/20 transition-colors text-white/80 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <!-- PDF iframe -->
        <div class="flex-1 overflow-hidden">
          <iframe 
            id="gdpr-pdf-iframe"
            src="/gdpr.pdf" 
            class="w-full h-full border-0"
            title="GDPR Privacy Policy"
          ></iframe>
        </div>
        <!-- Footer with close button -->
        <div class="p-4 border-t border-pong-light bg-pong-dark/50 flex justify-end">
          <button id="gdpr-popup-close-btn-footer" class="btn btn-primary px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Shows the GDPR popup modal
 */
export function showGdprPopup(): void {
    const popup = document.getElementById(GDPR_POPUP_ID);
    if (popup) {
        popup.classList.remove('hidden');
        // Prevent body scroll when popup is open
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hides the GDPR popup modal
 */
export function hideGdprPopup(): void {
    const popup = document.getElementById(GDPR_POPUP_ID);
    if (popup) {
        popup.classList.add('hidden');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

/**
 * Initializes the GDPR popup event listeners
 * Call this after the popup HTML has been added to the DOM
 */
export function initGdprPopup(): void {
    const popup = document.getElementById(GDPR_POPUP_ID);
    const closeBtn = document.getElementById('gdpr-popup-close-btn');
    const closeBtnFooter = document.getElementById('gdpr-popup-close-btn-footer');

    // Close on X button click
    closeBtn?.addEventListener('click', hideGdprPopup);

    // Close on footer button click
    closeBtnFooter?.addEventListener('click', hideGdprPopup);

    // Close on backdrop click
    popup?.addEventListener('click', (e) => {
        if (e.target === popup) {
            hideGdprPopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const popupEl = document.getElementById(GDPR_POPUP_ID);
            if (popupEl && !popupEl.classList.contains('hidden')) {
                hideGdprPopup();
            }
        }
    });
}
