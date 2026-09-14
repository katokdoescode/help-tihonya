/**
 * Help Тихоня — Core Interactivity Script
 * Handles: Lightbox Gallery, Copy-to-Clipboard with Event Delegation and Toast Notifications
 */

document.addEventListener('DOMContentLoaded', () => {
    initLightbox();
    initClipboard();
});

/* ==========================================================================
   CLIPBOARD & TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function initClipboard() {
    const cards = document.querySelectorAll('.requisite-card');
    const toastContainer = document.getElementById('toastContainer');

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Check if user clicked a nested copy target (like a phone row)
            const nestedTarget = e.target.closest('[data-copy-target]');

            // If the user clicked specifically inside a nested element with its own target and it's not the card itself
            if (nestedTarget && nestedTarget !== card) {
                e.stopPropagation(); // Avoid triggering the parent card click
                const textToCopy = nestedTarget.getAttribute('data-copy-target');
                const label = nestedTarget.querySelector('.credential-label')?.textContent || 'Телефон';
                copyText(textToCopy, label);
                return;
            }

            // Otherwise, copy the main card target
            const textToCopy = card.getAttribute('data-copy-target');
            const label = card.querySelector('.credential-label')?.textContent || 'Реквизиты';
            copyText(textToCopy, label);
        });
    });

    // Handle nested phone row clicks inside cards to ensure they are accessible
    const phoneRows = document.querySelectorAll('.phone-row');
    phoneRows.forEach(row => {
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            const textToCopy = row.getAttribute('data-copy-target');
            copyText(textToCopy, 'Телефон');
        });
    });

    // Let real links inside a card (e.g. PayPal) open normally instead of triggering copy
    const cardLinks = document.querySelectorAll('.credential-link');
    cardLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    /**
     * Copy text to clipboard and show toast notification
     */
    function copyText(text, label) {
        if (!text) return;

        // Clean label names for better UX in Russian
        let cleanLabel = 'Скопировано';
        if (label.toLowerCase().includes('card') || label.toLowerCase().includes('карты')) {
            cleanLabel = 'Номер карты скопирован';
        } else if (label.toLowerCase().includes('iban')) {
            cleanLabel = 'IBAN скопирован';
        } else if (label.toLowerCase().includes('paypal')) {
            cleanLabel = 'Ссылка PayPal скопирована';
        } else if (label.toLowerCase().includes('email')) {
            cleanLabel = 'Email скопирован';
        } else if (label.toLowerCase().includes('адрес') || label.toLowerCase().includes('wallet')) {
            cleanLabel = 'Адрес кошелька скопирован';
        } else if (label.toLowerCase().includes('телефон') || label.toLowerCase().includes('phone')) {
            cleanLabel = 'Номер телефона скопирован';
        }

        // Use modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(`${cleanLabel}! ✓`))
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    fallbackCopyText(text, cleanLabel);
                });
        } else {
            fallbackCopyText(text, cleanLabel);
        }
    }

    /**
     * Fallback method using legacy text selection for older devices / HTTP env
     */
    function fallbackCopyText(text, cleanLabel) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast(`${cleanLabel}! ✓`);
            } else {
                showToast('Не удалось скопировать. Пожалуйста, выделите текст вручную.');
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
            showToast('Не удалось скопировать.');
        }

        document.body.removeChild(textArea);
    }

    /**
     * Displays a modern toast notification
     */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';

        // Add a checkmark SVG icon and text
        toast.innerHTML = `
            <svg class="toast-success-icon" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto remove animation
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 2200);
    }
}

/* ==========================================================================
   LIGHTBOX GALLLERY MODAL
   ========================================================================== */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const fullImgUrl = item.getAttribute('data-full');
            if (!fullImgUrl) return;

            lightboxImg.src = fullImgUrl;
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Lock background scroll
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore scroll
        setTimeout(() => {
            lightboxImg.src = ''; // Clear source once closed
        }, 250);
    };

    // Close on click close-button
    closeBtn.addEventListener('click', closeLightbox);

    // Close on click outside image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}
