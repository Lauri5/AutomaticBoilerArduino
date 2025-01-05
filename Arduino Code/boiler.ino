#include <WiFi.h>
#include <FirebaseESP32.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <time.h>

// Wi-Fi Configuration
#define WIFI_SSID "your-wifi-ssid"          
#define WIFI_PASSWORD "your-wifi-password"  

// Firebase Configuration
#define FIREBASE_HOST "your-firebase-url/"
#define FIREBASE_AUTH "your-firebase-secret-key"

FirebaseData firebaseData;  // Object for communicating with Firebase
FirebaseConfig config;      // Firebase configuration
FirebaseAuth auth;          // Firebase authentication

Servo myServo;              // Servo object

// Pins and Variables
const int servoPin = 25;     // GPIO connected to the servo
int currentState = -1;       // Current motor state (0=off, 1=on)
int manual = 0;

// NTP for current time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 3600); // UTC+1

// Firebase Variables per day
String activationTime1 = "";
String deactivationTime1 = "";
String activationTime2 = "";
String deactivationTime2 = "";
String currentDay = "Monday"; // Current day

// Variables for periodic reading
unsigned long previousMillis = 0;
const long interval = 60000; // 1 minute

// Function to calculate the day of the week
String getDayOfWeek(time_t epochTime) {
  // tm is a structure defined in time.h
  struct tm * timeInfo = localtime(&epochTime);
  int wday = timeInfo->tm_wday; // tm_wday: days since Sunday (0-6)
  switch(wday){
    case 0: return "Sunday";
    case 1: return "Monday";
    case 2: return "Tuesday";
    case 3: return "Wednesday";
    case 4: return "Thursday";
    case 5: return "Friday";
    case 6: return "Saturday";
    default: return "Monday"; // Default
  }
}

void setup() {
  Serial.begin(115200); // For debugging
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print("."); // Connection feedback
  }
  Serial.println("\nWiFi connected.");

  // Firebase configuration
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Servo configuration
  myServo.attach(servoPin);
  myServo.write(0); // Initial position
  currentState = 0;

  // NTP initialization
  timeClient.begin();
  timeClient.setTimeOffset(3600); // UTC+1

  // Synchronize initial time
  while(!timeClient.update()) {
    timeClient.forceUpdate();
  }
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    timeClient.update();
    unsigned long epochTime = timeClient.getEpochTime();
    String currentTime = timeClient.getFormattedTime().substring(0, 5); // Current time in HH:MM format
    String day = getDayOfWeek(epochTime); // Get the day of the week

    Serial.print("Current Day: ");
    Serial.println(day);
    Serial.print("Current Time: ");
    Serial.println(currentTime);

    // Read variables from Firebase
    readFirebase(day);

    currentDay = day; // Update the current day
  }

  // Manual control
  if (manual == 1) {
    setMotorState(0); // Manual deactivation
  } else if (manual == 2) {
    setMotorState(1); // Manual activation
  } else {
    // Time-based control with handling for multiple intervals
    bool isActive = false;

    // First interval
    if (activationTime1 != "" && deactivationTime1 != "") {
      if (activationTime1 <= deactivationTime1) { // Case 1: Same day
        if (timeClient.getFormattedTime().substring(0, 5) >= activationTime1 && timeClient.getFormattedTime().substring(0, 5) < deactivationTime1) {
          isActive = true;
        }
      } else { // Case 2: Crosses midnight
        if (timeClient.getFormattedTime().substring(0, 5) >= activationTime1 || timeClient.getFormattedTime().substring(0, 5) < deactivationTime1) {
          isActive = true;
        }
      }
    }

    // Second interval
    if (activationTime2 != "" && deactivationTime2 != "") { // Check if they have been set
      if (activationTime2 <= deactivationTime2) { // Case 1: Same day
        if (timeClient.getFormattedTime().substring(0, 5) >= activationTime2 && timeClient.getFormattedTime().substring(0, 5) < deactivationTime2) {
          isActive = true;
        }
      } else { // Case 2: Crosses midnight
        if (timeClient.getFormattedTime().substring(0, 5) >= activationTime2 || timeClient.getFormattedTime().substring(0, 5) < deactivationTime2) {
          isActive = true;
        }
      }
    }

    if (isActive) {
      setMotorState(1); // Activate
    } else {
      setMotorState(0); // Deactivate
    }
  }

  delay(1000); // Check every second
}

// Function to read values from Firebase per day
void readFirebase(String day) {
  currentDay = day; // Update the current day

  // Path in the database for the current day
  String path = "/" + currentDay + "/";

  // Read activationTime1
  if (Firebase.getString(firebaseData, path + "activationTime1")) {
    activationTime1 = firebaseData.stringData();
    Serial.print("Activation Time 1 (" + currentDay + "): ");
    Serial.println(activationTime1);
  } else {
    activationTime1 = ""; // Reset if it does not exist
    Serial.println("Failed to get " + path + "activationTime1");
  }

  // Read deactivationTime1
  if (Firebase.getString(firebaseData, path + "deactivationTime1")) {
    deactivationTime1 = firebaseData.stringData();
    Serial.print("Deactivation Time 1 (" + currentDay + "): ");
    Serial.println(deactivationTime1);
  } else {
    deactivationTime1 = ""; // Reset if it does not exist
    Serial.println("Failed to get " + path + "deactivationTime1");
  }

  // Read activationTime2
  if (Firebase.getString(firebaseData, path + "activationTime2")) {
    activationTime2 = firebaseData.stringData();
    Serial.print("Activation Time 2 (" + currentDay + "): ");
    Serial.println(activationTime2);
  } else {
    activationTime2 = ""; // Reset if it does not exist
    Serial.println("No " + path + "activationTime2 found.");
  }

  // Read deactivationTime2
  if (Firebase.getString(firebaseData, path + "deactivationTime2")) {
    deactivationTime2 = firebaseData.stringData();
    Serial.print("Deactivation Time 2 (" + currentDay + "): ");
    Serial.println(deactivationTime2);
  } else {
    deactivationTime2 = ""; // Reset if it does not exist
    Serial.println("No " + path + "deactivationTime2 found.");
  }

  // Read manual control value (global)
  if (Firebase.getInt(firebaseData, "/manual")) {
    manual = firebaseData.intData();
    Serial.print("Manual: ");
    Serial.println(manual);
  } else {
    Serial.println("Failed to get /manual");
  }
}

// Function to control the motor and update the state in Firebase
void setMotorState(int newState) {
  if (newState != currentState) { // Avoid unnecessary updates
    if (newState == 0) {
      myServo.write(180); // Activate: rotate to 180°
      Serial.println("Motor Activated.");
    } else {
      myServo.write(0); // Deactivate: rotate to 0°
      Serial.println("Motor Deactivated.");
    }

    // Update the state in Firebase
    if (Firebase.setInt(firebaseData, "/state", newState)) {
      Serial.print("State set to: ");
      Serial.println(newState);
    } else {
      Serial.print("Failed to set state: ");
      Serial.println(firebaseData.errorReason());
    }

    currentState = newState; // Update the current state
  }
}
