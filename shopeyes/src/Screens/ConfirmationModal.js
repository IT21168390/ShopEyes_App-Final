import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

import Tts from 'react-native-tts';

const ConfirmationModal = ({ visible, onConfirm, onCancel }) => {
    const confirmationText = "Are you sure you want to delete this?";

    const speak = () => {
        // Use TTS to speak the text
        Tts.speak(confirmationText);
    };

    useEffect(() => {
        // Initialize TTS engine
        Tts.setDefaultLanguage('en-US'); // Set the default language (you can change this)
        Tts.setDefaultRate(0.5); // Set the speech rate (0.5 is half the normal speed)

        // Add event listeners for TTS events (optional)
        Tts.addEventListener('tts-start', () => console.log('TTS started'));
        Tts.addEventListener('tts-finish', () => console.log('TTS finished'));
        Tts.addEventListener('tts-cancel', () => console.log('TTS canceled'));

        speak();

        return () => {

        };

    }, [])

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={{ color: 'white', fontSize: 40, fontWeight: 'bold', textAlign: 'center' }}>{confirmationText}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={onConfirm} style={styles.confirmButton}>
                            <Text style={{ color: 'white', fontSize: 40, fontWeight: 'bold' }}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                            <Text style={{ color: 'black', fontSize: 40, fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'black',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 10,
    },
    confirmButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 10,
        marginTop: 30,

        marginRight: 10,
    },
    cancelButton: {
        backgroundColor: 'white',
        padding: 10,
        marginTop: 30,
        borderRadius: 10,

        marginLeft: 10,
    },
});

export default ConfirmationModal;