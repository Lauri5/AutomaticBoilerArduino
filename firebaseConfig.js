import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBoZvJcoUvTy4oK-fPKZEoW9muQBeq2oeo",
    authDomain: "caldaia-22e0a.firebaseapp.com",
    databaseURL: "https://caldaia-22e0a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "caldaia-22e0a",
    storageBucket: "caldaia-22e0a.firebasestorage.app",
    messagingSenderId: "709635139416",
    appId: "1:709635139416:web:da81c4bc86d459028a272d"
  };

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, update, onValue };
