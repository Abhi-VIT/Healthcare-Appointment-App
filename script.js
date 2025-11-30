/* ========================================
   HEALTHCARE APPOINTMENT APP - JAVASCRIPT
   Interactive booking flow, validation, and accessibility
   ======================================== */

// ========================================
// STATE MANAGEMENT
// ========================================
const bookingState = {
    service: null,
    date: null,
    time: null,
    doctor: null,
    consultationType: 'clinic',
    prescription: null,
    currentStep: 1,
    prices: {
        'general-checkup': 50,
        'dental': 75,
        'eye-exam': 60,
        'vaccination': 40
    },
    doctors: {
        'dr-smith': 'Dr. Sarah Smith',
        'dr-johnson': 'Dr. Michael Johnson',
        'dr-williams': 'Dr. Emily Williams'
    }
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeNavigation();
    setMinDateToToday();
    announcePageReady();
});

// ========================================
// EVENT LISTENERS
// ========================================
function initializeEventListeners() {
    // Hero CTA
    document.getElementById('hero-cta').addEventListener('click', scrollToBooking);

    // Service selection
    document.querySelectorAll('input[name="service"]').forEach(input => {
        input.addEventListener('change', handleServiceChange);
    });

    // Date buttons
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', handleDateButton);
    });

    // Date input
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        dateInput.addEventListener('change', handleDateInput);
    }

    // Time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', handleTimeSlot);
    });

    // Doctor selection
    document.querySelectorAll('input[name="doctor"]').forEach(input => {
        input.addEventListener('change', handleDoctorChange);
    });

    // Step navigation
    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', goToNextStep);
    });

    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', goToPreviousStep);
    });

    // Confirm booking
    document.getElementById('confirm-booking').addEventListener('click', submitBooking);

    // New booking after success
    document.getElementById('new-booking').addEventListener('click', resetBooking);

    // Form validation
    document.getElementById('patient-form').addEventListener('change', validateForm);

    // Consultation Type Toggle
    document.querySelectorAll('input[name="consultation-type"]').forEach(input => {
        input.addEventListener('change', handleConsultationTypeChange);
    });

    // File Upload
    const fileInput = document.getElementById('prescription');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        });
    });
}

// ========================================
// BOOKING FLOW HANDLERS
// ========================================
function handleServiceChange(e) {
    bookingState.service = e.target.value;
    updateNextButtonState();
    announceSelection('Service selected: ' + e.target.parentElement.querySelector('.service-name').textContent);
}

function handleDateButton(e) {
    e.preventDefault();
    const days = parseInt(e.target.getAttribute('data-days'));
    const date = new Date();
    date.setDate(date.getDate() + days);

    const dateString = date.toISOString().split('T')[0];
    document.getElementById('appointment-date').value = dateString;
    bookingState.date = dateString;

    // Update button states
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    updateNextButtonState();
    announceSelection('Date selected: ' + formatDate(new Date(dateString)));
}

function handleDateInput(e) {
    bookingState.date = e.target.value;
    // Clear active button state when manually selecting
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    updateNextButtonState();
}

function handleTimeSlot(e) {
    e.preventDefault();
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('active');
    });
    e.target.classList.add('active');
    bookingState.time = e.target.getAttribute('data-time');
    updateNextButtonState();
    announceSelection('Time selected: ' + e.target.textContent);
}

function handleDoctorChange(e) {
    bookingState.doctor = e.target.value;
    const doctorName = e.target.parentElement.querySelector('.doctor-name').textContent;
    updateNextButtonState();
    announceSelection('Doctor selected: ' + doctorName);
}

function handleConsultationTypeChange(e) {
    bookingState.consultationType = e.target.value;
    announceSelection('Consultation type set to: ' + (e.target.value === 'clinic' ? 'In-Clinic' : 'Video Call'));
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    const fileNameDisplay = document.getElementById('file-name');

    if (file) {
        bookingState.prescription = file.name;
        fileNameDisplay.textContent = file.name;
        announceSelection('File selected: ' + file.name);
    } else {
        bookingState.prescription = null;
        fileNameDisplay.textContent = 'No file chosen';
    }
}

// ========================================
// STEP NAVIGATION
// ========================================
function goToNextStep() {
    if (validateCurrentStep()) {
        bookingState.currentStep++;
        updateProgressIndicator();
        showStep(bookingState.currentStep);
        scrollToBooking();
    }
}

