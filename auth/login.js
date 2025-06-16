// Handle email/password login
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "../dashboard.html"; // redirect on success
        })
        .catch((error) => {
            document.getElementById("login-error").innerText = error.message;
        });
});

// Handle Google sign-in
document
    .getElementById("google-signin-btn")
    .addEventListener("click", function() {
        const provider = new firebase.auth.GoogleAuthProvider();

        firebase
            .auth()
            .signInWithPopup(provider)
            .then(() => {
                window.location.href = "../dashboard.html"; // redirect on success
            })
            .catch((error) => {
                document.getElementById("login-error").innerText = error.message;
            });
    });