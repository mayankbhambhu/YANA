/**
 * PREMIUM BRAND - MAIN JAVASCRIPT FILE
 * Professional, interactive, and responsive functionality
 * Includes: Navigation, Animations, Form Validation, Sliders, and Performance Optimizations
 */

// ===================================
// GLOBAL VARIABLES AND CONFIGURATION
// ===================================

const CONFIG = {
    // Animation settings
    SCROLL_THRESHOLD: 100,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 100,
    
    // Form validation settings
    FORM_ENDPOINT: '/api/contact',
    VALIDATION_RULES: {
        firstName: { required: true, minLength: 2 },
        lastName: { required: true, minLength: 2 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { pattern: /^[\+]?[1-9][\d]{0,15}$/ },
        message: { required: true, minLength: 10 }
    },
    
    // Testimonials slider settings
    TESTIMONIAL_AUTO_PLAY: true,
    TESTIMONIAL_INTERVAL: 5000,
    
    // Performance settings
    LAZY_LOAD_OFFSET: 100,
    THROTTLE_DELAY: 16 // ~60fps
};

// Global state management
const STATE = {
    isMenuOpen: false,
    isScrolled: false,
    currentTestimonial: 0,
    testimonialInterval: null,
    isFormSubmitting: false,
    portfolioFilter: 'all',
    scrollPosition: 0,
    isLoading: true
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} offset - Offset from viewport edge
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element, offset = 0) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -offset &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Smooth scroll to element
 * @param {string|Element} target - Target element or selector
 * @param {number} offset - Offset from target
 */
function smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Add CSS class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class name to add
 */
function addClassWithAnimation(element, className) {
    element.classList.add(className);
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
        element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease, transform ${CONFIG.ANIMATION_DURATION}ms ease`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    });
}

/**
 * Show element with fade in animation
 * @param {Element} element - Element to show
 * @param {string} display - Display property value
 */
function fadeIn(element, display = 'block') {
    element.style.opacity = '0';
    element.style.display = display;
    
    requestAnimationFrame(() => {
        element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease`;
        element.style.opacity = '1';
    });
}

/**
 * Hide element with fade out animation
 * @param {Element} element - Element to hide
 */
function fadeOut(element) {
    element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease`;
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, CONFIG.ANIMATION_DURATION);
}

// ===================================
// LOADING SCREEN MANAGEMENT
// ===================================

/**
 * Initialize and manage loading screen
 */
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide loading screen when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                STATE.isLoading = false;
                
                // Initialize other components after loading
                setTimeout(() => {
                    initScrollAnimations();
                    initCounterAnimations();
                }, 100);
            }
        }, 500); // Minimum loading time for better UX
    });
    
    // Fallback: Hide loading screen after maximum time
    setTimeout(() => {
        if (loadingScreen && STATE.isLoading) {
            loadingScreen.classList.add('hidden');
            STATE.isLoading = false;
        }
    }, 3000);
}

// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    const header = document.getElementById('header');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // Scroll-based header styling
    const handleScroll = throttle(() => {
        const scrolled = window.pageYOffset > CONFIG.SCROLL_THRESHOLD;
        
        if (scrolled !== STATE.isScrolled) {
            STATE.isScrolled = scrolled;
            
            if (header) {
                header.classList.toggle('scrolled', scrolled);
            }
        }
        
        // Update active navigation link
        updateActiveNavLink();
        
        // Show/hide back to top button
        updateBackToTopButton();
        
        STATE.scrollPosition = window.pageYOffset;
    }, CONFIG.THROTTLE_DELAY);
    
    window.addEventListener('scroll', handleScroll);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (STATE.isMenuOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && STATE.isMenuOpen) {
            closeMobileMenu();
        }
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (STATE.isMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Open mobile menu
 */
function openMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    STATE.isMenuOpen = true;
    navToggle.classList.add('active');
    navMenu.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    STATE.isMenuOpen = false;
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

/**
 * Handle navigation link clicks
 * @param {Event} e - Click event
 */
function handleNavLinkClick(e) {
    e.preventDefault();
    
    const target = e.target.getAttribute('href');
    const section = e.target.getAttribute('data-section');
    
    // Close mobile menu if open
    if (STATE.isMenuOpen) {
        closeMobileMenu();
    }
    
    // Smooth scroll to section
    if (target && target.startsWith('#')) {
        const headerHeight = document.getElementById('header').offsetHeight;
        smoothScrollTo(target, headerHeight + 20);
    }
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.getElementById('header').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionHeight = section.offsetHeight;
        
        if (sectionTop <= headerHeight + 100 && sectionTop + sectionHeight > headerHeight + 100) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${currentSection}`);
    });
}

