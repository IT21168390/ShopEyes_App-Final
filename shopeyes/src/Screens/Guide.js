import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Voice from '@react-native-community/voice';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Tts from 'react-native-tts';
//import { DeviceEventEmitter } from 'react-native';
import { accelerometer } from 'react-native-sensors';
import { throttle, filter, debounceTime, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

function Guide() {
    const navigation = useNavigation();

    const [messages, setMessages] = useState("");
    const [recording, setRecording] = useState(false);
    const [speaking, setSpeaking] = useState(true);
    const [result, setResult] = useState('');

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

        if (text.toLowerCase() === "regular" || text.toLowerCase() === "instant" || text.toLowerCase() === "instant shopping" || text.toLowerCase() === "favourites" || text.toLowerCase() === "favorite" || text.toLowerCase() === "regular shopping") {
            navigation.navigate('Regular Shopping');
        }
        else if (text.toLowerCase() === "shopping") {
            navigation.navigate('Create Item List');
        }
        else if (text.toLowerCase() === "home" || text.toLowerCase() === "home page" || text.toLowerCase() === "go back") {
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

    function shoppingGuide() {
        Tts.stop(true);
        Tts.speak("You can add items to a list or shopping cart by saying its name. Item quantity in cart can be changed by saying the item name with 'Quantity' keyword and quantity.");
    }

    function otherInstructions() {
        Tts.stop(true);
        Tts.speak("You can download a report by giving the voice command as Download Report, Download PDF, or Save Report. Saved shopping lists can be accessed by shaking your mobile device anytime.");
    }

    useFocusEffect(
        useCallback(() => {
            setRecording(false);

            //addSampleDataToRealtimeDatabase();

            const shakeSubject$ = new Subject();

            Voice.onSpeechStart = speechStartHandler;
            Voice.onSpeechEnd = speechEndHandler;
            Voice.onSpeechResults = speechResultsHandler;
            Voice.onSpeechError = speechErrorHandler;

            // Initialize TTS engine
            Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
            Tts.setDefaultRate(0.45); // Set the speech rate (0.5 is half the normal speed)

            // Subscribe to accelerometer data and filter for shakes
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
            };
        }, [navigation])
    );

    return (
        <View style={styles.container}>

            {/* Tile Buttons Row 1 */}
            <View style={styles.tileRow}>
                {/* Button 1: Add Icon */}
                <TouchableOpacity style={styles.tileButton} onPress={() => shoppingGuide()}>
                    <Icon name="cart-plus" size={64} color="yellow" />
                    <Text style={styles.tileButtonText}>SHOPPING GUIDE</Text>
                </TouchableOpacity>
            </View>

            {/* Tile Buttons Row 2 */}
            <View style={styles.tileRow}>
                {/* Button 3: Customize this button */ }{/* gear / cog */}
                <TouchableOpacity style={styles.tileButton} onPress={() => otherInstructions()}>
                    <Icon name="lightbulb" cog size={64} color="yellow" />
                    <Text style={styles.tileButtonText}>OTHER INSTRUCTIONS</Text>
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
        padding: 30, //16
        width: '100%', // Two buttons in a row
        height: '100%'
    },
    tileButtonText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
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

export default Guide;