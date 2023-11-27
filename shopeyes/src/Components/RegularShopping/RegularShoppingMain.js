import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import Voice from '@react-native-community/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { useRoute } from '@react-navigation/native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

import Tts from 'react-native-tts';

import { useIsFocused } from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import ConfirmationModal from '../../Screens/ConfirmationModal';

export default function RegularShoppingMain() {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [messages, setMessages] = useState("");
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [result, setResult] = useState('');

  const [shoppingLists, setShoppingLists] = useState([]);

  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null);

  // Function to delete an item from the list
  const onDeleteItem = (itemToDelete) => {
    setSelectedItemToDelete(itemToDelete);
    setConfirmationModalVisible(true);
  };

  // Function to confirm item deletion
  const deleteList = async () => {
    try {
      // Retrieve the current list of shopping lists from AsyncStorage
      const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
      const parsedLists = existingLists ? JSON.parse(existingLists) : [];

      // Find the index of the list to be deleted
      const listIndex = parsedLists.findIndex((list) => list.id === selectedItemToDelete);

      if (listIndex !== -1) {
        // Remove the list from the array
        parsedLists.splice(listIndex, 1);

        // Update AsyncStorage with the modified list
        await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));

        // Update the state to reflect the change
        setShoppingLists(parsedLists);
      }
    } catch (e) {
      console.error('Error deleting shopping list:', e);
    }
    setConfirmationModalVisible(false);
    Tts.speak("List Deleted!");
  };


  // Function to cancel item deletion
  const cancelDeleteItem = () => {
    setSelectedItemToDelete(null);
    setConfirmationModalVisible(false);
  };



  // Function to convert a string with number digits to a text version
  function convertStringToText(str) {
    // Create a regular expression to match numbers
    const numberRegex = /\d+/;

    // Split the string into words
    const words = str.split(" ");

    // Iterate over the words and convert any numbers to text
    for (let i = 0; i < words.length; i++) {
      if (numberRegex.test(words[i])) {
        // Convert the number to text
        words[i] = numbersToString(words[i]);
      }
    }

    // Join the words back into a string
    return words.join(" ");
  }

  // Function to convert a number to text
  function numbersToString(number) {
    // Create an object to store the numbers and their corresponding text values
    const numberToText = {
      0: "zero",
      1: "one",
      2: "two",
      3: "three",
      4: "four",
      5: "five",
      6: "six",
      7: "seven",
      8: "eight",
      9: "nine",
    };

    // Convert the number to a string
    const numberString = number.toString();

    // Iterate over the number string and convert each digit to text
    let text = "";
    for (let i = 0; i < numberString.length; i++) {
      text += numberToText[numberString[i]] + " ";
    }

    // Remove the trailing space
    return text.trim();
  }

  // Function to convert a text version of a number to a number
  function convertTextToNumber(str) {
    // Create an object to store the numbers and their corresponding text values
    const textToNumber = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
    };

    // Split the string into words
    const words = str.split(" ");

    // Iterate over the words and convert any text numbers to numbers
    for (let i = 0; i < words.length; i++) {
      if (textToNumber.hasOwnProperty(words[i])) {
        words[i] = textToNumber[words[i]];
      }
    }

    // Join the words back into a string
    return words.join(" ");
  }



  const speechStartHandler = (e) => {

    console.log("Speech start handler");
  }
  const speechEndHandler = (e) => {
    setRecording(false);
    console.log("Speech end handler");
  }
  const speechResultsHandler = async (e) => {
    console.log("Speech event: ", e);
    const text = e.value[0];
    setResult(text);

    if (text.toLowerCase() === "new" || text.toLowerCase() === "add list" || text.toLowerCase() === "new list" || text.toLowerCase() === "create list") {
      setRecording(false);
      navigation.navigate('Create Regular List');
    }
    else if (text.toLowerCase() === "home" || text.toLowerCase() === "go back" || text.toLowerCase() === "home page" || text.toLowerCase() === "exit") {
      setRecording(false);
      navigation.navigate('Home');
    }
    else if (text.toLowerCase() === "download" || text.toLowerCase() === "generate report" || text.toLowerCase() === "generate pdf" || text.toLowerCase() === "download pdf" || text.toLowerCase() === "download report") {
      setRecording(false);
      generatePDFReport();
    }
    else if (text.toLowerCase().startsWith("remove ") || text.toLowerCase().startsWith("delete ")) {
      setRecording(false);
      const listToRemove = text.substring(7); // Extract the item name from the command
      const listIdentified = shoppingLists.filter((list) => list.name.toLowerCase() === convertStringToText(listToRemove.toLowerCase()) || list.name.toLowerCase() === convertTextToNumber(listToRemove.toLowerCase()));
      if (listIdentified.length > 0) {
        console.log('Delete list: ' + listIdentified[0].id);
        setSelectedItemToDelete(listIdentified[0].id);
        try {
          // Retrieve the current list of shopping lists from AsyncStorage
          const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
          const parsedLists = existingLists ? JSON.parse(existingLists) : [];

          // Find the index of the list to be deleted
          const listIndex = parsedLists.findIndex((list) => list.id === listIdentified[0].id);

          if (listIndex !== -1) {
            // Remove the list from the array
            parsedLists.splice(listIndex, 1);

            // Update AsyncStorage with the modified list
            await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));

            // Update the state to reflect the change
            setShoppingLists(parsedLists);
          }
        } catch (e) {
          console.error('Error deleting shopping list:', e);
        }
        setConfirmationModalVisible(false);
        Tts.speak("List Deleted!");
        setSelectedItemToDelete(null);
      } else {
        Tts.speak('Invalid list name to delete');
      }

    }
    else if (!(text === null || text === '' || text === ' ')) {
      shoppingLists.forEach(list => {
        if (list.name.toLowerCase() === convertStringToText(text).toLowerCase() || list.name.toLowerCase() === convertTextToNumber(text).toLowerCase()) {
          navigation.navigate('Instant List View', { id: list.id });
          return;
        }
      });
    }
  }
  const speechErrorHandler = (e) => {

    console.log("Speech error handler: ", e);
  }

  const startRecordingMain = async () => {
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

  const clear = () => {
    setMessages([]);
  }
  const stopSpeaking = () => {
    setSpeaking(false);
  }


  useEffect(() => {
    //getData();
    if (isFocused) {
      getData();
    }

  }, [isFocused])

  useFocusEffect(
    useCallback(() => {
      // Call the asynchronous function to fetch the data
      //getData();

      console.log(shoppingLists);

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
        // Useful for cleanup functions
        //Tts.stop(true); //If stopped, Tts.speak in CreateRegularList's useEffect will not work. But there may be consequences!
      };
    }, [shoppingLists])
  );


  // Inside `getData` function
  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('RegularBuyingLists');
      if (jsonValue !== null) {
        const parsedData = JSON.parse(jsonValue);
        setShoppingLists(parsedData);
      }
      console.log(shoppingLists);
    } catch (e) {
      console.error('Error loading shopping lists:', e);
    }
  };



  const generatePDFReport = async () => {
    const imagePath = 'https://i.imgur.com/lxK9HEO.png';

    const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
    const parsedLists = existingLists ? JSON.parse(existingLists) : [];

    // Define CSS styles
    const styles = `
  <style>
    body {
      font-family: Arial, sans-serif;
    }
    h1 {
      font-size: 24px;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #000000;//#f2f2f2;
      color: #FFFFFF;
    }
  </style>
`;

    // Initialize an empty string to store the HTML content
    let htmlContent = `
  <html>
    <head>
      <title>Favourites</title>
      ${styles}
    </head>
    <body>
    <center><img src="${imagePath}" alt="Image" style="width: 100px; height: 112.5px;"/><br/>
    <hr/>
      <h1>Regular Shopping Lists</h1></center>
      <table>
        <tr>
          <th>#</th>
          <th>List Name</th>
          <th><center>Date</center></th>
          <th><center>Time (HH:MM:SS)</center></th>
          <th><center>Items</center></th>
        </tr>
      `;

    // Loop through shoppingLists to generate table rows
    parsedLists.forEach((list, index) => {
      // Convert list.id (timestamp) to Date object
      const listDate = new Date(parseInt(list.id));
      const formattedDate = listDate.toLocaleDateString();
      const formattedTime = listDate.toLocaleTimeString();
      htmlContent += `
    <tr>
      <td>${index + 1}</td>
      <td><b>${list.name}</b></td>
      <td><center>${formattedDate}</center></td>
      <td><center>${formattedTime}</center></td>
      <td>${list.items.join(',<br/>')}</td>
    </tr>
  `;
    });

    // Close the HTML structure
    htmlContent += `
      </table>
      <p></p>
    </body>
  </html>
`;

    const pdfFileName = `ShopEyes-Favourites_${Date.now()}.pdf`;
    const downloadsPath = RNFS.DownloadDirectoryPath; // Get the default Downloads directory

    const pdfFilePath = `${downloadsPath}/${pdfFileName}`;

    const pdfInfo = {
      html: htmlContent,
      fileName: `ShopEyes-Favourites_${Date.now()}`,
      directory: '',
    };

    try {
      /*const pdfFilePath = await RNHTMLtoPDF.convert(pdfInfo);
      console.log('PDF Report Generated: ', pdfFilePath);*/
      const generatedPDF = await RNHTMLtoPDF.convert(pdfInfo);
      console.log('PDF Report Generated: ', generatedPDF.filePath);
      // Move the generated PDF to the Downloads directory
      await RNFS.moveFile(generatedPDF.filePath, pdfFilePath);

      Tts.speak('PDF Report Downloaded');
      const doublePulse = [100, 200, 200, 200];
      Vibration.vibrate(doublePulse);
    } catch (error) {
      console.error('Error Generating PDF Report: ', error);
    }
  };



  return (

    <View style={styles.container}>

      <TouchableOpacity style={styles.addListButton} onPress={() => navigation.navigate('Create Regular List')}>
        <Text style={styles.addListButtonText}>Add List</Text>
      </TouchableOpacity>
      <ScrollView style={{ marginBottom: 275 }}>
        <View style={styles.cardListView}>
          {/* Individual Card/List Items */}
          {/* We can map through your data and render cards/lists here */}
          {shoppingLists.map((item, index) => (
            <View key={index} style={styles.card}>
              <TouchableOpacity>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 27 }} onPress={() => navigation.navigate('Instant List View', { id: item.id })}>{item.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteItem(item.id)}>
                <Icon name="trash" size={40} color="yellow" />
              </TouchableOpacity>
            </View>
          ))}
          {/* Add more card items as needed */}
        </View>

        {isConfirmationModalVisible ?
          <ConfirmationModal
            visible={isConfirmationModalVisible}
            onConfirm={deleteList}
            onCancel={cancelDeleteItem}
          /> :
          null
        }
      </ScrollView>

      <View style={styles.microphoneButtonContainer}>
        <View style={styles.microphoneBackground}>
          {recording ? (
            <TouchableOpacity style={styles.microphoneButton} onPress={stopRecording}>
              <Icon name="microphone-slash" size={150} color="white" style={styles.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.microphoneButton} onPress={startRecordingMain}>
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
  addListButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  addListButtonText: {
    color: 'yellow',
    fontSize: 50, //16
    fontWeight: 'bold',
  },
  cardListView: {
    marginTop: 16,
  },
  card: {
    backgroundColor: 'blue',//'#e3e3e3',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,

    flexDirection: 'row', // Align text and delete button horizontally
    alignItems: 'center', // Center items vertically
  },
  microphoneButtonContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  microphoneBackground: {
    backgroundColor: 'blue',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneButton: {
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    bottom: 50
  },
  deleteButton: {
    marginLeft: 'auto', // Push the button to the right
    backgroundColor: 'red',
    padding: 16,
  },
});