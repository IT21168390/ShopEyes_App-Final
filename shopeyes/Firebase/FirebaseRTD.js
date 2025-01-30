import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get } from 'firebase/database';

// TODO: Add SDKs for Firebase products that  want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//  web app's Firebase configuration
/*const firebaseConfig = {
};*/
const firebaseConfig = {
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
