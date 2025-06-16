document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "../dashboard.html"; // changed here
    })
    .catch(error => {
      document.getElementById('login-error').innerText = error.message;
    });
});
document.getElementById('google-signin-btn').onclick = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(() => {
      window.location.href = "../dashboard.html"; // changed here
    })
    .catch(error => {
      document.getElementById('login-error').innerText = error.message;
    });
};