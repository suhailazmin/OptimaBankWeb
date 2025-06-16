document.getElementById("signupForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;
    const errorDiv = document.getElementById("signup-error");
    if (password !== confirm) {
        errorDiv.innerText = "Passwords do not match.";
        return;
    }
    firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            window.location.href = "../dashboard.html"; // changed here
        })
        .catch((error) => {
            errorDiv.innerText = error.message;
        });
});
document.getElementById("google-signup-btn").onclick = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
        .auth()
        .signInWithPopup(provider)
        .then(() => {
            window.location.href = "../dashboard.html"; // changed here
        })
        .catch((error) => {
            document.getElementById("signup-error").innerText = error.message;
        });
};