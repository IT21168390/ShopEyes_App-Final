import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Vibration } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import Voice from '@react-native-community/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

import Tts from 'react-native-tts';

import { useNavigation } from '@react-navigation/native';

import ConfirmationModal from '../../Screens/ConfirmationModal';

import { getDatabase, ref, push, get } from 'firebase/database';
import db from '../../../Firebase/FirebaseRTD';

export default function InstantListView() {
    const navigation = useNavigation();

    const route = useRoute();
    const { id } = route.params;

    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState('');

    const [shopData, setShopData] = useState([]);

    const [selectedList, setSelectedList] = useState([]);
    const [shoppingListName, setShoppingListName] = useState();
    const [existingListNames, setExistingListNames] = useState([]);

    const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [selectedItemToDelete, setSelectedItemToDelete] = useState(null);

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

        console.log(existingListNames);
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

    const addItemToList = (itemName) => {
        setSelectedList((prevList) => {
            const updatedList = [...prevList, toPascalCase(itemName)];
            saveShoppingList(updatedList); // Update the state and AsyncStorage
            return updatedList;
        });
        Tts.speak(itemName + " Successfully added to the list.");
    };


    function toPascalCase(str) {
        if (!str) {
            return ""; // or handle it in a way that makes sense for your use case
        }
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


    const saveShoppingList = async (updatedList) => {
        try {
            const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
            const parsedLists = existingLists ? JSON.parse(existingLists) : [];

            // Find the index of the list to update, if it exists
            const listIndex = parsedLists.findIndex((list) => list.id === id);

            // If the list exists, update it; otherwise, add a new one
            if (listIndex !== -1) {
                parsedLists[listIndex].items = updatedList;
                await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));
            }

            //await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));
            console.log('Success: List updated');
            //Vibration.vibrate(500);
            const doublePulse = [100, 200, 200, 200];
            Vibration.vibrate(doublePulse);
        } catch (e) {
            console.error('Error saving shopping list:', e);
        }

    };

    const saveNewListName = async (newName) => {
        try {
            const existingLists = await AsyncStorage.getItem('RegularBuyingLists');
            const parsedLists = existingLists ? JSON.parse(existingLists) : [];

            // Find the index of the list to update, if it exists
            const listIndex = parsedLists.findIndex((list) => list.id === id);

            // If the list exists, update it; otherwise, add a new one
            if (listIndex !== -1) {
                parsedLists[listIndex].name = newName;
                console.log('Name update');
                await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));
            }

            //await AsyncStorage.setItem('RegularBuyingLists', JSON.stringify(parsedLists));
            console.log('Success: List name updated');
            //Vibration.vibrate(300);
            const doublePulse = [100, 200, 200, 200];
            Vibration.vibrate(doublePulse);
        } catch (e) {
            console.error('Error saving shopping list name:', e);
        }
    };


    // Function to delete an item from the list
    const onDeleteItem = (itemToDelete) => {
        setSelectedItemToDelete(itemToDelete);
        setConfirmationModalVisible(true);
    };

    // Function to confirm item deletion
    const confirmDeleteItem = async (itemToRemove) => {
        const itemToDelete = toPascalCase(itemToRemove);
        try {
            const jsonValue = await AsyncStorage.getItem('RegularBuyingLists');
            if (jsonValue !== null) {
                const parsedData = JSON.parse(jsonValue);
                // Find the list with the matching id
                const list = parsedData.find((item) => item.id === id);
                if (list) {
                    const updatedList = list.items.filter((item) => item !== itemToDelete);
                    setSelectedList(updatedList);
                    saveShoppingList(updatedList);
                }
            }
        } catch (e) {
            console.error('Error loading shopping lists:', e);
        }
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

    const speechResultsHandler = (e) => {
        console.log("Speech event: ", e);
        const text = e.value[0];
        setResult(text);

        if (text.toLowerCase() === "new" || text.toLowerCase() === "add list" || text.toLowerCase() === "new list" || text.toLowerCase() === "create list") {
            setRecording(false);
            navigation.navigate('Create Regular List');
        }
        else if (text.toLowerCase() === "regular shopping" || text.toLowerCase() === "go back" || text.toLowerCase() === "return" || text.toLowerCase() === "exit") {
            setRecording(false);
            navigation.navigate('Regular Shopping');
        }
        else if (text.toLowerCase() === "home" || text.toLowerCase() === "home page") {
            setRecording(false);
            navigation.navigate('Home');
        }
        else if (text.toLowerCase() === "shopping cart" || text.toLowerCase() === "shopping page") {
            setRecording(false);
            navigation.navigate('Create Item List');
        }

        else if (text.toLowerCase().startsWith("add ")) {
            const itemToAdd = text.substring(4); // Extract the item name from the command
            const foundItem = checkForMatch(itemToAdd, shopData);
            if (foundItem) {
                addItemToList(foundItem); // Add the voice input to the shopping list
            }
            else {
                Tts.speak(`${itemToAdd} Not found!`);
            }
            //addItemToList(itemToAdd);
        } else if (text.toLowerCase().startsWith("insert ")) {
            const itemToAdd = text.substring(7); // Extract the item name from the command
            const foundItem = checkForMatch(itemToAdd, shopData);
            if (foundItem) {
                addItemToList(foundItem); // Add the voice input to the shopping list
            }
            else {
                Tts.speak(`${itemToAdd} Not found!`);
            }
            //addItemToList(itemToAdd);
        } else if (text.toLowerCase().startsWith("remove ") || text.toLowerCase().startsWith("delete ")) {
            const itemToRemove = text.substring(7); // Extract the item name from the command
            setSelectedItemToDelete(itemToRemove);
            console.log(itemToRemove);
            confirmDeleteItem(itemToRemove);
        }
        else if (text.toLowerCase().startsWith("update name") || text.toLowerCase().startsWith("change name") || text.toLowerCase().startsWith("set name") || text.toLowerCase().startsWith("list name") || text.toLowerCase().startsWith("shopping list name") || text.toLowerCase().startsWith("new name")) {
            const listCommands = [
                "update name",
                "change name",
                "set name",
                "list name",
                "shopping list name",
                "new name"
            ];
            const listCommandMatch = listCommands.find(command => text.toLowerCase().startsWith(command));
            const extractedPhrase = text.toLowerCase().substring(listCommandMatch.length).trim();

            if (extractedPhrase === '' || extractedPhrase === null) {
                Tts.speak('Name not recognized');
                return;
            }

            console.log("Extracted Phrase: ", extractedPhrase);

            //for (let index = 0; index < existingListNames.length; index++) {
            const withDigits = convertTextToNumber(extractedPhrase);
            const onlyTexts = convertStringToText(extractedPhrase);
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
                setShoppingListName(toPascalCase(withDigits));
                saveNewListName(toPascalCase(withDigits));
                Tts.speak(`${extractedPhrase} is set as the new name of the list.`);
                //const triplePulse = [100, 300, 300, 300];
                //Vibration.vibrate(triplePulse);
            }
            else {
                Tts.speak(`Sorry, a list named ${extractedPhrase} already exists!`);
            }
            //Vibration.vibrate(400);

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


    useEffect(() => {
        dataFetch();
        listNamesFetch();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchListById = async (listId) => {
                try {
                    const jsonValue = await AsyncStorage.getItem('RegularBuyingLists');
                    if (jsonValue !== null) {
                        const parsedData = JSON.parse(jsonValue);
                        // Find the list with the matching id
                        const list = parsedData.find((item) => item.id === listId);
                        if (list) {
                            setShoppingListName(list.name);
                            // Set the items of the found list to state
                            setSelectedList(list.items);
                        }
                    }
                } catch (e) {
                    console.error('Error loading shopping lists:', e);
                }
            };
            // Call the function to fetch the list based on the id
            fetchListById(id);

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
                Tts.stop(true);
            };
        }, [id, shopData, existingListNames])
    );



    return (

        <View style={styles.container}>

            <TouchableOpacity style={styles.addListButton}>
                <Text style={styles.addListButtonText}>{shoppingListName}</Text>
            </TouchableOpacity>

            <ScrollView style={{ marginBottom: 275 }}>
                <View style={styles.cardListView}>
                    {selectedList.map((item, index) => (
                        <Card style={styles.card} key={index}>
                            <Card.Content>
                                <Text style={styles.cardText}>{item}</Text>
                                {/* Add any other card content or actions you need */}
                            </Card.Content>
                        </Card>
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
                        <TouchableOpacity style={styles.microphoneButton} onPress={startRecordingMain}>
                            <Icon name="microphone" size={150} color="white" style={styles.icon} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

        </View>
    );
}


// Get the screen width
const screenWidth = Dimensions.get('window').width;

// Calculate the desired padding as a percentage of the screen width
const paddingPercentage = 10; // Adjust this value as needed
const paddingHorizontal = (screenWidth * paddingPercentage) / 100;

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
        color: 'white',
        fontSize: 30, //16
        fontWeight: 'bold',
    },
    cardListView: {
        marginTop: 16,
        textAlign: 'center'
    },
    card: {
        backgroundColor: 'blue',//'#e3e3e3',
        padding: 5,
        borderRadius: 8,
        marginBottom: 16,

        //flexDirection: 'row', // Align text and delete button horizontally
        alignItems: 'center', // Center items vertically
    },
    cardText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 25,
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