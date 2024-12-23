import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  };

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, update, onValue };
