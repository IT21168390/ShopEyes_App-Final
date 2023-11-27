import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Voice from '@react-native-community/voice';
import Tts from 'react-native-tts';
import { accelerometer } from 'react-native-sensors';
import { throttle, filter, debounceTime, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { ref, get } from 'firebase/database';
import db from '../../Firebase/FirebaseRTD';

export default function ContactSupport() {

    const navigation = useNavigation();

    const [messages, setMessages] = useState("");
    const [recording, setRecording] = useState(false);
    const [speaking, setSpeaking] = useState(true);
    const [result, setResult] = useState('');

    const [phoneNumbers, setPhoneNumbers] = useState([]);

    const numbersRef = ref(db, '/contacts');

    function contactsFetch() {
        get(numbersRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // The data exists, and you can access it using snapshot.val()
                    const data = snapshot.val();
                    setPhoneNumbers(data.contactDetails);
                    console.log('Numbers: ' + data);
                } else {
                    console.log("No contacts available");
                }
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }

    const dialPhoneNumber = (number) => {
        const phoneNumber = number; // Replace with the phone number you want to call
        Linking.openURL(`tel:${phoneNumber}`);
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

        if (text.toLowerCase() === "option 1" || text.toLowerCase() === "option 01" || text.toLowerCase() === "option one") {
            dialPhoneNumber(phoneNumbers[0]);
        }
        else if (text.toLowerCase() === "option 2" || text.toLowerCase() === "option 02" || text.toLowerCase() === "option two") {
            dialPhoneNumber(phoneNumbers[1]);
        }
        else if (text.toLowerCase() === "regular" || text.toLowerCase() === "instant" || text.toLowerCase() === "instant shopping" || text.toLowerCase() === "favourites" || text.toLowerCase() === "favorite" || text.toLowerCase() === "regular shopping") {
            navigation.navigate('Regular Shopping');
        }
        else if (text.toLowerCase() === "shopping") {
            navigation.navigate('Create Item List');
        }
        else if (text.toLowerCase() === "return" || text.toLowerCase() === "go back" || text.toLowerCase() === "home page") {
            navigation.navigate('Home');
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

    // useEffect(() => {
    //     getData();

    //   }, [])

    useFocusEffect(
        useCallback(() => {

            contactsFetch();

            Voice.onSpeechStart = speechStartHandler;
            Voice.onSpeechEnd = speechEndHandler;
            Voice.onSpeechResults = speechResultsHandler;
            Voice.onSpeechError = speechErrorHandler;

            // Initialize TTS engine
            Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
            Tts.setDefaultRate(0.45); // Set the speech rate (0.5 is half the normal speed)

            Tts.speak('Please choose Option 1 or Option 2 to get assistance');

            return () => {
                // Do something when the screen is unfocused
                Voice.destroy().then(Voice.removeAllListeners);
                // Useful for cleanup functions
                Tts.stop(true);
            };
        }, [])
    );

    return (
        <View style={styles.container}>

            {/* Tile Buttons Row 1 */}
            <View style={styles.tileRow}>
                {/* Button 1: Add Icon */}
                <TouchableOpacity style={styles.tileButton} onPress={() => dialPhoneNumber(phoneNumbers[0])}>
                    <Text style={styles.optionText}>OPTION 1</Text>
                    <Icon name="phone" size={88} color="yellow" />
                    <Text style={styles.tileButtonText}>{phoneNumbers[0]}</Text>
                </TouchableOpacity>

                {/* Button 2: Star Icon */}
                <TouchableOpacity style={styles.tileButton} onPress={() => dialPhoneNumber(phoneNumbers[1])}>
                    <Text style={styles.optionText}>OPTION 2</Text>
                    <Icon name="phone" size={88} color="yellow" />
                    <Text style={styles.tileButtonText}>{phoneNumbers[1]}</Text>
                </TouchableOpacity>
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
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 40,
    },


    tileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    tileButton: {
        backgroundColor: 'purple',
        alignItems: 'center',
        borderRadius: 8,
        padding: 15, //16
        width: '48%', // Two buttons in a row
        //height: '150%',
    },
    tileButtonText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 75,
        textAlign: 'center'
    },
    optionText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 50,
        textAlign: 'center'
    },

    addListButton: {
        backgroundColor: 'blue',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    addListButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
});