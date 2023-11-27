import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import Voice from '@react-native-community/voice';
import { ref, get } from 'firebase/database';
import db from '../../../Firebase/FirebaseRTD';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { blue100 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

export default function Products({ route }) {
  const { quantity, itemCode } = route.params;

  const navigation = useNavigation();
  const itemsRef = ref(db, '/items');

  const [data, Setdata] = useState('Scan Items');
  const [shopData, setShopData] = useState([]);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [result, setResult] = useState('');

  const [scannedItems, setScannedItems] = useState([]); //new


  const addItemToList = (itemId, data) => {
    const foundItem = checkForMatch(data, shopData);
    console.log(foundItem);
    console.log(foundItem.expireDate);

    /*const expireDate = new Date(foundItem.expireDate);
    const today = new Date();*/

    const expireDate = new Date(foundItem.expireDate);

    const today = new Date(parseInt(Date.now()));
    const date = today.toLocaleDateString();

    // Convert the 'date' string to a Date object
    const dateParts = date.split('/'); // Split the date string by '/'
    const currentDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); // Month is 0-based


    if (today > expireDate) {
      console.log("Item date is expired.Are you want to delete item.");
      Tts.speak('Item date is expired.Are you want to delete item.');
    }
    else {
      Tts.speak(`${foundItem.itemName}${foundItem.itemPrice}`);
      const listDate = new Date(parseInt(Date.now()));
      const date = listDate.toLocaleDateString();
      const time = listDate.toLocaleTimeString();
      console.log(date, time);

      //new
      //setScannedItems((prevList) => (Array.isArray(prevList) ? [...prevList, `${foundItem.itemName}${foundItem.itemPrice}`] : [`${foundItem.itemName}${foundItem.itemPrice}`]));
      setScannedItems((prevList) => (Array.isArray(prevList) ? [...prevList, [foundItem.itemName, parseFloat(foundItem.itemPrice)]] : [foundItem.itemName, parseFloat(foundItem.itemPrice)]));

      Tts.speak(`${foundItem.itemName}${foundItem.itemPrice}` + ' Successfully added to the bill.');

    }

  };

  function dataFetch() {
    get(itemsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // The data exists, and you can access it using snapshot.val()
          const data = snapshot.val();
          setShopData(data);
          console.log(data);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  const checkForMatch = (inputString, data) => {
    let matchingItem = null;

    // Iterate through the data
    for (const itemId in data) {
      const item = data[itemId];

      // Check if the input string exactly matches the itemName
      if (inputString.toLowerCase() === item.itemCode.toLowerCase() && inputString.toLowerCase() === itemCode) {
        matchingItem = item;
        return matchingItem;
      }

    }

    return matchingItem;
  };

  const handleBarcodeRead = async ({ data }) => {
    Setdata(data);

    // Generate a unique item ID
    const itemId = Date.now().toString(); // You can use a more robust method for generating IDs

    // Store the scanned data in AsyncStorage
    /*try {
      await AsyncStorage.setItem('UID123', data);
      console.log('Scanned data stored in AsyncStorage:', data);
    } catch (error) {
      console.error('Error storing scanned data:', error);
    }*/

    // Add the scanned data to Firebase with the generated item ID
    addItemToList(itemId, data);
  };


  const speechStartHandler = (e) => {
    console.log("Speech start handler");
  }
  const speechEndHandler = (e) => {
    console.log("Speech end handler");
  }
  const speechResultsHandler = (e) => {
    console.log("Speech event: ", e);
    const text = e.value[0];
    setResult(text);

    if (text.toLowerCase() === "bill" || text.toLowerCase() === "billing" || text.toLowerCase() === "check bill") {
      navigation.navigate('Bill', { items: scannedItems });
    }
  }
  const speechErrorHandler = (e) => {
    console.log("Speech error handler: ", e);
  }

  const startRecording = async () => {
    setRecording(true);
    try {
      await Voice.start('en-GB');
    } catch (error) {
      console.log("Error: ", error);
    }
  }
  const stopRecording = async () => {
    try {
      await Voice.stop();
      setRecording(false);
    } catch (error) {
      console.log("Error: ", error);
    }
  }


  useEffect(() => {
    dataFetch();
  }, []);

  useFocusEffect(
    useCallback(() => {
      Voice.onSpeechStart = speechStartHandler;
      Voice.onSpeechEnd = speechEndHandler;
      Voice.onSpeechResults = speechResultsHandler;
      Voice.onSpeechError = speechErrorHandler;

      // Initialize TTS engine
      Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
      Tts.setDefaultRate(0.45); // Set the speech rate (0.5 is half the normal speed)

      return () => {
        // Do something when the screen is unfocused
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, [shopData, scannedItems])
  );

  return (
    <View style={styles.container}>
      {/* <Text style={{color:'blue'}}>
        The quantity value passed is: {quantity}, {itemCode}
      </Text> */}
      <View>
        <Text style={styles.qrStyle}>{data}</Text>
      </View>
      <View style={styles.qr}>
        <QRCodeScanner
          onRead={({ data }) => {
            Setdata(data);
            handleBarcodeRead({ data });
          }}
          reactivate={true}
          reactivateTimeout={500}
          showMarker={true}
        />
      </View>
      {/* <View style={{ marginLeft: 15 }}>
        <Text>QR Code Scanner</Text>
      </View> */}

      <View>

        {/* <FlatList
          data={scannedItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text>{item}</Text>
            </View>
          )}
        /> */}
      </View>

      {/* <Button onPress={() => navigation.navigate('Bill', { items: scannedItems })}>BILL</Button> */}
      <View style={styles.microphoneButtonContainer}>
        <View style={styles.microphoneBackground}>
          {recording ? (
            <TouchableOpacity style={styles.microphoneButton} onPress={stopRecording}>
              <Icon name="microphone-slash" size={150} color="white" style={styles.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.microphoneButton} onPress={startRecording}>
              <Icon name="microphone" size={150} color="white" style={styles.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  qr: {
    
  },
  qrStyle: {
    textAlign:'center',
    color: 'black',
    padding: 10,
    fontSize: 25,
    backgroundColor: 'grey',
    marginBottom: 0,
    zIndex: 1
  },
  microphoneButtonContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  microphoneBackground: {
    backgroundColor: 'blue',
    borderRadius: 50,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneButton: {
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    bottom: 50
  },
});