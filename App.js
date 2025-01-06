import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { database, ref, update, onValue } from "./firebaseConfig";

export default function App() {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // State for time intervals of each day
  const [timeSettings, setTimeSettings] = useState({
    Monday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Tuesday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Wednesday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Thursday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Friday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Saturday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
    Sunday: {
      activationTime1: "",
      deactivationTime1: "",
      activationTime2: "",
      deactivationTime2: "",
    },
  });

  const [manual, setManual] = useState(0);
  const [state, setState] = useState(0);

  // Retrieve initial data from Firebase when the component mounts
  useEffect(() => {
    const dbRef = ref(database, "/");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Iterate over each day of the week
        const updatedTimeSettings = { ...timeSettings };
        daysOfWeek.forEach((day) => {
          if (data[day]) {
            updatedTimeSettings[day] = {
              activationTime1: data[day].activationTime1 || "",
              deactivationTime1: data[day].deactivationTime1 || "",
              activationTime2: data[day].activationTime2 || "",
              deactivationTime2: data[day].deactivationTime2 || "",
            };
          }
        });
        setTimeSettings(updatedTimeSettings);
        setManual(data.manual || 0);
        setState(data.state || 0);
      }
    });

    // Clean up the event listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Function to update the settings of a specific day
  const updateTimeSetting = (day, field, value) => {
    setTimeSettings((prevSettings) => ({
      ...prevSettings,
      [day]: {
        ...prevSettings[day],
        [field]: value,
      },
    }));
  };

  // Validate the time format as HH:MM (00:00 - 23:59) and ensure it's not empty
  const isValidTime = (time) => {
    if (!time || time.trim() === "") {
      return false;
    }
    const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(time);
  };

  // Automatically format user input to HH:MM
  const formatTimeInput = (text, day, field) => {
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
    updateTimeSetting(day, field, formatted);
  };

  // Update activation and deactivation times in Firebase
  const updateTimes = () => {
    // Validate all times
    let allValid = true;
    daysOfWeek.forEach((day) => {
      const daySettings = timeSettings[day];
      ["activationTime1", "deactivationTime1", "activationTime2", "deactivationTime2"].forEach(
        (field) => {
          if (!isValidTime(daySettings[field])) {
            allValid = false;
          }
        }
      );
    });

    if (allValid) {
      const updates = {};
      daysOfWeek.forEach((day) => {
        updates[`${day}/activationTime1`] = timeSettings[day].activationTime1;
        updates[`${day}/deactivationTime1`] = timeSettings[day].deactivationTime1;
        updates[`${day}/activationTime2`] = timeSettings[day].activationTime2;
        updates[`${day}/deactivationTime2`] = timeSettings[day].deactivationTime2;
      });
      updates["manual"] = 0; // Reset manual mode to AUTO after updating times

      update(ref(database, "/"), updates)
        .then(() => {
          Keyboard.dismiss(); // Hide keyboard after submission
          alert("Times updated successfully!");
        })
        .catch((error) => {
          alert("Error updating times: " + error.message);
        });
    } else {
      alert("Please enter a valid time in HH:MM format (00:00 - 23:59) and ensure no fields are empty.");
    }
  };

  // Toggle manual mode between 1 (off) and 2 (on)
  const toggleSwitch = () => {
    const newManual = state === 0 ? 2 : 1;
    update(ref(database, "/"), { manual: newManual })
      .then(() => {
        alert("Mode updated successfully!");
      })
      .catch((error) => {
        alert("Error updating mode: " + error.message);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Smart Boiler</Text>

        {/* Section for time intervals of each day */}
        <ScrollView style={styles.daysContainer}>
          {daysOfWeek.map((day) => (
            <View key={day} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>{day}</Text>

              {/* Activation Time 1 */}
              <Text style={styles.label}>Activation 1</Text>
              <TextInput
                style={styles.input}
                value={timeSettings[day].activationTime1}
                onChangeText={(text) => formatTimeInput(text, day, "activationTime1")}
                placeholder="HH:MM"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

              {/* Deactivation Time 1 */}
              <Text style={styles.label}>Deactivation 1</Text>
              <TextInput
                style={styles.input}
                value={timeSettings[day].deactivationTime1}
                onChangeText={(text) => formatTimeInput(text, day, "deactivationTime1")}
                placeholder="HH:MM"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

              {/* Activation Time 2 */}
              <Text style={styles.label}>Activation 2</Text>
              <TextInput
                style={styles.input}
                value={timeSettings[day].activationTime2}
                onChangeText={(text) => formatTimeInput(text, day, "activationTime2")}
                placeholder="HH:MM"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

              {/* Deactivation Time 2 */}
              <Text style={styles.label}>Deactivation 2</Text>
              <TextInput
                style={styles.input}
                value={timeSettings[day].deactivationTime2}
                onChangeText={(text) => formatTimeInput(text, day, "deactivationTime2")}
                placeholder="HH:MM"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

              <View style={styles.separator} />
            </View>
          ))}
        </ScrollView>

        {/* Button to update times */}
        <TouchableOpacity style={styles.button} onPress={updateTimes}>
          <Text style={styles.buttonText}>Update Times</Text>
        </TouchableOpacity>

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
          <Text style={styles.switchButtonText}>Change Mode</Text>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 20,
  },
  daysContainer: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#2e2e2e",
    borderRadius: 10,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
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
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
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
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#555",
    marginTop: 10,
  },
});
