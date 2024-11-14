// Smooth scroll to sections
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Form validation
document.querySelector('.contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.querySelector('input[placeholder="Your Name"]').value;
    const email = document.querySelector('input[placeholder="Your Email"]').value;
    const message = document.querySelector('textarea').value;

    if (!name || !email || !message) {
        alert("Please fill in all fields.");
    } else {
        alert("Message sent successfully!");
    }
});
