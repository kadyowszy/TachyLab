import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, runTransaction, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- DOM ELEMENTS ---
const container = document.getElementById('page-container');
const countEl = document.getElementById('guinea-pig-count');
const btn = document.getElementById('signup-btn');

// --- FIREBASE SETUP ---
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG;
let firebaseConfig;

if (firebaseConfigString) {
    try {
        firebaseConfig = JSON.parse(firebaseConfigString);
    } catch (e) {
        console.error("Failed to parse Firebase config:", e);
    }
}

// --- LOCAL MODE (FALLBACK) ---
function runLocalMode() {
    const signedKey = 'agnesTachyonHasSignedUp_local';
    const countKey = 'agnesTachyonGuineaPigCount_local';
    
    let num = parseInt(localStorage.getItem(countKey)) || 0;
    countEl.textContent = num.toLocaleString('en-US');

    if (localStorage.getItem(signedKey) === 'true') {
        container.classList.add('signed-up');
        btn.disabled = true;
        btn.textContent = 'You are now a guinea pig!';
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
            
            container.classList.add('signed-up');
            btn.disabled = true;
            btn.textContent = 'You are now a guinea pig!';
        }
    });
}

// --- MAIN LOGIC ---
async function main() {
    if (!firebaseConfig) {
        runLocalMode();
        return;
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Firebase authentication failed:", error);
        runLocalMode();
        return;
    }

    const userId = auth.currentUser.uid;
    const counterRef = doc(db, "globalCounter", "guineaPigs");
    const userStatusRef = doc(db, "users", userId);

    onSnapshot(counterRef, async (docSnap) => {
        if (docSnap.exists()) {
            const count = docSnap.data().count || 0;
            countEl.textContent = count.toLocaleString('en-US');

            const userDoc = await getDoc(userStatusRef);
            if (userDoc.exists() && userDoc.data().hasSignedUp) {
                container.classList.add('signed-up');
                btn.disabled = true;
                btn.textContent = 'You are now a guinea pig!';
            } else {
                btn.disabled = false;
                btn.textContent = 'Sign up to be guinea pig';
            }
        } else {
            await setDoc(counterRef, { count: 0 });
        }
    }, (error) => {
        console.error("Error listening to counter updates:", error);
        runLocalMode();
    });

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                if (!counterDoc.exists()) {
                    throw "Counter document does not exist!";
                }
                const newCount = (counterDoc.data().count || 0) + 1;
                transaction.update(counterRef, { count: newCount });
                transaction.set(userStatusRef, { hasSignedUp: true });
            });
            container.classList.add('signed-up');
            btn.textContent = 'You are now a guinea pig!';
        } catch (e) {
            console.error("Transaction failed: ", e);
            btn.disabled = false;
            btn.textContent = 'Sign up failed, try again!';
        }
    });
}

main();
