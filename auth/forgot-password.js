document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      document.getElementById('forgot-success').innerText = "Reset email sent!";
      document.getElementById('forgot-error').innerText = "";
    })
    .catch(error => {
      document.getElementById('forgot-error').innerText = error.message;
      document.getElementById('forgot-success').innerText = "";
    });
});