// ===================================
// SCROLL ANIMATIONS
// ===================================

/**
 * Initialize scroll-based animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    const handleScrollAnimations = throttle(() => {
        animatedElements.forEach(element => {
            if (isInViewport(element, CONFIG.LAZY_LOAD_OFFSET) && !element.classList.contains('aos-animate')) {
                const delay = element.getAttribute('data-aos-delay') || 0;
                
                setTimeout(() => {
                    element.classList.add('aos-animate');
                    addClassWithAnimation(element, 'animate-fade-in-up');
                }, delay);
            }
        });
    }, CONFIG.THROTTLE_DELAY);
    
    window.addEventListener('scroll', handleScrollAnimations);
    
    // Initial check
    handleScrollAnimations();
}

/**
 * Initialize counter animations
 */
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// ===================================
// PORTFOLIO FILTERING
// ===================================

/**
 * Initialize portfolio filtering functionality
 */
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter portfolio items
            filterPortfolioItems(filter, portfolioItems);
            
            STATE.portfolioFilter = filter;
        });
    });
}

/**
 * Filter portfolio items based on category
 * @param {string} filter - Filter category
 * @param {NodeList} items - Portfolio items
 */
function filterPortfolioItems(filter, items) {
    items.forEach((item, index) => {
        const category = item.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
            item.style.display = 'block';
            setTimeout(() => {
                addClassWithAnimation(item, 'animate-fade-in-up');
            }, index * 100);
        } else {
            fadeOut(item);
        }
    });
}

// ===================================
// TESTIMONIALS SLIDER
// ===================================

/**
 * Initialize testimonials slider
 */
function initTestimonialsSlider() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    
    if (slides.length === 0) return;
    
    // Navigation buttons
    if (prevBtn) prevBtn.addEventListener('click', () => changeTestimonial('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => changeTestimonial('next'));
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToTestimonial(index));
    });
    
    // Auto-play functionality
    if (CONFIG.TESTIMONIAL_AUTO_PLAY) {
        startTestimonialAutoPlay();
        
        // Pause on hover
        const slider = document.getElementById('testimonials-slider');
        if (slider) {
            slider.addEventListener('mouseenter', stopTestimonialAutoPlay);
            slider.addEventListener('mouseleave', startTestimonialAutoPlay);
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') changeTestimonial('prev');
        if (e.key === 'ArrowRight') changeTestimonial('next');
    });
    
    // Touch/swipe support
    initTestimonialSwipe();
}

/**
 * Change testimonial slide
 * @param {string} direction - 'next' or 'prev'
 */
function changeTestimonial(direction) {
    const slides = document.querySelectorAll('.testimonial-slide');
    const totalSlides = slides.length;
    
    if (direction === 'next') {
        STATE.currentTestimonial = (STATE.currentTestimonial + 1) % totalSlides;
    } else {
        STATE.currentTestimonial = (STATE.currentTestimonial - 1 + totalSlides) % totalSlides;
    }
    
    updateTestimonialSlide();
}

/**
 * Go to specific testimonial
 * @param {number} index - Slide index
 */
function goToTestimonial(index) {
    STATE.currentTestimonial = index;
    updateTestimonialSlide();
}

/**
 * Update testimonial slide display
 */
function updateTestimonialSlide() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === STATE.currentTestimonial);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === STATE.currentTestimonial);
    });
}

/**
 * Start testimonial auto-play
 */
function startTestimonialAutoPlay() {
    stopTestimonialAutoPlay();
    STATE.testimonialInterval = setInterval(() => {
        changeTestimonial('next');
    }, CONFIG.TESTIMONIAL_INTERVAL);
}

/**
 * Stop testimonial auto-play
 */
function stopTestimonialAutoPlay() {
    if (STATE.testimonialInterval) {
        clearInterval(STATE.testimonialInterval);
        STATE.testimonialInterval = null;
    }
}

/**
 * Initialize testimonial swipe functionality
 */
function initTestimonialSwipe() {
    const slider = document.getElementById('testimonials-slider');
    if (!slider) return;
    
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    slider.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Check if horizontal swipe is more significant than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                changeTestimonial('prev');
            } else {
                changeTestimonial('next');
            }
        }
    });
}

