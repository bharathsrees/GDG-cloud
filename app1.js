import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
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
  orderBy 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDjiIR9rPT1oSKxyvukvUWqvjUr__ufiW4",
    authDomain: "todo-app-acb73.firebaseapp.com",
    projectId: "todo-app-acb73",
    storageBucket: "todo-app-acb73.firebasestorage.app",
    messagingSenderId: "1006390146421",
    appId: "1:1006390146421:web:d4401c581adb40d88a8f3c",
    measurementId: "G-D2RDZBV8ZC"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern modular syntax
const db = getFirestore(app);

// DOM elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Add a new todo
// Add a new todo
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const todoText = todoInput.value.trim();
    if (todoText !== '') {
        try {
            await addDoc(collection(db, 'todos'), {
                text: todoText,
                completed: false,
                createdAt: serverTimestamp()
            });
            todoInput.value = '';
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }
});

// Real-time listener
onSnapshot(
    query(collection(db, 'todos'), orderBy('createdAt')), 
    (snapshot) => {
        // ... rest of your listener code
    }
);

// For update operation:
await updateDoc(doc(db, 'todos', docId), {
    completed: !currentCompleted
});

// For delete operation:
await deleteDoc(doc(db, 'todos', docId));

// Display todos
function renderTodos(doc) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.setAttribute('data-id', doc.id);

    const todoText = document.createElement('span');
    todoText.textContent = doc.data().text;
    if (doc.data().completed) {
        todoText.classList.add('completed');
    }

    const buttonsDiv = document.createElement('div');

    const completeButton = document.createElement('button');
    completeButton.className = 'btn btn-success btn-sm me-2';
    completeButton.textContent = '✓';
    completeButton.addEventListener('click', () => {
        db.collection('todos').doc(doc.id).update({
            completed: !doc.data().completed
        });
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.textContent = '✕';
    deleteButton.addEventListener('click', () => {
        db.collection('todos').doc(doc.id).delete();
    });

    buttonsDiv.appendChild(completeButton);
    buttonsDiv.appendChild(deleteButton);

    li.appendChild(todoText);
    li.appendChild(buttonsDiv);

    todoList.appendChild(li);
}

// Real-time listener
db.collection('todos')
    .orderBy('createdAt')
    .onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        changes.forEach(change => {
            if (change.type === 'added') {
                renderTodos(change.doc);
            } else if (change.type === 'modified') {
                const li = todoList.querySelector(`[data-id=${change.doc.id}]`);
                const span = li.querySelector('span');
                span.classList.toggle('completed', change.doc.data().completed);
            } else if (change.type === 'removed') {
                const li = todoList.querySelector(`[data-id=${change.doc.id}]`);
                todoList.removeChild(li);
            }
        });
    });