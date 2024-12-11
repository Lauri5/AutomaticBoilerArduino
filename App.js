import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, } from "react-native";
import { database, ref, update, onValue } from "./firebaseConfig";

export default function App() {
  // State variables for time inputs, current Firebase values, manual mode, and motor state
  const [activationTime, setActivationTime] = useState("");
  const [deactivationTime, setDeactivationTime] = useState("");
  const [currentActivationTime, setCurrentActivationTime] = useState("");
  const [currentDeactivationTime, setCurrentDeactivationTime] = useState("");
  const [manual, setManual] = useState(0);
  const [state, setState] = useState(0);

  // Fetch initial data from Firebase on component mount
  useEffect(() => {
    const dbRef = ref(database, "/");
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentActivationTime(data.activationTime);
        setCurrentDeactivationTime(data.deactivationTime);
        setManual(data.manual);
        setState(data.state);
      }
    });
  }, []);

  // Update activation and deactivation times in Firebase
  const updateTimes = () => {
    if (isValidTime(activationTime) && isValidTime(deactivationTime)) {
      update(ref(database, "/"), {
        activationTime: activationTime,
        deactivationTime: deactivationTime,
        manual: 0, // Reset manual mode to AUTO after updating times
      });
      Keyboard.dismiss(); // Dismiss the keyboard after submission
    } else {
      alert("Please enter a valid time in HH:MM format (00:00 - 23:59).");
    }
  };

  // Toggle manual mode between 1 (deactivated) and 2 (activated)
  const toggleSwitch = () => {
    const newManual = state === 0 ? 2 : 1;
    update(ref(database, "/"), { manual: newManual });
  };

  // Format user input to HH:MM format automatically
  const formatTimeInput = (text, setter) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, "");

    // Add colon for HH:MM format
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = cleaned.slice(0, 2) + ":" + cleaned.slice(2, 4);
    }

    // Limit input to 5 characters
    if (formatted.length > 5) formatted = formatted.slice(0, 5);

    // Set the formatted value
    setter(formatted);
  };

  // Validate time format as HH:MM (00:00 - 23:59)
  const isValidTime = (time) => {
    const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(time);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Boiler Smart</Text>

        {/* Input fields for activation and deactivation times */}
        <View style={styles.timeContainer}>
          {/* Row for Activation Time */}
          <View style={styles.timeRow}>
            <Text style={styles.label}>Activation Time</Text>
            <Text style={styles.currentTimeText}>
              {currentActivationTime || "Not Set"}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={activationTime}
            onChangeText={(text) => formatTimeInput(text, setActivationTime)}
            placeholder="HH:MM"
            placeholderTextColor="#888"
            keyboardType="numeric" // Use numeric keyboard
          />

          {/* Row for Deactivation Time */}
          <View style={styles.timeRow}>
            <Text style={styles.label}>Deactivation Time</Text>
            <Text style={styles.currentTimeText}>
              {currentDeactivationTime || "Not Set"}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={deactivationTime}
            onChangeText={(text) => formatTimeInput(text, setDeactivationTime)}
            placeholder="HH:MM"
            placeholderTextColor="#888"
            keyboardType="numeric" // Use numeric keyboard
          />

          {/* Button to update times */}
          <TouchableOpacity style={styles.button} onPress={updateTimes}>
            <Text style={styles.buttonText}>Update Times</Text>
          </TouchableOpacity>
        </View>

        {/* Display current state and mode */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            State:{" "}
            <Text style={{ color: state === 1 ? "#ff5555" : "#aaa" }}>
              {state === 1 ? "ON" : "OFF"}
            </Text>
          </Text>
          <Text style={styles.statusText}>
            Mode:{" "}
            <Text style={{ color: manual === 0 ? "#ff5555" : "#aaa" }}>
              {manual === 0 ? "AUTO" : "MANUAL"}
            </Text>
          </Text>
        </View>

        {/* Button to toggle between manual ON/OFF */}
        <TouchableOpacity style={styles.switchButton} onPress={toggleSwitch}>
          <Text style={styles.switchButtonText}>Switch</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 20,
  },
  timeContainer: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  label: {
    color: "#fff",
    fontSize: 16,
  },
  currentTimeText: {
    color: "#ff8888",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#555",
  },
  button: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  switchButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});