function goToPreviousStep() {
    if (bookingState.currentStep > 1) {
        bookingState.currentStep--;
        updateProgressIndicator();
        showStep(bookingState.currentStep);
        scrollToBooking();
    }
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStep = document.getElementById('step-' + stepNumber);
    if (currentStep) {
        currentStep.classList.add('active');
        // Focus on the step title for screen readers
        const title = currentStep.querySelector('.step-title');
        if (title) {
            title.focus();
        }
    }

    // Update back button state
    const backButtons = document.querySelectorAll('.prev-step');
    backButtons.forEach(btn => {
        btn.disabled = stepNumber === 1;
    });

    // Update summary on last step
    if (stepNumber === 4) {
        updateBookingSummary();
    }

    // Announce step change
    announceSelection('Step ' + stepNumber + ' of 4: ' + (currentStep?.querySelector('.step-title')?.textContent || ''));
}

function updateProgressIndicator() {
    const steps = document.querySelectorAll('.progress-step');
    const progressBar = document.querySelector('.progress-indicator');

    steps.forEach((step, index) => {
        if (index < bookingState.currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update progress bar width
    const progress = (bookingState.currentStep / 4) * 100;
    progressBar.style.setProperty('--progress-width', progress + '%');
    progressBar.setAttribute('aria-valuenow', bookingState.currentStep);
}

// ========================================
// VALIDATION
// ========================================
function validateCurrentStep() {
    switch (bookingState.currentStep) {
        case 1:
            if (!bookingState.service) {
                announceError('Please select a service');
                return false;
            }
            return true;
        case 2:
            if (!bookingState.date || !bookingState.time) {
                announceError('Please select both date and time');
                return false;
            }
            return true;
        case 3:
            if (!bookingState.doctor) {
                announceError('Please select a doctor');
                return false;
            }
            return true;
        case 4:
            return validatePatientForm();
        default:
            return true;
    }
}

function validatePatientForm() {
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const terms = document.getElementById('terms').checked;

    let isValid = true;
    const errors = {};

    // Name validation
    if (!fullName) {
        errors['full-name'] = 'Full name is required';
        isValid = false;
    } else if (fullName.length < 2) {
        errors['full-name'] = 'Name must be at least 2 characters';
        isValid = false;
    }

    // Email validation
    if (!email) {
        errors['email'] = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        errors['email'] = 'Please enter a valid email address';
        isValid = false;
    }

    // Phone validation
    if (!phone) {
        errors['phone'] = 'Phone number is required';
        isValid = false;
    } else if (!isValidPhone(phone)) {
        errors['phone'] = 'Please enter a valid phone number';
        isValid = false;
    }

    // Terms validation
    if (!terms) {
        errors['terms'] = 'You must agree to the terms and conditions';
        isValid = false;
    }

    // Display errors
    displayErrors(errors);

    if (!isValid) {
        announceError('Please correct the errors before proceeding');
    }

    return isValid;
}

function validateForm() {
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Real-time validation without blocking
    if (fullName && fullName.length < 2) {
        markFieldError('full-name', 'Name must be at least 2 characters');
    } else {
        clearFieldError('full-name');
    }

    if (email && !isValidEmail(email)) {
        markFieldError('email', 'Please enter a valid email address');
    } else {
        clearFieldError('email');
    }

    if (phone && !isValidPhone(phone)) {
        markFieldError('phone', 'Please enter a valid phone number');
    } else {
        clearFieldError('phone');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function displayErrors(errors) {
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.textContent = '';
    });

    Object.keys(errors).forEach(fieldId => {
        const errorElement = document.getElementById('error-' + fieldId);
        if (errorElement) {
            errorElement.textContent = errors[fieldId];
        }
        const inputElement = document.getElementById(fieldId);
        if (inputElement) {
            inputElement.classList.add('error');
        }
    });
}

function markFieldError(fieldId, message) {
    const errorElement = document.getElementById('error-' + fieldId);
    if (errorElement) {
        errorElement.textContent = message;
    }
    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById('error-' + fieldId);
    if (errorElement) {
        errorElement.textContent = '';
    }
    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

function updateNextButtonState() {
    const nextButtons = document.querySelectorAll('.next-step');
    let shouldEnable = false;

    switch (bookingState.currentStep) {
        case 1:
            shouldEnable = !!bookingState.service;
            break;
        case 2:
            shouldEnable = !!bookingState.date && !!bookingState.time;
            break;
        case 3:
            shouldEnable = !!bookingState.doctor;
            break;
    }

    nextButtons.forEach(btn => {
        btn.disabled = !shouldEnable;
    });
}

// ========================================
// BOOKING SUMMARY
// ========================================
function updateBookingSummary() {
    // Service
    const serviceLabel = document.querySelector(`input[name="service"][value="${bookingState.service}"]`)?.parentElement?.querySelector('.service-name')?.textContent || '-';
    document.getElementById('summary-service').textContent = serviceLabel;

    // Type
    const typeLabel = bookingState.consultationType === 'clinic' ? 'In-Clinic' : 'Video Call';
    document.getElementById('summary-type').textContent = typeLabel;

    // Date
    const dateFormatted = bookingState.date ? formatDate(new Date(bookingState.date)) : '-';
    document.getElementById('summary-date').textContent = dateFormatted;

    // Time
    const timeFormatted = bookingState.time ? formatTime(bookingState.time) : '-';
    document.getElementById('summary-time').textContent = timeFormatted;

    // Doctor
    const doctorName = bookingState.doctors[bookingState.doctor] || '-';
    document.getElementById('summary-doctor').textContent = doctorName;

    // Price
    const price = bookingState.prices[bookingState.service] || 0;
    document.getElementById('summary-price').textContent = '$' + price;
}

// ========================================
// FORM SUBMISSION
// ========================================
function submitBooking() {
    if (!validatePatientForm()) {
        return;
    }

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Create booking object
    const booking = {
        service: bookingState.service,
        date: bookingState.date,
        time: bookingState.time,
        doctor: bookingState.doctor,
        fullName,
        email,
        phone,
        notes,
        consultationType: bookingState.consultationType,
        prescription: bookingState.prescription,
        price: bookingState.prices[bookingState.service]
    };

    // Save to localStorage (in real app, would send to server)
    saveBooking(booking);

    // Show success message
    showSuccessMessage(booking);

    // Announce success
    announceSelection('Appointment confirmed successfully');
}

function saveBooking(booking) {
    const bookings = JSON.parse(localStorage.getItem('appointments') || '[]');
    bookings.push({
        ...booking,
        confirmedAt: new Date().toISOString()
    });
    localStorage.setItem('appointments', JSON.stringify(bookings));

    // Log to console for demonstration
    console.log('Booking saved:', booking);
}

function showSuccessMessage(booking) {
    // Hide current step and show success
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-success').classList.add('active');

    // Update confirmation details
    const serviceLabel = document.querySelector(`input[name="service"][value="${booking.service}"]`)?.parentElement?.querySelector('.service-name')?.textContent;
    const typeLabel = booking.consultationType === 'clinic' ? 'In-Clinic' : 'Video Call';
    const confirmation = `Your ${typeLabel} appointment is confirmed for ${formatDate(new Date(booking.date))} at ${formatTime(booking.time)} with ${bookingState.doctors[booking.doctor]}. A confirmation email has been sent to ${booking.email}`;
    document.getElementById('confirmation-summary').textContent = confirmation;

    // Scroll to success
    scrollToBooking();
}

function resetBooking() {
    // Reset state
    bookingState.service = null;
    bookingState.date = null;
    bookingState.time = null;
    bookingState.doctor = null;
    bookingState.consultationType = 'clinic';
    bookingState.prescription = null;
    bookingState.currentStep = 1;

    // Reset form
    document.getElementById('patient-form').reset();
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
    });
    document.querySelectorAll('.time-slot, .date-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.textContent = '';
    });

    // Show first step
    updateProgressIndicator();
    showStep(1);
    scrollToBooking();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function setMinDateToToday() {
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

function scrollToBooking() {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ========================================
// ACCESSIBILITY HELPERS
// ========================================
function announceSelection(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

function announceError(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'alert');
    announcement.className = 'sr-only';
    announcement.textContent = 'Error: ' + message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 3000);
}

function announcePageReady() {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Healthcare Appointment App loaded. Click start booking now to begin.';
    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 2000);
}

// ========================================
// KEYBOARD ACCESSIBILITY
// ========================================
document.addEventListener('keydown', (e) => {
    // Enter key on buttons
    if (e.key === 'Enter' && e.target.classList.contains('service-card')) {
        e.target.querySelector('input').checked = true;
        handleServiceChange({ target: e.target.querySelector('input') });
    }

    // Escape key to close mobile menu
    if (e.key === 'Escape') {
        const navToggle = document.querySelector('.nav-toggle');
        if (navToggle && navToggle.getAttribute('aria-expanded') === 'true') {
            navToggle.setAttribute('aria-expanded', 'false');
            document.getElementById('nav-menu').classList.remove('active');
        }
    }
});

// ========================================
// SCREEN READER ONLY STYLES
// ========================================
const style = document.createElement('style');
style.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
`;
document.head.appendChild(style);
