// JavaScript para Resident Evil 9 Website

document.addEventListener('DOMContentLoaded', () => {
    // Le decimos al CSS que ya puede mostrar el cuerpo
    document.body.classList.add('dom-ready');
    document.body.classList.add('loaded');
    
    // Si entramos con un ancla (ej: index.html#galeria), forzamos el salto
    if (window.location.hash) {
        const id = window.location.hash;
        const section = document.querySelector(id);
        if (section) {
            window.scrollTo(0, section.offsetTop - 80);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Navigation scroll effect
    const nav = document.querySelector('nav');
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (nav) {
            if (scrollTop > 100) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Load and play saga videos only when visible to reduce startup cost
    const sagaVideos = document.querySelectorAll('#sagas video');

    if ('IntersectionObserver' in window) {
        const sagaVideoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (!video.dataset.loaded) {
                        video.load();
                        video.dataset.loaded = 'true';
                    }
                    video.play().catch(() => {
                        // Some mobile browsers can still block autoplay.
                    });
                } else {
                    video.pause();
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '120px 0px'
        });

        sagaVideos.forEach(video => {
            sagaVideoObserver.observe(video);
        });
    } else {
        // Fallback for older browsers without IntersectionObserver
        sagaVideos.forEach(video => {
            video.setAttribute('preload', 'metadata');
        });
    }

    // Particle effect on mouse movement
    let particleCount = 0;
    const maxParticles = 50;
    
    document.addEventListener('mousemove', function(e) {
        if (Math.random() > 0.95 && particleCount < maxParticles) {
            createParticle(e.clientX, e.clientY);
            particleCount++;
        }
    });

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = Math.random() * 6 + 2 + 'px';
        particle.style.height = particle.style.width;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
            particleCount--;
        }, 3000);
    }

    // Enhanced hover effects for cards
    const cards = document.querySelectorAll('.video-card, .bg-gray-900');
    cards.forEach(card => {
        card.classList.add('enhanced-hover');
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Video trailer restart functionality
    const mainVideo = document.getElementById('main-video');
    const mainVideoWrapper = document.getElementById('main-video-wrapper');
    const trailerBtn = document.getElementById('play-trailer-btn');
    const mainVideoSeekIndicator = document.getElementById('main-video-seek-indicator');
    const mainVideoMobileToggle = document.getElementById('main-video-mobile-toggle');
    
    if (mainVideo) {
        // Reduce download exposure where browser supports it
        mainVideo.setAttribute('controlsList', 'nodownload noremoteplayback');
        mainVideo.setAttribute('disablePictureInPicture', '');
        let seekIndicatorTimer = null;
        let lastSeekDirection = null;
        let lastSeekAt = 0;
        let seekAccumulated = 0;

        function showSeekIndicator(seconds) {
            if (!mainVideoSeekIndicator) return;

            const now = Date.now();
            const direction = seconds > 0 ? 'forward' : 'backward';
            const absSeconds = Math.trunc(Math.abs(seconds));
            if (absSeconds <= 0) return;
            const isBurst = lastSeekDirection === direction && (now - lastSeekAt) < 800;
            seekAccumulated = isBurst ? (seekAccumulated + absSeconds) : absSeconds;
            lastSeekDirection = direction;
            lastSeekAt = now;

            mainVideoSeekIndicator.classList.remove('forward', 'backward');
            mainVideoSeekIndicator.classList.add(direction);
            mainVideoSeekIndicator.textContent = direction === 'forward'
                ? `+ ${seekAccumulated} >>`
                : `<< ${seekAccumulated} -`;
            mainVideoSeekIndicator.classList.add('show');

            if (seekIndicatorTimer) {
                clearTimeout(seekIndicatorTimer);
            }

            seekIndicatorTimer = setTimeout(() => {
                mainVideoSeekIndicator.classList.remove('show');
            }, 380);
        }

        function seekMainVideo(seconds) {
            const EDGE_EPSILON = 0.05;
            const duration = Number.isFinite(mainVideo.duration) ? mainVideo.duration : 0;
            const current = mainVideo.currentTime || 0;

            // Hard-stop at boundaries to avoid exceeding timeline limits
            if (seconds < 0 && current <= EDGE_EPSILON) {
                return false;
            }
            if (seconds > 0 && duration > 0 && current >= (duration - EDGE_EPSILON)) {
                return false;
            }

            const next = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, current + seconds));
            const applied = next - current;

            // At timeline bounds, ignore extra seek to avoid infinite indicator
            if (Math.abs(applied) < 0.01) {
                return false;
            }

            mainVideo.currentTime = next;
            const appliedSign = applied > 0 ? 1 : -1;
            const appliedWholeSeconds = Math.trunc(Math.abs(applied));
            if (appliedWholeSeconds > 0) {
                showSeekIndicator(appliedWholeSeconds * appliedSign);
            }
            return true;
        }

        function canUseTrailerShortcuts(eventTarget) {
            const tag = eventTarget && eventTarget.tagName ? eventTarget.tagName.toLowerCase() : '';
            const isEditable = eventTarget && (eventTarget.isContentEditable || ['input', 'textarea', 'select'].includes(tag));
            if (isEditable) return false;
            return true;
        }

        function isVideoMostlyVisible() {
            const rect = mainVideo.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const visibleX = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
            const visibleY = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
            const visibleArea = visibleX * visibleY;
            const area = Math.max(1, rect.width * rect.height);
            return (visibleArea / area) > 0.35;
        }

        // Reiniciar video cuando termine
        mainVideo.addEventListener('ended', function() {
            // Reiniciar el video al principio
            this.currentTime = 0;
            // Mostrar el poster nuevamente
            this.load();
            // Efecto de fade en el poster
            this.classList.add('ended');
            
            // Remover clase de ended después de 2 segundos
            setTimeout(() => {
                this.classList.remove('ended');
            }, 2000);
        });
        
        // Mostrar controles solo en hover
        mainVideo.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
        
        mainVideo.addEventListener('mouseleave', function() {
            this.style.cursor = 'default';
        });

        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        // Keep native controls enabled across devices.
        mainVideo.controls = true;

        function updateMobileToggleIcon() {
            if (!mainVideoMobileToggle) return;
            const icon = mainVideoMobileToggle.querySelector('i');
            if (!icon) return;
            icon.className = mainVideo.paused ? 'fas fa-play' : 'fas fa-pause';
        }

        updateMobileToggleIcon();
        mainVideo.addEventListener('play', updateMobileToggleIcon);
        mainVideo.addEventListener('pause', updateMobileToggleIcon);

        if (mainVideoMobileToggle) {
            mainVideoMobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (mainVideo.paused) {
                    mainVideo.play().catch(() => {});
                } else {
                    mainVideo.pause();
                }
                updateMobileToggleIcon();
            });
        }

        // Ensure keyboard shortcuts target the trailer after user interaction
        mainVideo.addEventListener('pointerdown', function() {
            mainVideo.focus({ preventScroll: true });
        });

        document.addEventListener('keydown', function(e) {
            if (!canUseTrailerShortcuts(e.target)) {
                return;
            }

            const focused = document.activeElement === mainVideo;
            const hovered = typeof mainVideo.matches === 'function' && mainVideo.matches(':hover');
            const shouldControlTrailer = focused || hovered || isVideoMostlyVisible();

            if (!shouldControlTrailer) return;

            if (e.code === 'Space') {
                // When the video has focus, let the browser native media toggle handle it.
                // This prevents double toggle (pause+play) from native + custom handlers.
                if (focused) {
                    return;
                }
                e.preventDefault();
                if (mainVideo.paused) {
                    mainVideo.play().catch(() => {});
                } else {
                    mainVideo.pause();
                }
                return;
            }

            if (e.code === 'ArrowRight') {
                e.preventDefault();
                seekMainVideo(5);
                return;
            }

            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                seekMainVideo(-5);
            }
        });

        // Mobile:
        // - single tap shows controls smoothly for a short time
        // - double tap left/right seeks with visual indicator
        if (isTouchDevice) {
            let lastTapTime = 0;
            let lastTapSide = null;
            let mobileControlsTimer = null;

            function showMobileControlsTemporarily(durationMs = 1200) {
                mainVideo.classList.add('mobile-controls-visible');
                if (mobileControlsTimer) {
                    clearTimeout(mobileControlsTimer);
                }
                mobileControlsTimer = setTimeout(() => {
                    mainVideo.classList.remove('mobile-controls-visible');
                }, durationMs);
            }

            // Show briefly on play, then hide automatically
            mainVideo.addEventListener('play', function() {
                showMobileControlsTemporarily(900);
            });
            // Keep visible a bit longer when paused
            mainVideo.addEventListener('pause', function() {
                showMobileControlsTemporarily(1800);
            });

            mainVideo.addEventListener('touchend', function(e) {
                if (!e.changedTouches || e.changedTouches.length === 0) {
                    return;
                }

                const touch = e.changedTouches[0];
                const rect = mainVideo.getBoundingClientRect();
                const tapX = touch.clientX - rect.left;
                const tapY = touch.clientY - rect.top;

                // Do not intercept touches over the bottom controls/timeline zone.
                if (tapY > rect.height * 0.78) {
                    lastTapTime = 0;
                    lastTapSide = null;
                    return;
                }

                const side = tapX >= rect.width / 2 ? 'right' : 'left';
                const now = Date.now();
                const isDoubleTap = (now - lastTapTime) < 300 && side === lastTapSide;

                if (isDoubleTap) {
                    const delta = side === 'right' ? 5 : -5;
                    seekMainVideo(delta);
                    showMobileControlsTemporarily(700);
                    lastTapTime = 0;
                    lastTapSide = null;
                    return;
                }

                lastTapTime = now;
                lastTapSide = side;
                // Single tap: show controls smoothly and auto-hide.
                showMobileControlsTemporarily(1500);
            }, { passive: false });
        }
        
        // Funcionalidad del botón de trailer
        if (trailerBtn) {
            trailerBtn.addEventListener('click', function() {
                mainVideo.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                });
                setTimeout(() => {
                    mainVideo.play().catch(e => console.log('Autoplay prevented:', e));
                }, 1200); // Un poco más de tiempo para que el scroll sea suave
            });
        }
    }

    // Gallery lightbox functionality
    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentImageIndex = 0;
    
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            createLightbox(index);
        });
    });

    function createLightbox(index) {
        const lightbox = document.createElement('div');
        lightbox.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
        lightbox.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <img src="${galleryItems[index].querySelector('img').src}" 
                     alt="Gallery Image ${index + 1}" 
                     class="max-w-full max-h-full object-contain rounded-lg">
                <button class="absolute top-4 right-4 text-white text-3xl hover:text-red-500 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
                <button class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-red-500 transition-colors">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-red-500 transition-colors">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        currentImageIndex = index;
        
        // Close lightbox
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.closest('.fa-times')) {
                lightbox.remove();
            }
        });
        
        // Navigation
        const prevBtn = lightbox.querySelector('.fa-chevron-left').parentElement;
        const nextBtn = lightbox.querySelector('.fa-chevron-right').parentElement;
        
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
            updateLightboxImage(lightbox);
        });
        
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
            updateLightboxImage(lightbox);
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', function handleKeydown(e) {
            if (e.key === 'Escape') lightbox.remove();
            if (e.key === 'ArrowLeft') {
                currentImageIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
                updateLightboxImage(lightbox);
            }
            if (e.key === 'ArrowRight') {
                currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
                updateLightboxImage(lightbox);
            }
        });
    }

    function updateLightboxImage(lightbox) {
        const img = lightbox.querySelector('img');
        img.src = galleryItems[currentImageIndex].querySelector('img').src;
        img.alt = `Gallery Image ${currentImageIndex + 1}`;
    }

    // Loading animation
    window.addEventListener('load', function() {
        setTimeout(() => {
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.remove(), 500);
            }
        }, 1000);
    });

    // Parallax scrolling effect
    const parallaxElements = document.querySelectorAll('.parallax');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });

    // Form validation (if contact form is added)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add form validation logic here
            console.log('Form submitted');
        });
    });

    // Performance optimization - Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Easter egg - Konami code
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', function(e) {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateEasterEgg() {
        document.body.style.animation = 'glitch 0.3s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
            alert('¡Has encontrado el Easter Egg de Resident Evil 9! 🧟‍♂️');
        }, 2000);
    }

    // Analytics tracking (placeholder)
    function trackEvent(action, category = 'User Interaction') {
        // Add your analytics tracking code here
        console.log(`Event tracked: ${category} - ${action}`);
    }

    // Track button clicks
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent(this.textContent.trim(), 'Button Click');
        });
    });

    // Track video plays
    sagaVideos.forEach(video => {
        video.addEventListener('play', function() {
            trackEvent('Video Play', 'Media Interaction');
        });
    });

    // Accessibility improvements
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-red-600 text-white px-4 py-2 rounded';
    document.body.insertBefore(skipLink, document.body.firstChild);

    console.log('Resident Evil 9 website loaded successfully! 🎮');
});

