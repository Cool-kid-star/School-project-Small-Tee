/*
 * Gallery JavaScript for Cape Town Holocaust & Genocide Centre Website
 * The Webpage Project by Small Tee
 * Created by T.E.A fussion
 */

class ImageGallery {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }

    init() {
        this.createGalleryModal();
        this.bindEvents();
        this.initializeThumbnails();
    }

    createGalleryModal() {
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.id = 'gallery-modal';
        modal.setAttribute('data-testid', 'modal-gallery');
        
        modal.innerHTML = `
            <div class="gallery-overlay" data-testid="overlay-gallery"></div>
            <div class="gallery-container">
                <button class="gallery-close" data-testid="button-gallery-close" aria-label="Close gallery">
                    <i data-feather="x"></i>
                </button>
                
                <div class="gallery-content">
                    <button class="gallery-nav gallery-prev" data-testid="button-gallery-prev" aria-label="Previous image">
                        <i data-feather="chevron-left"></i>
                    </button>
                    
                    <div class="gallery-main">
                        <div class="gallery-image-container">
                            <img class="gallery-image" data-testid="img-gallery-main" alt="" />
                            <div class="gallery-loading" data-testid="loading-gallery">
                                <div class="spinner"></div>
                            </div>
                        </div>
                        
                        <div class="gallery-info">
                            <h3 class="gallery-title" data-testid="text-gallery-title"></h3>
                            <p class="gallery-description" data-testid="text-gallery-description"></p>
                            <div class="gallery-meta">
                                <span class="gallery-counter" data-testid="text-gallery-counter"></span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="gallery-nav gallery-next" data-testid="button-gallery-next" aria-label="Next image">
                        <i data-feather="chevron-right"></i>
                    </button>
                </div>
                
                <div class="gallery-thumbnails" data-testid="container-gallery-thumbnails">
                    <div class="thumbnail-container"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Initialize Feather icons for the modal
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    bindEvents() {
        const modal = document.getElementById('gallery-modal');
        const closeBtn = modal.querySelector('.gallery-close');
        const overlay = modal.querySelector('.gallery-overlay');
        const prevBtn = modal.querySelector('.gallery-prev');
        const nextBtn = modal.querySelector('.gallery-next');
        const image = modal.querySelector('.gallery-image');

        // Close modal events
        closeBtn.addEventListener('click', () => this.closeGallery());
        overlay.addEventListener('click', () => this.closeGallery());
        
        // Navigation events
        prevBtn.addEventListener('click', () => this.prevImage());
        nextBtn.addEventListener('click', () => this.nextImage());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeGallery();
                    break;
                case 'ArrowLeft':
                    this.prevImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        });

        // Touch events for mobile swipe
        modal.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        modal.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        // Image load events
        image.addEventListener('load', () => {
            this.hideLoading();
        });

        image.addEventListener('error', () => {
            this.hideLoading();
            this.handleImageError();
        });

        // Prevent right-click context menu on gallery images
        image.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    initializeThumbnails() {
        // Find all gallery-enabled images
        const galleryImages = document.querySelectorAll('[data-gallery="true"], .gallery-image-item, .feature-card img, .program-image img, .event-image img, .exhibition-image img');
        
        galleryImages.forEach((img, index) => {
            // Add click event to open gallery
            img.addEventListener('click', (e) => {
                e.preventDefault();
                this.openGallery(index);
            });

            // Add cursor pointer style
            img.style.cursor = 'pointer';
            
            // Add data attributes if missing
            if (!img.dataset.galleryTitle) {
                img.dataset.galleryTitle = img.alt || `Image ${index + 1}`;
            }
            
            if (!img.dataset.galleryDescription) {
                const card = img.closest('.feature-card, .program-card, .event-card, .exhibition-card');
                if (card) {
                    const description = card.querySelector('.card-description, .program-description, .event-description, .exhibition-description');
                    img.dataset.galleryDescription = description ? description.textContent.trim() : '';
                }
            }

            // Store image data
            this.images.push({
                src: img.src,
                title: img.dataset.galleryTitle || img.alt || `Image ${index + 1}`,
                description: img.dataset.galleryDescription || '',
                alt: img.alt || ''
            });
        });

        this.createThumbnails();
    }

    createThumbnails() {
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        
        this.images.forEach((imageData, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'gallery-thumbnail';
            thumbnail.setAttribute('data-testid', `thumbnail-${index}`);
            
            const img = document.createElement('img');
            img.src = imageData.src;
            img.alt = imageData.alt;
            img.loading = 'lazy';
            
            thumbnail.appendChild(img);
            thumbnail.addEventListener('click', () => this.goToImage(index));
            
            thumbnailContainer.appendChild(thumbnail);
        });
    }

    openGallery(index = 0) {
        if (this.images.length === 0) return;
        
        this.currentIndex = index;
        this.isOpen = true;
        
        const modal = document.getElementById('gallery-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.loadImage();
        this.updateNavigation();
        this.updateThumbnails();
        
        // Focus management for accessibility
        modal.querySelector('.gallery-close').focus();
        
        // Prevent background scrolling on mobile
        document.addEventListener('touchmove', this.preventScroll, { passive: false });
    }

    closeGallery() {
        this.isOpen = false;
        
        const modal = document.getElementById('gallery-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Remove touch event listener
        document.removeEventListener('touchmove', this.preventScroll);
    }

    prevImage() {
        if (this.images.length === 0) return;
        
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
        this.loadImage();
        this.updateNavigation();
        this.updateThumbnails();
    }

    nextImage() {
        if (this.images.length === 0) return;
        
        this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
        this.loadImage();
        this.updateNavigation();
        this.updateThumbnails();
    }

    goToImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.loadImage();
            this.updateNavigation();
            this.updateThumbnails();
        }
    }

    loadImage() {
        const imageData = this.images[this.currentIndex];
        if (!imageData) return;
        
        const modal = document.getElementById('gallery-modal');
        const image = modal.querySelector('.gallery-image');
        const title = modal.querySelector('.gallery-title');
        const description = modal.querySelector('.gallery-description');
        const counter = modal.querySelector('.gallery-counter');
        
        this.showLoading();
        
        // Update image
        image.src = imageData.src;
        image.alt = imageData.alt;
        
        // Update info
        title.textContent = imageData.title;
        description.textContent = imageData.description;
        counter.textContent = `${this.currentIndex + 1} of ${this.images.length}`;
        
        // Hide description if empty
        description.style.display = imageData.description ? 'block' : 'none';
    }

    updateNavigation() {
        const modal = document.getElementById('gallery-modal');
        const prevBtn = modal.querySelector('.gallery-prev');
        const nextBtn = modal.querySelector('.gallery-next');
        
        // Disable navigation if only one image
        if (this.images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }

    updateThumbnails() {
        const thumbnails = document.querySelectorAll('.gallery-thumbnail');
        
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.classList.toggle('active', index === this.currentIndex);
        });
        
        // Scroll active thumbnail into view
        const activeThumbnail = thumbnails[this.currentIndex];
        if (activeThumbnail) {
            activeThumbnail.scrollIntoView({
                block: 'nearest',
                inline: 'center',
                behavior: 'smooth'
            });
        }
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchEndX - this.touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                this.prevImage();
            } else {
                this.nextImage();
            }
        }
    }

    showLoading() {
        const modal = document.getElementById('gallery-modal');
        const loading = modal.querySelector('.gallery-loading');
        loading.style.display = 'flex';
    }

    hideLoading() {
        const modal = document.getElementById('gallery-modal');
        const loading = modal.querySelector('.gallery-loading');
        loading.style.display = 'none';
    }

    handleImageError() {
        const modal = document.getElementById('gallery-modal');
        const image = modal.querySelector('.gallery-image');
        const title = modal.querySelector('.gallery-title');
        
        image.src = 'images/placeholder.svg';
        title.textContent = 'Image not available';
    }

    preventScroll(e) {
        e.preventDefault();
    }
}

// Gallery styles (injected via JavaScript to avoid separate CSS file requirement)
function injectGalleryStyles() {
    const styles = `
        .gallery-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .gallery-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .gallery-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
        }

        .gallery-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .gallery-close {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        }

        .gallery-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .gallery-content {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 60px 20px 20px;
        }

        .gallery-nav {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10;
        }

        .gallery-nav:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        .gallery-nav:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .gallery-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 90%;
            margin: 0 20px;
        }

        .gallery-image-container {
            position: relative;
            max-width: 100%;
            max-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .gallery-image {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .gallery-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            align-items: center;
            justify-content: center;
        }

        .gallery-info {
            margin-top: 20px;
            text-align: center;
            color: white;
            max-width: 600px;
        }

        .gallery-title {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: white;
        }

        .gallery-description {
            font-size: 1rem;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 10px;
        }

        .gallery-meta {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .gallery-thumbnails {
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .thumbnail-container {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 10px 0;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .thumbnail-container::-webkit-scrollbar {
            height: 6px;
        }

        .thumbnail-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .thumbnail-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }

        .gallery-thumbnail {
            flex-shrink: 0;
            width: 80px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .gallery-thumbnail:hover {
            border-color: rgba(255, 255, 255, 0.5);
        }

        .gallery-thumbnail.active {
            border-color: #3b82f6;
        }

        .gallery-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        @media (max-width: 768px) {
            .gallery-content {
                padding: 80px 10px 10px;
            }

            .gallery-main {
                margin: 0 10px;
            }

            .gallery-nav {
                width: 40px;
                height: 40px;
            }

            .gallery-close {
                top: 10px;
                right: 10px;
                width: 35px;
                height: 35px;
            }

            .gallery-image-container {
                max-height: 60vh;
            }

            .gallery-image {
                max-height: 60vh;
            }

            .gallery-title {
                font-size: 1.2rem;
            }

            .gallery-description {
                font-size: 0.9rem;
            }

            .gallery-thumbnails {
                padding: 15px;
            }

            .gallery-thumbnail {
                width: 60px;
                height: 45px;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    injectGalleryStyles();
    new ImageGallery();
});

// Export for use in other scripts
window.CTHGC = window.CTHGC || {};
window.CTHGC.ImageGallery = ImageGallery;
