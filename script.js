document.addEventListener('DOMContentLoaded', () => {
    const countEl = document.getElementById('guinea-pig-count');
    const btn = document.getElementById('signup-btn');
    const container = document.getElementById('page-container');
    const signedKey = 'agnesTachyonHasSignedUp_local'; // Still use local storage for the button state

    // Function to get the current count from the backend
    async function fetchCount() {
        try {
            // Updated to match your filename: count.js
            const response = await fetch('/api/count');
            const data = await response.json();
            countEl.textContent = data.count.toLocaleString('en-US');
        } catch (error) {
            console.error("Failed to fetch count:", error);
            countEl.textContent = "Error";
        }
    }

    // Initial setup
    fetchCount(); // Get the count when the page loads

    if (localStorage.getItem(signedKey) === 'true') {
        container.classList.add('signed-up');
        btn.disabled = true;
        btn.textContent = 'You are now a guinea pig!';
    } else {
        btn.disabled = false;
        btn.textContent = 'Sign up to be guinea pig';
    }

    // Button click handler
    btn.addEventListener('click', async () => {
        if (localStorage.getItem(signedKey) === 'true') return;

        btn.disabled = true;
        try {
            // Updated to match your filename: incrementcount.js
            const response = await fetch('/api/incrementcount', { method: 'POST' });
            const data = await response.json();

            // Update the UI with the new count from the server
            countEl.textContent = data.count.toLocaleString('en-US');
            localStorage.setItem(signedKey, 'true');
            container.classList.add('signed-up');
            btn.textContent = 'You are now a guinea pig!';

        } catch (error) {
            console.error("Failed to sign up:", error);
            btn.disabled = false;
            btn.textContent = 'Sign up failed, try again!';
        }
    });
});
