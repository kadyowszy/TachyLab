import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, increment, collection, addDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- DOM ELEMENTS ---
const container = document.getElementById('page-container');
const countEl = document.getElementById('guinea-pig-count');
const btn = document.getElementById('signup-btn');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');


// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyDUomBI0i9xQTWnxrJvJXzzQ4u8A8_pU1U",
  authDomain: "tachy-lab.firebaseapp.com",
  projectId: "tachy-lab",
  storageBucket: "tachy-lab.appspot.com",
  messagingSenderId: "1013659954856",
  appId: "1:1013659954856:web:69bab1fe00d285b66b9c9d"
};

// --- LOCAL MODE (FALLBACK) ---
function runLocalMode(errorMessage = "Firebase not configured. Running in local-only mode.") {
    console.warn(errorMessage);
    const signedKey = 'agnesTachyonHasSignedUp_local';
    const countKey = 'agnesTachyonGuineaPigCount_local';
    
    let num = parseInt(localStorage.getItem(countKey)) || 0;
    countEl.textContent = num.toLocaleString('en-US');

    if (localStorage.getItem(signedKey) === 'true') {
        document.body.classList.add('signed-up');
        btn.disabled = true;
        btn.textContent = 'You are now a guinea pig!';
        btn.classList.add('signed-up');
    } else {
        btn.disabled = false;
        btn.textContent = 'Sign up to be guinea pig';
    }

    btn.addEventListener('click', () => {
        if (localStorage.getItem(signedKey) !== 'true') {
            num++;
            countEl.textContent = num.toLocaleString('en-US');
            localStorage.setItem(countKey, num);
            localStorage.setItem(signedKey, 'true');
            
            document.body.classList.add('signed-up');
            btn.disabled = true;
            btn.textContent = 'You are now a guinea pig!';
            btn.classList.add('signed-up');
        }
    });
}

// --- MAIN LOGIC ---
async function main() {
    if (!firebaseConfig || firebaseConfig.apiKey.startsWith("PASTE_YOUR")) {
        runLocalMode();
        return;
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    try {
        await signInAnonymously(auth);
    } catch (error) {
        runLocalMode("Firebase authentication failed. Running in local mode.");
        return;
    }

    const userId = auth.currentUser.uid;
    const counterRef = doc(db, "globalCounter", "guineaPigs");
    const userStatusRef = doc(db, "users", userId);
    const shrineMessagesRef = collection(db, "shrineMessages");

    // --- REAL-TIME COUNTER LOGIC ---
    onSnapshot(counterRef, async (docSnap) => {
        if (docSnap.exists()) {
            const count = docSnap.data().count || 0;
            countEl.textContent = count.toLocaleString('en-US');

            const userDoc = await getDoc(userStatusRef);
            if (userDoc.exists() && userDoc.data().hasSignedUp) {
                document.body.classList.add('signed-up');
                btn.disabled = true;
                btn.textContent = 'You are now a guinea pig!';
                btn.classList.add('signed-up');
            } else {
                btn.disabled = false;
                btn.textContent = 'Sign up to be guinea pig';
            }
        } else {
            await setDoc(counterRef, { count: 0 });
        }
    }, (error) => {
        runLocalMode("Error listening to counter. Running in local mode.");
    });

    // --- SIGNUP BUTTON LOGIC ---
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const counterUpdatePromise = setDoc(counterRef, { count: increment(1) }, { merge: true });
            const userUpdatePromise = setDoc(userStatusRef, { hasSignedUp: true });

            await Promise.all([counterUpdatePromise, userUpdatePromise]);
            
            document.body.classList.add('signed-up');
            btn.textContent = 'You are now a guinea pig!';
            btn.classList.add('signed-up');

        } catch (e) {
            console.error("Failed to update counter:", e);
            btn.disabled = false;
            btn.textContent = 'Sign up failed, try again!';
        }
    });

    // --- REAL-TIME CHAT LOGIC ---
    const q = query(shrineMessagesRef, orderBy("createdAt", "desc"), limit(25));
    onSnapshot(q, (querySnapshot) => {
        chatBox.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const message = doc.data();
            const messageEl = document.createElement('div');
            messageEl.classList.add('chat-message');
            messageEl.textContent = message.text;
            chatBox.appendChild(messageEl);
        });
    });

    // --- CHAT FORM SUBMISSION LOGIC ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();

        if (messageText) {
            chatInput.value = '';
            await addDoc(shrineMessagesRef, {
                text: messageText,
                createdAt: serverTimestamp(),
                uid: userId
            });
        }
    });
}

main();