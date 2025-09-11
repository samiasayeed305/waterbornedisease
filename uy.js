// Initialize Lucide icons
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // Form submission handling
        document.getElementById('ashaRegistrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(e.target);
            const formObject = Object.fromEntries(formData.entries());
            
            // For demo purposes - log to console
            console.log('Form submitted:', formObject);
            
            // Show success message (in a real application, you'd send to server)
            alert('Registration successful! In a real application, this data would be saved.');
            
            // Reset form
            e.target.reset();
        });