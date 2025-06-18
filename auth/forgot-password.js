document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const errorElement = document.getElementById('forgot-error');
    const successElement = document.getElementById('forgot-success');
    const submitBtn = document.querySelector('.auth-button');
    const originalBtnText = submitBtn.innerText;

    // Clear previous messages
    errorElement.innerText = '';
    successElement.innerText = '';
    
    // Show loading state
    submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
    submitBtn.disabled = true;

    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            // Success message
            successElement.innerText = "Password reset email sent! Please check your inbox.";
            errorElement.innerText = '';
            
            // Reset button
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        })
        .catch(error => {
            // Handle specific errors
            let errorMessage = "Failed to send reset email. Please try again.";
            
            if (error.code === "auth/user-not-found") {
                errorMessage = "No account found with this email. Please sign up.";
            } 
            else if (error.code === "auth/invalid-email") {
                errorMessage = "Invalid email format. Please check your email address.";
            }
            else if (error.code === "auth/too-many-requests") {
                errorMessage = "Too many attempts. Please try again later.";
            }

            // Show error
            errorElement.innerText = errorMessage;
            successElement.innerText = '';
            
            // Reset button
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
});