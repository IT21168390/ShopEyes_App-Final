import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Voice from '@react-native-community/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';

//import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get } from 'firebase/database';
import db from '../../../Firebase/FirebaseRTD';
import { accelerometer } from 'react-native-sensors';
import { throttle, filter, debounceTime, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import ConfirmationModal from '../../Screens/ConfirmationModal';

export default function CreateItemList() {
    const navigation = useNavigation();

    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState('');

    const [shoppingList, setShoppingList] = useState([]);

    const [shopData, setShopData] = useState([]);

    const [isAddingItems, setIsAddingItems] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [editItemName, setEditItemName] = useState('');
    const [editItemNewQuantity, setEditItemNewQuantity] = useState(null);

    const [tempItem, setTempItem] = useState();
    const [tempQuantity, setTempQuantity] = useState(false);

    const [itemNavigation, setItemNavigation] = useState([]);


    const itemsRef = ref(db, '/items');
    const navRef = ref(db, '/navigations');

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

    // Function to fetch navigation data from the database
    function fetchNavigationData() {
        get(navRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setItemNavigation(data);
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
            if (inputString.toLowerCase() === item.itemName.toLowerCase()) {
                matchingItem = [item.itemName, item.itemCategory, item.itemCode];
                return matchingItem;
            }

            if (item.keywords) {
                // Iterate through the 'keywords' object
                for (const altKey in item.keywords) {
                    const altValue = item.keywords[altKey];
                    // Check if the input string matches the alt value
                    if (inputString.toLowerCase() === altValue.toLowerCase()) {
                        // If there's a match, record the 'itemName'
                        matchingItem = [item.itemName, item.itemCategory, item.itemCode];
                        return matchingItem;
                    }
                }
            }
        }

        return matchingItem;
    };


    const addItemToList = async (itemIn) => {
        const item = convertTextToNumber(itemIn);
        console.log('inside add: ', item);
        //setShoppingList((prevList) => (Array.isArray(prevList) ? [...prevList, toPascalCase(item)] : [toPascalCase(item)]));

        if (item.toLowerCase().includes('quantity')) {
            // Regular expression to match the item name and quantity
            //var regex = /(\w+)\s+quantity\s+(\d+)/i;
            var regex = /(.+)\s+quantity\s+(\d+)/i;

            // Use the regex to extract the item name and quantity
            var match = item.toLowerCase().match(regex);

            // Check if a match is found
            if (match) {
                // The item name is in the first capturing group (index 1)
                var itemName = match[1];

                // The quantity number is in the second capturing group (index 2)
                var quantity = parseInt(match[2]);

                // Output the extracted item name and quantity
                console.log("Item Name:", itemName);
                console.log("Quantity:", quantity);

                const nameFromDB = checkForMatch(itemName, shopData);
                if (nameFromDB) {
                    setShoppingList((prevList) => {

                        const updatedList = [...prevList];
                        const existingItemIndex = updatedList.findIndex((listItem) => listItem.name.toLowerCase() === nameFromDB[0].toLowerCase());

                        if (existingItemIndex !== -1) {
                            // If the item already exists in the list, update its quantity
                            updatedList[existingItemIndex].quantity = quantity;
                        } else {
                            // If the item is not in the list, add it with the specified quantity
                            Tts.speak(`${item} not found in the cart.`);
                        }

                        return updatedList;
                    });
                }
                else {
                    console.log("Item not available in Shop's database!");
                }
            } else {
                console.log("Item name and quantity not found in the input string.");
                return; // Exit the function if there's no quantity information
            }


        } else {
            // If "quantity" is not mentioned in the input, use a default quantity of 1
            const nameFromDB = checkForMatch(item, shopData);
            var itemName = nameFromDB[0].trim(); // Assuming the item name is the entire text
            var quantity = 1;
            var category = nameFromDB[1];
            var itemCode = nameFromDB[2];
            console.log(itemCode);

            setShoppingList((prevList) => {
                const updatedList = [...prevList, { name: itemName, quantity, category, itemCode }];// change for scan
                return updatedList;
            });
        }

        Tts.speak(itemName + " Successfully added to the list.");
    };



    function toPascalCase(str) {
        const words = str.split(" ");
        const newWords = words.map((word) => word[0].toUpperCase() + word.slice(1));
        return newWords.join(" ");
    }

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


    const [selectedItemToDelete, setSelectedItemToDelete] = useState(null);
    const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);


    const saveCart = async () => {
        //if (shoppingList.length > 0) {
        try {
            await AsyncStorage.setItem('ShoppingCart', JSON.stringify(shoppingList));

            console.log('Shopping list saved successfully!');
        } catch (error) {
            console.error('Error saving shopping list:', error);
        }

    };


    // Function to delete an item from the list
    const onDeleteItem = (itemToDelete) => {
        setSelectedItemToDelete(itemToDelete);
        setConfirmationModalVisible(true);
    };

    // Function to confirm item deletion
    const confirmDeleteItem = () => {
        const updatedList = shoppingList.filter((item) => item !== selectedItemToDelete);
        setShoppingList(updatedList);
        setConfirmationModalVisible(false);
        Tts.speak("Item Deleted!");
    };

    // Function to cancel item deletion
    const cancelDeleteItem = () => {
        setSelectedItemToDelete(null);
        setConfirmationModalVisible(false);
    };



    const speechStartHandler = (e) => {

        console.log("Speech start handler");
    }
    const speechEndHandler = (e) => {

        console.log("Speech end handler");
    }
    const speechResultsHandler = async (e) => {
        console.log("Speech event: ", e);

        const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
        const parsedLists = existingLists ? JSON.parse(existingLists) : [];

        console.log("InstantList: ", parsedLists);
        const text = e.value[0];
        setResult(text);

        if (text.toLowerCase() === "return" || text.toLowerCase() === "go back" || text.toLowerCase() === "exit") {
            setRecording(false);
            navigation.navigate('Home');
        }

        else if (text.toLowerCase().startsWith("add list") || text.toLowerCase().startsWith("add from regular list") || text.toLowerCase().startsWith("add saved list") || text.toLowerCase().startsWith("saved list") || text.toLowerCase().startsWith("shopping list")) {
            const listCommands = [
                "add list",
                "add from regular list",
                "add saved list",
                "saved list",
                "shopping list"
            ];
            const listCommandMatch = listCommands.find(command => text.toLowerCase().startsWith(command));
            const extractedPhrase = text.toLowerCase().substring(listCommandMatch.length).trim();
            console.log("Extracted Phrase: ", extractedPhrase);

            for (let index = 0; index < parsedLists.length; index++) {
                const withDigits = convertTextToNumber(extractedPhrase);
                const onlyTexts = convertStringToText(extractedPhrase);
                console.log(withDigits, onlyTexts);
                // Now, extractedPhrase contains the phrase from "list" onwards
                if ((extractedPhrase !== "" && extractedPhrase !== " ") && ((parsedLists[index].name.toLowerCase() === onlyTexts) || (parsedLists[index].name.toLowerCase() === withDigits))) {
                    //console.log(instantShoppingList[index].name);
                    parsedLists[index].items.forEach(item => {

                        const existingItemIndex = shoppingList.findIndex((listItem) => listItem.name.toLowerCase() === item.toLowerCase());

                        if (existingItemIndex !== -1) {
                            // If the item already exists in the list, update its quantity
                            console.log(`${item} already in the Cart.`);
                        } else {
                            // If the item is not in the list, add it with the specified quantity
                            addItemToList(item);
                        }

                    });
                    //break;
                    //Vibration.vibrate(500);
                    const successSignal = [100, 300, 300, 300];
                    Vibration.vibrate(successSignal);
                }
                else if ((extractedPhrase !== "" && extractedPhrase !== " ") && (('list ' + numberToString[index]) === extractedPhrase)) {
                    parsedLists[index].items.forEach(item => {
                        addItemToList(item);
                    });
                    //break;
                    Vibration.vibrate(500);
                }
            }

        }
        else if (text.toLowerCase() === "download" || text.toLowerCase() === "generate report" || text.toLowerCase() === "generate pdf" || text.toLowerCase() === "download pdf" || text.toLowerCase() === "download report") {
            setRecording(false);
            generatePDFReport();
        }

        else if (text.toLowerCase().startsWith("remove ") || text.toLowerCase().startsWith("delete ")) {
            const itemToRemove = text.substring(7);
            setSelectedItemToDelete(itemToRemove);
            console.log(itemToRemove);
            confirmDeleteItem(itemToRemove);
        }


        else if (text.toLowerCase().includes('quantity')) {
            addItemToList(text);
        }

        //save cart by a voice command
        else if (text.toLowerCase().startsWith("save") || text.toLowerCase().startsWith("store list")) {
            if (saveCart()) {
                console.log('    Save Success    ');
                Tts.speak('The list saved successfully')
            };
        }

        else {

            //addItemToList(text); // Add the voice input to the shopping list

            const foundItem = checkForMatch(text, shopData);
            if (foundItem) {
                console.log(foundItem[1])
                addItemToList(foundItem[0]); // Add the voice input to the shopping list
                // Ask for quantity
                Tts.speak("What is the quantity you want?");
                // Start listening for the quantity input


                // Ask if the user wants to add more items
                /*if (!isAddingItems) {
                    Tts.speak("Do you want to add more items?");
                    
                }*/

            }

            else {
                Tts.speak(`${text} Not found!`);
            }

        }
        setRecording(false);
    }

    const numberToString = {
        0: 'zero',
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine',
        10: 'ten',
    };

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

    const loadSavedShoppingList = async () => {
        try {
            const savedItems = await AsyncStorage.getItem('ShoppingCart');
            const parsedSavedItems = savedItems ? JSON.parse(savedItems) : [];
            setShoppingList(parsedSavedItems);
            console.log('Saved shopping list loaded successfully! ', shoppingList);
        } catch (error) {
            console.error('Error loading saved shopping list:', error);
        }
    };

    useEffect(() => {
        fetchNavigationData();
        dataFetch();
        Tts.speak("Press the Microphone button at the bottom to add items!");
        loadSavedShoppingList();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const shakeSubject$ = new Subject();

            Voice.onSpeechStart = speechStartHandler;
            Voice.onSpeechEnd = speechEndHandler;
            Voice.onSpeechResults = speechResultsHandler;
            Voice.onSpeechError = speechErrorHandler;

            // Initialize TTS engine
            Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
            Tts.setDefaultRate(0.45); // Set the speech rate (0.5 is half the normal speed)

            const subscription = accelerometer
                .pipe(
                    filter(({ x, y, z }) => {
                        const magnitude = Math.sqrt(x * x + y * y + z * z);
                        return magnitude > 40; // Adjust the threshold as needed
                    }),
                    debounceTime(1000), // Adjust the debounce time as needed
                    takeUntil(shakeSubject$)
                )
                .subscribe(() => {
                    // Handle shake event here
                    navigation.navigate('Regular Shopping');
                });

            return () => {
                Voice.destroy().then(Voice.removeAllListeners);
                // Clean up the subscription
                subscription.unsubscribe();
                // Complete the shakeSubject to prevent further events
                shakeSubject$.complete();
            }
        }, [shoppingList, shopData, result, itemNavigation])
    );

    const generatePDFReport = async () => {
        const imagePath = 'https://i.imgur.com/lxK9HEO.png';

        const existingLists = await AsyncStorage.getItem('ShoppingCart');
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
              <th><center>Item Name</center></th>
              <th><center>Quantity</center></th>
            </tr>
          `;

        // Loop through shoppingLists to generate table rows
        parsedLists.forEach((list, index) => {
            // Convert list.id (timestamp) to Date object

            htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td><b>${list.name}</b></td>
          <td><center>${list.quantity}</center></td>
          
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

        const pdfFileName = `ShopEyes-Shopping Cart_${Date.now()}.pdf`;
        const downloadsPath = RNFS.DownloadDirectoryPath; // Get the default Downloads directory

        const pdfFilePath = `${downloadsPath}/${pdfFileName}`;

        const pdfInfo = {
            html: htmlContent,
            fileName: `ShopEyes-Shopping Cart_${Date.now()}`,
            directory: '',
        };

        try {
            const generatedPDF = await RNHTMLtoPDF.convert(pdfInfo);
            console.log('PDF Report Generated: ', generatedPDF.filePath);
            // Move the generated PDF to the Downloads directory
            await RNFS.moveFile(generatedPDF.filePath, pdfFilePath);
        } catch (error) {
            console.error('Error Generating PDF Report: ', error);
        }
    };

    const onClickForScan = (item) => {
        console.log('        ' + item);

        navigation.navigate('Product_', { itemCode: item.itemCode, quantity: item.quantity });


    };


    const voiceForScan = (item) => {
        console.log('        ' + item);

        navigation.navigate('Product_', { itemCode: item.itemCode, quantity: item.quantity });

    };

    const onItemClick = (item, index) => {

        if (index === 0) {
            const navigationKeys = Object.keys(itemNavigation);

            // Iterate through the keys of the itemNavigation object
            for (const key of navigationKeys) {
                const element = itemNavigation[key];
                console.log('dryrdrdy', element.destinationCategory);
                if (element.currentCategory === "Start" && element.destinationCategory.toLowerCase() === item.category.toLowerCase()) {
                    console.log(element.navigationDescription);
                    Tts.speak(element.navigationDescription);
                    return;
                }
            }
        } else {
            // Handle the else part here

            // console.log(index);
            const navigationKeys = Object.keys(itemNavigation);
            const previousItem = shoppingList[index - 1];
            console.log(previousItem.category);

            // Iterate through the keys of the itemNavigation object
            for (const key of navigationKeys) {
                const element = itemNavigation[key];

                if (previousItem.category.toLowerCase() === item.category.toLowerCase()) {
                    console.log('      Msg        already in there    ');
                    Tts.speak('You are already in there');
                    return;

                }

                if (element.currentCategory.toLowerCase() === previousItem.category.toLowerCase() && element.destinationCategory.toLowerCase() === item.category.toLowerCase()) {
                    console.log(element.navigationDescription);
                    Tts.speak(element.navigationDescription);
                    return;
                }
            }
        }
    };




    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.createListButton} onPress={() => saveCart()}>
                <Text style={styles.createListButtonText}>Add To Cart</Text>
            </TouchableOpacity>

            <ScrollView style={{ marginBottom: 275 }}>
                <View style={styles.cardListView}>
                    {shoppingList.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => onItemClick(item, index) } //onItemClick(item, index)     
                        >
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 25 }}>
                                {item.name}: {item.quantity}
                            </Text>

                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={() => voiceForScan(item)}
                            >
                                <Icon name="send" size={40} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteItem(item)}
                            >
                                <Icon name="trash" size={40} color="white" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>

                {isConfirmationModalVisible ?
                    <ConfirmationModal
                        visible={isConfirmationModalVisible}
                        onConfirm={confirmDeleteItem}
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
    createListButton: {
        backgroundColor: 'blue',
        paddingVertical: 15, //12
        alignItems: 'center',
        borderRadius: 40, //8
    },
    createListButtonText: {
        color: 'white',
        fontSize: 50, //16
        fontWeight: 'bold',
    },
    cardListView: {
        marginTop: 16,
    },
    card: {
        backgroundColor: 'grey', //#e3e3e3
        //padding: 16,
        paddingLeft: 16,

        borderRadius: 8,
        marginBottom: 16,

        flexDirection: 'row', // Align text and delete button horizontally
        alignItems: 'center', // Center items vertically
        /*justifyContent: 'space-between', // Space items evenly horizontally
        paddingRight: 16, // Add right padding to separate the buttons from text*/
    },
    microphoneButtonContainer: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        zIndex: 1, // Ensure this value is higher than other components,
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

        backgroundColor: 'blue',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        bottom: 50
    },
    deleteButton: {
        //marginLeft: 'auto', // Push the button to the right
        backgroundColor: 'red',
        padding: 16,
    },
    sendButton: {
        marginLeft: 'auto', // Push the button to the right
        backgroundColor: 'green',
        padding: 16,
    },
})