// ===================================
// FORM VALIDATION AND SUBMISSION
// ===================================

/**
 * Initialize contact form functionality
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    const submitButton = document.getElementById('form-submit');
    
    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', debounce(() => clearFieldError(input), 300));
    });
    
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Custom checkbox styling
    initCustomCheckbox();
}

/**
 * Validate individual form field
 * @param {Element} field - Form field to validate
 * @returns {boolean} Validation result
 */
function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const rules = CONFIG.VALIDATION_RULES[fieldName];
    
    if (!rules) return true;
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (rules.required && !value) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)} is required.`;
    }
    
    // Minimum length validation
    if (isValid && rules.minLength && value.length < rules.minLength) {
        isValid = false;
        errorMessage = `${getFieldLabel(field)} must be at least ${rules.minLength} characters.`;
    }
    
    // Pattern validation (email, phone, etc.)
    if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
        isValid = false;
        errorMessage = `Please enter a valid ${getFieldLabel(field).toLowerCase()}.`;
    }
    
    // Special validation for privacy checkbox
    if (fieldName === 'privacy' && !field.checked) {
        isValid = false;
        errorMessage = 'You must agree to the privacy policy.';
    }
    
    // Display validation result
    if (isValid) {
        clearFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

/**
 * Get field label for error messages
 * @param {Element} field - Form field
 * @returns {string} Field label
 */
function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name;
}

/**
 * Show field validation error
 * @param {Element} field - Form field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    field.classList.add('error');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

/**
 * Clear field validation error
 * @param {Element} field - Form field
 */
function clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    field.classList.remove('error');
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (STATE.isFormSubmitting) return;
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = document.getElementById('form-submit');
    
    // Validate all fields
    const inputs = form.querySelectorAll('input, textarea, select');
    let isFormValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showFormMessage('Please correct the errors above.', 'error');
        return;
    }
    
    // Show loading state
    STATE.isFormSubmitting = true;
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
        // Convert FormData to JSON
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Submit form data
        const response = await fetch(CONFIG.FORM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showFormMessage('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');
            form.reset();
            
            // Clear all field errors
            inputs.forEach(input => clearFieldError(input));
        } else {
            throw new Error('Form submission failed');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showFormMessage('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
    } finally {
        // Reset loading state
        STATE.isFormSubmitting = false;
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

/**
 * Show form submission message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showFormMessage(message, type) {
    const successElement = document.getElementById('form-success');
    const errorElement = document.getElementById('form-error');
    
    // Hide both messages first
    if (successElement) successElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
    
    // Show appropriate message
    if (type === 'success' && successElement) {
        successElement.querySelector('p').textContent = message;
        fadeIn(successElement);
    } else if (type === 'error' && errorElement) {
        errorElement.querySelector('p').textContent = message;
        fadeIn(errorElement);
    }
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        if (type === 'success' && successElement) {
            fadeOut(successElement);
        } else if (type === 'error' && errorElement) {
            fadeOut(errorElement);
        }
    }, 5000);
}

/**
 * Initialize custom checkbox styling
 */
function initCustomCheckbox() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const customCheckbox = checkbox.nextElementSibling;
            if (customCheckbox && customCheckbox.classList.contains('checkbox-custom')) {
                customCheckbox.classList.toggle('checked', checkbox.checked);
            }
        });
    });
}

// ===================================
// BACK TO TOP FUNCTIONALITY
// ===================================

/**
 * Initialize back to top button
 */
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            smoothScrollTo('body', 0);
        });
    }
}

/**
 * Update back to top button visibility
 */
function updateBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');
    const showButton = window.pageYOffset > CONFIG.SCROLL_THRESHOLD * 3;
    
    if (backToTopButton) {
        backToTopButton.classList.toggle('show', showButton);
    }
}

// ===================================
// HERO SECTION ENHANCEMENTS
// ===================================

/**
 * Initialize hero section functionality
 */
function initHeroSection() {
    const heroVideo = document.querySelector('.hero-video-element');
    const heroCTAPrimary = document.getElementById('hero-cta-primary');
    const heroCTASecondary = document.getElementById('hero-cta-secondary');
    
    // Optimize video loading
    if (heroVideo) {
        heroVideo.addEventListener('loadeddata', () => {
            heroVideo.style.opacity = '1';
        });
        
        // Pause video when not in viewport (performance optimization)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.play();
                } else {
                    heroVideo.pause();
                }
            });
        });
        
        observer.observe(heroVideo);
    }
    
    // Hero CTA button actions
    if (heroCTAPrimary) {
        heroCTAPrimary.addEventListener('click', () => {
            smoothScrollTo('#contact', 80);
        });
    }
    
    if (heroCTASecondary) {
        heroCTASecondary.addEventListener('click', () => {
            smoothScrollTo('#portfolio', 80);
        });
    }
}

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================

/**
 * Initialize performance optimizations
 */
function initPerformanceOptimizations() {
    // Lazy load images
    initLazyLoading();
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Optimize animations for reduced motion preference
    respectReducedMotion();
    
    // Initialize service worker for PWA functionality
    initServiceWorker();
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical resources
 */
function preloadCriticalResources() {
    const criticalImages = [
        'hero-background.jpg',
        'logo.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

/**
 * Respect user's reduced motion preference
 */
function respectReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable auto-play for testimonials
        CONFIG.TESTIMONIAL_AUTO_PLAY = false;
        
        // Reduce animation durations
        CONFIG.ANIMATION_DURATION = 150;
        
        // Add reduced motion class to body
        document.body.classList.add('reduced-motion');
    }
}

/**
 * Initialize service worker for PWA functionality
 */
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

/**
 * Initialize accessibility enhancements
 */
function initAccessibility() {
    // Focus management
    initFocusManagement();
    
    // Keyboard navigation
    initKeyboardNavigation();
    
    // ARIA live regions
    initAriaLiveRegions();
    
    // Skip links
    initSkipLinks();
}

/**
 * Initialize focus management
 */
function initFocusManagement() {
    // Trap focus in mobile menu when open
    const navMenu = document.getElementById('nav-menu');
    const focusableElements = navMenu.querySelectorAll('a, button, input, textarea, select');
    
    document.addEventListener('keydown', (e) => {
        if (STATE.isMenuOpen && e.key === 'Tab') {
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

/**
 * Initialize keyboard navigation
 */
function initKeyboardNavigation() {
    // Portfolio filter keyboard navigation
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach((button, index) => {
        button.addEventListener('keydown', (e) => {
            let targetIndex = index;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    targetIndex = index > 0 ? index - 1 : filterButtons.length - 1;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    targetIndex = index < filterButtons.length - 1 ? index + 1 : 0;
                    break;
                case 'Home':
                    e.preventDefault();
                    targetIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    targetIndex = filterButtons.length - 1;
                    break;
            }
            
            if (targetIndex !== index) {
                filterButtons[targetIndex].focus();
            }
        });
    });
}

/**
 * Initialize ARIA live regions
 */
function initAriaLiveRegions() {
    // Create live region for dynamic content announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

/**
 * Initialize skip links
 */
function initSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-link');
    
    skipLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });
    });
}

// ===================================
// ERROR HANDLING AND LOGGING
// ===================================

/**
 * Initialize error handling
 */
function initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        // In production, you might want to send errors to a logging service
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
    });
}

// ===================================
// MAIN INITIALIZATION
// ===================================

/**
 * Initialize all functionality when DOM is ready
 */
function init() {
    // Core functionality
    initLoadingScreen();
    initNavigation();
    initHeroSection();
    initPortfolioFilter();
    initTestimonialsSlider();
    initContactForm();
    initBackToTop();
    
    // Enhancements
    initPerformanceOptimizations();
    initAccessibility();
    initErrorHandling();
    
    console.log('Premium Brand website initialized successfully!');
}

// ===================================
// EVENT LISTENERS AND STARTUP
// ===================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle page visibility changes (for performance optimization)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations and auto-play when page is hidden
        stopTestimonialAutoPlay();
    } else {
        // Resume when page becomes visible
        if (CONFIG.TESTIMONIAL_AUTO_PLAY) {
            startTestimonialAutoPlay();
        }
    }
});

// Handle window resize (debounced)
window.addEventListener('resize', debounce(() => {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768 && STATE.isMenuOpen) {
        closeMobileMenu();
    }
    
    // Recalculate scroll positions
    updateActiveNavLink();
}, CONFIG.DEBOUNCE_DELAY));

// Export functions for external use (if needed)
window.PremiumBrand = {
    smoothScrollTo,
    announceToScreenReader,
    showFormMessage,
    CONFIG,
    STATE
};