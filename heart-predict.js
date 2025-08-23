// Query Response Handler with Gemini API
const handleQuery = async (query) => {
    const responseDiv = document.getElementById('query-response');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing your query...';

    try {
        // Replace with your actual Gemini API endpoint and key
        const API_KEY = 'AIzaSyDar5vdr3m9dAp_CEvvV2-WFMLwwGlaUkk';
        const response = await fetch(`https://your-gemini-endpoint?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        responseDiv.innerHTML = data.response;
    } catch (error) {
        responseDiv.innerHTML = 'I apologize, but I am unable to process your query at the moment. Please try again later.';
    }

    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 200);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Setup animations for elements
function setupAnimations() {
    const elements = document.querySelectorAll('.predict-box-container, .advice');
    elements.forEach(el => {
        observer.observe(el);
    });
}

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            sidebar.classList.remove('active');
        }
    });
});

// Query button click handler
const queryBtn = document.getElementById('query-btn');
const queryInput = document.getElementById('query-input');

queryBtn.addEventListener('click', () => {
    const query = queryInput.value.trim();
    if (query) {
        handleQuery(query);
        queryBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            queryBtn.style.transform = 'scale(1)';
        }, 200);
    }
});

// Enter key handler for query input
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        queryBtn.click();
    }
});

// Submit button animation
const submitBtn = document.querySelector('.predict-btn-container button');
if (submitBtn) {
    submitBtn.addEventListener('click', function() {
        this.style.opacity = '0.7';
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        setTimeout(() => {
            this.style.opacity = '1';
            this.innerHTML = 'Submit';
        }, 2000);
    });
}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', setupAnimations);

// Handle resize events
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupAnimations, 250);
});