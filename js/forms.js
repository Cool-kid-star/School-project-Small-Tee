/*
 * Forms JavaScript for Cape Town Holocaust & Genocide Centre Website
 * The Webpage Project by Small Tee
 * Created by T.E.A fussion
 */

class FormValidator {
    constructor() {
        this.forms = new Map();
        this.init();
    }

    init() {
        this.initializeForms();
        this.bindGlobalEvents();
    }

    initializeForms() {
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            this.registerForm('contact', contactForm, {
                name: {
                    required: true,
                    minLength: 2,
                    pattern: /^[a-zA-Z\s'-]+$/,
                    message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)'
                },
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                },
                phone: {
                    required: false,
                    pattern: /^[\+]?[\d\s\-\(\)]+$/,
                    message: 'Please enter a valid phone number'
                },
                subject: {
                    required: true,
                    message: 'Please select a subject'
                },
                message: {
                    required: true,
                    minLength: 10,
                    maxLength: 1000,
                    message: 'Message must be between 10 and 1000 characters'
                }
            });
        }

        // Newsletter forms
        const newsletterForms = document.querySelectorAll('[id*="newsletter-form"]');
        newsletterForms.forEach(form => {
            this.registerForm('newsletter', form, {
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                }
            });
        });
    }

    registerForm(type, formElement, validationRules) {
        const formData = {
            element: formElement,
            type: type,
            rules: validationRules,
            isSubmitting: false
        };

        this.forms.set(formElement.id, formData);
        this.bindFormEvents(formElement, formData);
    }

    bindFormEvents(form, formData) {
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(form, formData);
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', () => {
                this.validateField(input, formData.rules);
            });

            // Clear errors on input
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });

            // Special handling for email fields
            if (input.type === 'email') {
                input.addEventListener('input', this.debounce(() => {
                    this.validateField(input, formData.rules);
                }, 500));
            }
        });
    }

    bindGlobalEvents() {
        // Prevent multiple form submissions
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.form) {
                const formData = this.forms.get(e.target.form.id);
                if (formData && formData.isSubmitting) {
                    e.preventDefault();
                }
            }
        });
    }

    async handleFormSubmit(form, formData) {
        if (formData.isSubmitting) return;

        // Validate all fields
        const isValid = this.validateForm(form, formData.rules);
        if (!isValid) {
            this.showFormMessage(form, 'Please correct the errors above.', 'error');
            return;
        }

        formData.isSubmitting = true;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        // Show loading state
        this.showLoadingState(submitButton);
        this.clearFormMessage(form);

        try {
            // Simulate form submission (in real implementation, this would be an API call)
            await this.submitForm(form, formData.type);
            
            // Success handling
            this.handleFormSuccess(form, formData.type);
            
        } catch (error) {
            // Error handling
            this.handleFormError(form, error.message);
            
        } finally {
            // Reset loading state
            formData.isSubmitting = false;
            this.hideLoadingState(submitButton, originalButtonText);
        }
    }

    async submitForm(form, type) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Simulate random success/failure for demo purposes
        // In real implementation, this would be actual API calls
        if (Math.random() > 0.1) { // 90% success rate for demo
            return { success: true, data };
        } else {
            throw new Error('Service temporarily unavailable. Please try again later.');
        }
    }

    handleFormSuccess(form, type) {
        let successMessage = '';
        
        switch (type) {
            case 'contact':
                successMessage = 'Thank you for your message! We will get back to you within 24 hours.';
                break;
            case 'newsletter':
                successMessage = 'Successfully subscribed to our newsletter!';
                break;
            default:
                successMessage = 'Form submitted successfully!';
        }

        this.showFormMessage(form, successMessage, 'success');
        
        // Reset form after success
        setTimeout(() => {
            form.reset();
            this.clearAllErrors(form);
        }, 1000);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            this.clearFormMessage(form);
        }, 5000);
    }

    handleFormError(form, errorMessage) {
        this.showFormMessage(form, errorMessage, 'error');
        
        // Auto-hide error message after 10 seconds
        setTimeout(() => {
            this.clearFormMessage(form);
        }, 10000);
    }

    validateForm(form, rules) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateField(input, rules)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(input, rules) {
        const fieldName = input.name;
        const fieldRule = rules[fieldName];
        
        if (!fieldRule) return true;

        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (fieldRule.required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(input)} is required`;
        }
        // Pattern validation
        else if (value && fieldRule.pattern && !fieldRule.pattern.test(value)) {
            isValid = false;
            errorMessage = fieldRule.message || `Invalid ${this.getFieldLabel(input)}`;
        }
        // Length validation
        else if (value) {
            if (fieldRule.minLength && value.length < fieldRule.minLength) {
                isValid = false;
                errorMessage = `${this.getFieldLabel(input)} must be at least ${fieldRule.minLength} characters`;
            } else if (fieldRule.maxLength && value.length > fieldRule.maxLength) {
                isValid = false;
                errorMessage = `${this.getFieldLabel(input)} must not exceed ${fieldRule.maxLength} characters`;
            }
        }

        // Show/hide error
        if (isValid) {
            this.clearFieldError(input);
        } else {
            this.showFieldError(input, errorMessage);
        }

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        // Add red border
        input.style.borderColor = '#ef4444';
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Reset border color
        input.style.borderColor = '';
    }

    clearAllErrors(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.clearFieldError(input));
    }

    showFormMessage(form, message, type) {
        const messageElement = form.querySelector('.form-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `form-message ${type}`;
            messageElement.style.display = 'block';
            
            // Scroll to message
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    clearFormMessage(form) {
        const messageElement = form.querySelector('.form-message');
        if (messageElement) {
            messageElement.style.display = 'none';
        }
    }

    showLoadingState(button) {
        button.disabled = true;
        button.innerHTML = '<div class="spinner"></div> Submitting...';
        button.classList.add('loading');
    }

    hideLoadingState(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('loading');
    }

    getFieldLabel(input) {
        const label = input.parentElement.querySelector('label');
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        return input.name.charAt(0).toUpperCase() + input.name.slice(1);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Additional form utilities
class FormUtils {
    static formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('27')) {
            // South African number
            value = value.replace(/^27/, '+27 ');
            if (value.length > 7) {
                value = value.replace(/(\+27\s\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
            }
        } else if (value.length === 10) {
            // Local format
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        
        input.value = value;
    }

    static restrictToNumbers(input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+\-\s\(\)]/g, '');
        });
    }

    static restrictToLetters(input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-Z\s'-]/g, '');
        });
    }

    static autoResize(textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    static addCharacterCounter(input, maxLength) {
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.style.fontSize = '0.875rem';
        counter.style.color = '#6b7280';
        counter.style.textAlign = 'right';
        counter.style.marginTop = '0.25rem';
        
        input.parentElement.appendChild(counter);
        
        const updateCounter = () => {
            const remaining = maxLength - input.value.length;
            counter.textContent = `${remaining} characters remaining`;
            
            if (remaining < 20) {
                counter.style.color = '#ef4444';
            } else if (remaining < 50) {
                counter.style.color = '#f59e0b';
            } else {
                counter.style.color = '#6b7280';
            }
        };
        
        input.addEventListener('input', updateCounter);
        updateCounter();
    }
}

// Initialize forms when DOM is loaded
function initializeForms() {
    const validator = new FormValidator();
    
    // Apply utilities to specific fields
    const phoneInputs = document.querySelectorAll('input[type="tel"], input[name="phone"]');
    phoneInputs.forEach(input => {
        FormUtils.restrictToNumbers(input);
        input.addEventListener('blur', () => FormUtils.formatPhoneNumber(input));
    });

    const nameInputs = document.querySelectorAll('input[name="name"]');
    nameInputs.forEach(input => {
        FormUtils.restrictToLetters(input);
    });

    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        FormUtils.autoResize(textarea);
        
        const maxLength = textarea.getAttribute('maxlength');
        if (maxLength) {
            FormUtils.addCharacterCounter(textarea, parseInt(maxLength));
        }
    });

    // Set default maxlength for message textarea if not set
    const messageTextarea = document.getElementById('contact-message');
    if (messageTextarea && !messageTextarea.hasAttribute('maxlength')) {
        messageTextarea.setAttribute('maxlength', '1000');
        FormUtils.addCharacterCounter(messageTextarea, 1000);
    }

    return validator;
}

// Export for use in other scripts
window.CTHGC = window.CTHGC || {};
window.CTHGC.FormValidator = FormValidator;
window.CTHGC.FormUtils = FormUtils;
window.CTHGC.initializeForms = initializeForms;
