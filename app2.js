import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { connectAuthEmulator } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzpb1tMepTLmuRs99F5NRK_6TNLH3nShk",
  authDomain: "to-do-app-af007.firebaseapp.com",
  projectId: "to-do-app-af007",
  storageBucket: "to-do-app-af007.appspot.com",
  messagingSenderId: "533876315108",
  appId: "1:533876315108:web:718a523d3b26f5efc52df1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

if (window.location.hostname === "localhost") {
    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Auth emulator
    connectAuthEmulator(auth, "http://localhost:9099");
  }

// DOM elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Auth state listener
onAuthStateChanged(auth, async(user) => {
    if (user) {
        // User is signed in
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Load user's todos
        loadTodos(user.uid);
    } else {
        // User is signed out
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        todoList.innerHTML = '';
        
        // Clear form fields
        loginEmail.value = '';
        loginPassword.value = '';
        signupEmail.value = '';
        signupPassword.value = '';
    }
});

// Login
loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showAlert('login-form', error.message, 'danger');
    }
});

// Signup
signupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = signupEmail.value;
    const password = signupPassword.value;
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showAlert('signup-form', 'Account created successfully!', 'success');
    } catch (error) {
        showAlert('signup-form', error.message, 'danger');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
});


// Load todos for current user with error handling
const loadTodos = async (userId) => {
    // Clear existing todos
    todoList.innerHTML = '';
    
    try {
        const q = query(
            collection(db, 'todos'),
            where('userId', '==', userId),
            orderBy('createdAt')
        );
        
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    renderTodo(change.doc);
                } else if (change.type === 'modified') {
                    updateTodo(change.doc);
                } else if (change.type === 'removed') {
                    removeTodo(change.doc.id);
                }
            });
        });
    } catch (error) {
        console.error("Query error:", error);
        showAlert('app-container', 'Error loading tasks. Please refresh the page.', 'danger');
    }
};

// Render a single todo
function renderTodo(todoDoc) {
    const data = todoDoc.data();
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.setAttribute('data-id', todoDoc.id);

    const todoText = document.createElement('span');
    todoText.textContent = data.text;
    if (data.completed) {
        todoText.classList.add('completed');
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'todo-actions';

    const completeBtn = document.createElement('button');
    completeBtn.className = `btn btn-sm ${data.completed ? 'btn-outline-success' : 'btn-success'}`;
    completeBtn.textContent = data.completed ? 'Undo' : 'Complete';
    completeBtn.addEventListener('click', async () => {
        try {
            await updateDoc(doc(db, 'todos', todoDoc.id), {
                completed: !data.completed
            });
        } catch (error) {
            console.error("Error updating todo:", error);
        }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteDoc(doc(db, 'todos', todoDoc.id));
            } catch (error) {
                console.error("Error deleting todo:", error);
            }
        }
    });

    actionsDiv.appendChild(completeBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(todoText);
    li.appendChild(actionsDiv);
    todoList.appendChild(li);
}

// Update a todo in the UI
function updateTodo(todoDoc) {
    const li = document.querySelector(`[data-id="${todoDoc.id}"]`);
    if (li) {
        const data = todoDoc.data();
        const span = li.querySelector('span');
        const completeBtn = li.querySelector('.todo-actions button:first-child');
        
        span.textContent = data.text;
        span.classList.toggle('completed', data.completed);
        
        completeBtn.className = `btn btn-sm ${data.completed ? 'btn-outline-success' : 'btn-success'}`;
        completeBtn.textContent = data.completed ? 'Undo' : 'Complete';
    }
}

// Remove a todo from the UI
function removeTodo(docId) {
    const li = document.querySelector(`[data-id="${docId}"]`);
    if (li) {
        li.remove();
    }
}

// Add a new todo
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = todoInput.value.trim();
    if (text === '') return;
    
    const user = auth.currentUser;
    if (!user) {
        showAlert('todo-form', 'Please sign in to add todos', 'danger');
        return;
    }
    
    try {
        await addDoc(collection(db, 'todos'), {
            text: text,
            completed: false,
            createdAt: serverTimestamp(),
            userId: user.uid
        });
        todoInput.value = '';
    } catch (error) {
        console.error("Error adding todo:", error);
        showAlert('todo-form', 'Failed to add todo', 'danger');
    }
});

// Show alert message
function showAlert(parentId, message, type) {
    const parent = document.getElementById(parentId);
    const existingAlert = parent.querySelector('.alert');
    if (existingAlert) existingAlert.remove();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    parent.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}