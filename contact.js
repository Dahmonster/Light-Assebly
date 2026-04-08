// Contact Page Functionality

async function submitContactForm(e) {
    e.preventDefault();

    const form = document.getElementById('contactForm');
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };

    const messageEl = document.getElementById('formMessage');

    try {
        const response = await fetch(`${API_BASE}/contact-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            messageEl.textContent = 'Message sent successfully! We will get back to you soon.';
            messageEl.className = 'success';
            form.reset();
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        } else {
            messageEl.textContent = 'Error sending message. Please try again.';
            messageEl.className = 'error';
        }
    } catch (error) {
        console.error('Error:', error);
        messageEl.textContent = 'Error sending message. Please try again.';
        messageEl.className = 'error';
    }
}

// Initialize Contact Page
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }
});
