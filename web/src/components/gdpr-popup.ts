// GDPR Popup Component
// Simple text display of privacy rights

import { t } from '../i18n';

const GDPR_POPUP_ID = 'gdpr-popup-modal';

export function getGdprPopupHtml(): string {
  return `
    <div id="${GDPR_POPUP_ID}" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-pong-darker rounded-lg border border-pong-light overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-pong-light">
          <h3 class="text-xl text-white font-semibold" id="gdpr-popup-title">${t('gdpr.popup.title')}</h3>
          <button id="gdpr-popup-close-btn" class="text-white/60 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Intro -->
          <p class="text-white/80 leading-relaxed" id="gdpr-intro-text">${t('gdpr.popup.intro')}</p>

          <!-- Data Collection -->
          <div>
            <h4 class="text-white font-semibold mb-2" id="gdpr-data-collect-title">${t('gdpr.popup.dataWeCollect')}</h4>
            <p class="text-white/70 text-sm" id="gdpr-data-list">${t('gdpr.popup.dataList')}</p>
          </div>

          <!-- Rights List -->
          <div>
            <h4 class="text-white font-semibold mb-3" id="gdpr-rights-heading">${t('gdpr.popup.rightsHeading')}</h4>
            <div class="space-y-3">
              ${generateRightText('access')}
              ${generateRightText('rectification')}
              ${generateRightText('erasure')}
              ${generateRightText('restriction')}
              ${generateRightText('portability')}
              ${generateRightText('object')}
              ${generateRightText('withdraw')}
              ${generateRightText('complain')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-pong-light flex justify-end">
          <button id="gdpr-popup-close-btn-footer" class="px-6 py-2 bg-pong-primary text-white rounded hover:bg-pong-primary/80 transition-colors">
            ${t('common.close')}
          </button>
        </div>
      </div>
    </div>
  `;
}

function generateRightText(rightKey: string): string {
  return `
        <div class="gdpr-right-item">
          <h5 class="text-white text-sm font-medium mb-1 gdpr-right-title" data-key="${rightKey}">${t(`gdpr.popup.rights.${rightKey}.title`)}</h5>
          <p class="text-white/60 text-sm gdpr-right-desc" data-key="${rightKey}">${t(`gdpr.popup.rights.${rightKey}.description`)}</p>
        </div>
    `;
}

export function showGdprPopup(): void {
  const popup = document.getElementById(GDPR_POPUP_ID);
  if (popup) {
    popup.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateGdprPopupTranslations();
  }
}

export function hideGdprPopup(): void {
  const popup = document.getElementById(GDPR_POPUP_ID);
  if (popup) {
    popup.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

export function updateGdprPopupTranslations(): void {
  const title = document.getElementById('gdpr-popup-title');
  if (title) title.textContent = t('gdpr.popup.title');

  const intro = document.getElementById('gdpr-intro-text');
  if (intro) intro.textContent = t('gdpr.popup.intro');

  const dataCollectTitle = document.getElementById('gdpr-data-collect-title');
  if (dataCollectTitle) dataCollectTitle.textContent = t('gdpr.popup.dataWeCollect');

  const dataList = document.getElementById('gdpr-data-list');
  if (dataList) dataList.textContent = t('gdpr.popup.dataList');

  const rightsHeading = document.getElementById('gdpr-rights-heading');
  if (rightsHeading) rightsHeading.textContent = t('gdpr.popup.rightsHeading');

  const rightTitles = document.querySelectorAll('.gdpr-right-title');
  rightTitles.forEach((el) => {
    const key = el.getAttribute('data-key');
    if (key) el.textContent = t(`gdpr.popup.rights.${key}.title`);
  });

  const rightDescs = document.querySelectorAll('.gdpr-right-desc');
  rightDescs.forEach((el) => {
    const key = el.getAttribute('data-key');
    if (key) el.textContent = t(`gdpr.popup.rights.${key}.description`);
  });
}

export function initGdprPopup(): void {
  const popup = document.getElementById(GDPR_POPUP_ID);
  const closeBtn = document.getElementById('gdpr-popup-close-btn');
  const closeBtnFooter = document.getElementById('gdpr-popup-close-btn-footer');

  closeBtn?.addEventListener('click', hideGdprPopup);
  closeBtnFooter?.addEventListener('click', hideGdprPopup);

  popup?.addEventListener('click', (e) => {
    if (e.target === popup) {
      hideGdprPopup();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const popupEl = document.getElementById(GDPR_POPUP_ID);
      if (popupEl && !popupEl.classList.contains('hidden')) {
        hideGdprPopup();
      }
    }
  });
}
