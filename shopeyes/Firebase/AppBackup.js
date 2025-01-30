// Previous App.js which had the full Firebase connection on it. --- WORKED. 

import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RegularShoppingMain from './src/Components/RegularShopping/RegularShoppingMain';
import CreateRegularList from './src/Components/RegularShopping/CreateRegularList'
import InstantListView from './src/Components/RegularShopping/InstantListView'
import CreateItemList from './src/Components/ItemsManagement/CreateItemList';
import Products from './src/Components/ProductIdentification/Product';
import HomeUI from './src/Screens/HomeUI';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get } from 'firebase/database';

// TODO: Add SDKs for Firebase products that  want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//  web app's Firebase configuration
const firebaseConfig = {
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ----------- INSERT - Worked.

/*const data = {
  name: "John Doe",
  age: 30
};*/

//db.ref('/users').push(data);
/*const usersRef = ref(db, '/users');
push(usersRef, data);*/


// ----------- READ All - Worked.

// Use the 'once' method to fetch data once
get(usersRef)
  .then((snapshot) => {
    if (snapshot.exists()) {
      // The data exists, and you can access it using snapshot.val()
      const data = snapshot.val();
      console.log(data);
    } else {
      console.log("No data available");
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

  // ----------- READ without IDs - Worked.
/*  get(usersRef)
  .then((snapshot) => {
    console.log("Snapshot:", snapshot);
    if (snapshot.exists()) {
      const data = [];
      snapshot.forEach((childSnapshot) => {
        data.push(childSnapshot.val());
      });
      console.log("Data:", data);
    } else {
      console.log("No data available");
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });*/


const Stack = createStackNavigator();



/*export default function App() {
  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeUI} />
        <Stack.Screen name="Create Item List" component={CreateItemList} />
        <Stack.Screen name="Regular Shopping" component={RegularShoppingMain} />
        <Stack.Screen name="Create Regular List" component={CreateRegularList} />
        <Stack.Screen name="Product_" component={Products} />
        <Stack.Screen name="Instant List View" component={InstantListView} />
      </Stack.Navigator>
    </NavigationContainer>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

*/
