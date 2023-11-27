import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get } from 'firebase/database';

// TODO: Add SDKs for Firebase products that  want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//  web app's Firebase configuration
/*const firebaseConfig = {
    apiKey: "AIzaSyD8-3-sSKZNhmq_aAj4WwBdogHdYQAI4v4",
    authDomain: "shopeyes-rn-project-1.firebaseapp.com",
    databaseURL: "https://shopeyes-rn-project-1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "shopeyes-rn-project-1",
    storageBucket: "shopeyes-rn-project-1.appspot.com",
    messagingSenderId: "54881385649",
    appId: "1:54881385649:web:bc125a7453a9e34598f690"
};*/
const firebaseConfig = {
    apiKey: "AIzaSyBgwJMpX4LUSEHDs0C2O0oL2XjBQY_pqQU",
    authDomain: "shop-e0971.firebaseapp.com",
    databaseURL: "https://shop-e0971-default-rtdb.firebaseio.com",
    projectId: "shop-e0971",
    storageBucket: "shop-e0971.appspot.com",
    messagingSenderId: "204728642679",
    appId: "1:204728642679:web:70fbe2cd8baf88dbeaaa72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;