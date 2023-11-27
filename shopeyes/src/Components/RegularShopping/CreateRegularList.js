import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Voice from '@react-native-community/voice';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Tts from 'react-native-tts';

import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';

import { getDatabase, ref, push, get } from 'firebase/database';
import db from '../../../Firebase/FirebaseRTD';

import ConfirmationModal from '../../Screens/ConfirmationModal';

export default function CreateRegularList() {
    const navigation = useNavigation();

    const [messages, setMessages] = useState("");
    const [recording, setRecording] = useState(false);
    const [speaking, setSpeaking] = useState(true);
    const [result, setResult] = useState('');

    const [shopData, setShopData] = useState([]);
    const [existingListNames, setExistingListNames] = useState([]);

    const itemsRef = ref(db, '/items');

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

    async function listNamesFetch() {
        const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
        const parsedLists = existingLists ? JSON.parse(existingLists) : [];

        const allListNames = parsedLists.map((list) => list.name);
        setExistingListNames(allListNames);
    }


    const checkForMatch = (inputString, data) => {
        let matchingItem = null;

        // Iterate through the data
        for (const itemId in data) {
            const item = data[itemId];

            // Check if the input string exactly matches the itemName
            if (item.itemName && (inputString.toLowerCase() === item.itemName.toLowerCase())) {
                matchingItem = item.itemName;
                return matchingItem;
            }

            if (item.keywords) {
                // Iterate through the 'keywords' object
                for (const altKey in item.keywords) {
                    const altValue = item.keywords[altKey];
                    // Check if the input string matches the alt value
                    if (inputString.toLowerCase() === altValue.toLowerCase()) {
                        // If there's a match, record the 'itemName'
                        matchingItem = item.itemName;
                        return matchingItem;
                    }
                }
            }
        }

        return matchingItem;
    };




    const [shoppingList, setShoppingList] = useState([]);
    const [shoppingListName, setShoppingListName] = useState(null);

    const addItemToList = (itemName) => {
        setShoppingList((prevList) => [...prevList, toPascalCase(itemName)]);
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
        setRecording(false);
        console.log("Speech end handler");
    }

    const storeData = async () => {
        if (shoppingList.length > 0) {
            try {
                const newList = {
                    id: `${Date.now()}`, // Generate a unique ID for the list
                    name: 'New Shopping List', // Customize the list name as needed
                    items: shoppingList,
                };

                const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
                const parsedLists = existingLists ? JSON.parse(existingLists) : [];

                if (shoppingListName) {
                    newList.name = shoppingListName;
                    let count = 1;
                    for (let index = 0; index < parsedLists.length; index++) {
                        if (newList.name === parsedLists[index].name) {
                            newList.name = shoppingListName + ` ${count + 1}`;
                        }
                    }
                } else {
                    // Find the highest number used in existing list names
                    let maxNumber = 0;
                    for (let index = 0; index < parsedLists.length; index++) {
                        const listName = parsedLists[index].name.toLowerCase().trim();
                        if (listName.startsWith('shopping list ')) {
                            const number = parseInt(listName.substring(13));
                            if (!isNaN(number) && number > maxNumber) {
                                maxNumber = number;
                            }
                        }
                    }

                    // Create a new list name by incrementing the highest number
                    newList.name = 'Shopping List ' + (maxNumber + 1);

                    // Check if the new list name already exists
                    for (let index = 0; index < parsedLists.length; index++) {
                        if (newList.name.toLowerCase().trim() === parsedLists[index].name.toLowerCase().trim()) {
                            // If the name already exists, increment the number
                            maxNumber++;
                            newList.name = 'Shopping List ' + (maxNumber + 1);
                            index = -1; // Restart the loop to recheck the new name
                        }
                    }
                    /*
                    newList.name = 'Shopping List ' + (parsedLists.length);
                    for (let index = 0; index < parsedLists.length; index++) {
                        if (newList.name.toLowerCase().trim() === parsedLists[index].name.toLowerCase().trim()) {
                            newList.name = 'Shopping List ' + (index + 2);
                        }
                    }*/
                }


                const updatedLists = [...parsedLists, newList];

                await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(updatedLists));
                console.log('Success: List added');
                Tts.speak(`List saved as ${newList.name}!`);
                setShoppingList([]); // Clear the current shopping list
                //Vibration.vibrate(400);
                const vbPtrn = [200, 100, 200, 100, 200, 200, 500];
                Vibration.vibrate(vbPtrn);
            } catch (e) {
                console.error('Error saving shopping list:', e);
            }
        } else {
            console.log('Null List cannot add!');
            Tts.speak('List is empty');
        }
    };

    const speechResultsHandler = (e) => {

        console.log("Speech event: ", e);
        const text = e.value[0];
        setResult(text);
        if (text.toLowerCase() === "return" || text.toLowerCase() === "go back" || text.toLowerCase() === "exit") {
            setRecording(false);
            navigation.replace('Regular Shopping');
            //navigation.navigate('Regular Shopping');
        }
        else if (text.toLowerCase() === "save" || text.toLowerCase() === "save list" || text.toLowerCase() === "create list") {
            setRecording(false);
            storeData();
        }
        else if (text.toLowerCase().startsWith("list name ") || text.toLowerCase().startsWith("set name ") || text.toLowerCase().startsWith("name is ") || text.toLowerCase().startsWith("store as ")) {
            setRecording(false);
            if (text.toLowerCase().startsWith("list name ")) {
                setShoppingListName(toPascalCase(text.substring(10)));
            }
            else if (text.toLowerCase().startsWith("set name ") || text.toLowerCase().startsWith("store as ")) {
                const withDigits = convertTextToNumber(text.substring(9));
                const onlyTexts = convertStringToText(text.substring(9));
                console.log(withDigits, onlyTexts);

                let canBeSet = true;

                existingListNames.forEach(name => {

                    if (name.toLowerCase() === withDigits.toLowerCase() || name.toLowerCase() === onlyTexts.toLowerCase()) {
                        // If the name already exists in a list
                        canBeSet = false;
                        console.log(`${name} already exists!`);
                    } else {
                        console.log(`${name} is OK`);
                    }

                });
                if (canBeSet) {
                    setShoppingListName(toPascalCase(text.substring(9)));
                }
                else {
                    Tts.speak(`Sorry, a list named ${text.substring(9)} already exists!`);
                }
                //setShoppingListName(toPascalCase(text.substring(9)));
            }
            else if (text.toLowerCase().startsWith("name is ")) {
                setShoppingListName(toPascalCase(text.substring(8)));
            }
        }
        else {
            const foundItem = checkForMatch(text, shopData);
            if (foundItem) {
                addItemToList(foundItem); // Add the voice input to the shopping list
            }
            else {
                Tts.speak(`${text} Not found!`);
            }
        }
        setRecording(false);

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

    const clear = () => {
        setMessages([]);
    }
    const stopSpeaking = () => {
        setSpeaking(false);
    }


    useEffect(() => {
        dataFetch();
        listNamesFetch();
        Tts.speak("Press the Microphone button at the bottom to add items!");
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
                // Useful for cleanup functions
                //Tts.stop(true);
            };
        }, [shoppingList, shoppingListName, shopData])
    );


    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.createListButton} onPress={storeData}>
                <Text style={shoppingListName ? { fontSize: 35, fontWeight: 'bold', color: 'yellow' } : { fontSize: 50, fontWeight: 'bold', color: 'white' }}>{shoppingListName ? "Save: " + shoppingListName : "Save List"}</Text>
            </TouchableOpacity>

            <ScrollView style={{ marginBottom: 275 }}>
                <View style={styles.cardListView}>
                    {shoppingList.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={{ color: 'yellow', fontWeight: 'bold', fontSize: 25 }}>{item}</Text>

                            <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteItem(item)}>
                                <Icon name="trash" size={40} color="white" />
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: 'black',
        paddingVertical: 15, //12
        alignItems: 'center',
        borderRadius: 40, //8
    },
    /*createListButtonText: {
        color: 'white',
        fontSize: 50, //16
        fontWeight: 'bold',
    },*/
    cardListView: {
        marginTop: 16,
    },
    card: {
        backgroundColor: 'black', //#e3e3e3
        //padding: 16,
        paddingLeft: 16,

        borderRadius: 8,
        marginBottom: 16,

        flexDirection: 'row', // Align text and delete button horizontally
        alignItems: 'center', // Center items vertically
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
        marginLeft: 'auto', // Push the button to the right
        backgroundColor: 'red',
        padding: 16,
    },
});