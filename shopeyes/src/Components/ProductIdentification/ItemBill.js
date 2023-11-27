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
import {useRoute} from '@react-navigation/native';

import ConfirmationModal from '../../Screens/ConfirmationModal';

export default function Bill() {
    const navigation = useNavigation();
    const route = useRoute();
    const {items} = route.params;
    console.log(items);

    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState('');

    const [shoppingList, setShoppingList] = useState([]);

   const [totalBill, setTotalBill] = useState(0);


   function calculateTotal() {
    let val = 0;
    items.forEach(element => {
        val = val+element[1];
    });
    setTotalBill(val);
   }

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


    const generatePDFReport = async () => {
        const imagePath = 'https://i.imgur.com/lxK9HEO.png';
    
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
          <h1>BILL</h1></center>
          <table>
            <tr>
              <th>#</th>
              <th><center>Item Name</center></th>
              <th><center>Price</center></th>
            </tr>
          `;
    
        // Loop through shoppingLists to generate table rows
        items.forEach((item, index) => {
          // Convert list.id (timestamp) to Date object
          
          htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td><b>${item[0]}</b></td>
          <td><center>${item[1]}</center></td>
          
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
    
        const pdfFileName = `ShopEyes-BILL_${Date.now()}.pdf`;
        const downloadsPath = RNFS.DownloadDirectoryPath; // Get the default Downloads directory
    
        const pdfFilePath = `${downloadsPath}/${pdfFileName}`;
    
        const pdfInfo = {
          html: htmlContent,
          fileName: `ShopEyes-Shopping Cart_${Date.now()}`,
          directory: '',
        };
    
        try {
          /*const pdfFilePath = await RNHTMLtoPDF.convert(pdfInfo);
          console.log('PDF Report Generated: ', pdfFilePath);*/
          const generatedPDF = await RNHTMLtoPDF.convert(pdfInfo);
          console.log('PDF Report Generated: ', generatedPDF.filePath);
          // Move the generated PDF to the Downloads directory
          await RNFS.moveFile(generatedPDF.filePath, pdfFilePath);
        } catch (error) {
          console.error('Error Generating PDF Report: ', error);
        }
      };


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

        console.log("Speech end handler");
    }
    const speechResultsHandler = async (e) => {
        console.log("Speech event: ", e);
        
        const text = e.value[0];
        setResult(text);
        if (text.toLowerCase() === "return" || text.toLowerCase() === "go back" || text.toLowerCase() === "exit") {
            setRecording(false);
            navigation.navigate('Home');
        }
        else if (text.toLowerCase() === "download" || text.toLowerCase() === "generate report" || text.toLowerCase() === "generate pdf" || text.toLowerCase() === "download pdf" || text.toLowerCase() === "download report") {
            setRecording(false);
            generatePDFReport();
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


    useEffect(() => {
        calculateTotal();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Load the saved shopping list when the component mounts



            Voice.onSpeechStart = speechStartHandler;
            Voice.onSpeechEnd = speechEndHandler;
            Voice.onSpeechResults = speechResultsHandler;
            Voice.onSpeechError = speechErrorHandler;

            // Initialize TTS engine
            Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
            Tts.setDefaultRate(0.45); // Set the speech rate (0.5 is half the normal speed)

            return () => {
                Voice.destroy().then(Voice.removeAllListeners);
                Tts.stop(true);
            }
        }, [totalBill])
    );

    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.createListButton} >
                <Text style={styles.createListButtonText}>Bill</Text>
            </TouchableOpacity>

            <ScrollView>
                <View style={styles.cardListView}>
                    {items.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 25 }}>{item[0]}</Text>

                            <TouchableOpacity style={styles.deleteButton} >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{item[1]}</Text>
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

            <View style={{ marginBottom: 275, alignSelf:'center' }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 25 }}>Total = Rs.{totalBill}</Text>
            </View>

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
        width: 50,
        height: 50,
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