#include <WiFi.h>
#include <FirebaseESP32.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>

// Wi-Fi Configuration
#define WIFI_SSID "your-wifi-ssid"          
#define WIFI_PASSWORD "your-wifi-password"  

// Firebase Configuration
#define FIREBASE_URL "your-firebase-url/"
#define FIREBASE_AUTH "your-firebase-secret-key"

FirebaseData firebaseData;  // Object for communicating with Firebase
FirebaseConfig config;      // Firebase configuration
FirebaseAuth auth;          // Firebase authentication

Servo myServo;              // Servo object

// Pins and Variables
const int servoPin = 25;     // GPIO connected to the servo
int currentState = -1;       // Current motor state (0=off, 1=on)

// NTP for current time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 3600); // UTC+1

// Firebase Variables
String activationTime = "";
String deactivationTime = "";
int manual = 0;

void setup() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Firebase configuration
  config.host = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Servo configuration
  myServo.attach(servoPin);
  myServo.write(0); // Initial position
  currentState = 0;

  // NTP initialization
  timeClient.begin();
}

void loop() {
  timeClient.update();
  String currentTime = timeClient.getFormattedTime().substring(0, 5); // Current time in HH:MM format

  // Read variables from Firebase
  readFirebase();

  // Manual control
  if (manual == 1) {
    setMotorState(0); // Manual deactivation
  } else if (manual == 2) {
    setMotorState(1); // Manual activation
  } else {
    // Time-based control with handling for crossing midnight
    if (activationTime <= deactivationTime) { // Case 1: Same day
      if (currentTime >= activationTime && currentTime < deactivationTime) {
        setMotorState(1); // Activate
      } else {
        setMotorState(0); // Deactivate
      }
    } else { // Case 2: Crosses midnight
      if (currentTime >= activationTime || currentTime < deactivationTime) {
        setMotorState(1); // Activate
      } else {
        setMotorState(0); // Deactivate
      }
    }
  }

  delay(1000); // Check every second
}

// Function to read values from Firebase
void readFirebase() {
  // Read activationTime
  if (Firebase.getString(firebaseData, "/activationTime")) {
    activationTime = firebaseData.stringData();
  }

  // Read deactivationTime
  if (Firebase.getString(firebaseData, "/deactivationTime")) {
    deactivationTime = firebaseData.stringData();
  }

  // Read manual control value
  if (Firebase.getInt(firebaseData, "/manual")) {
    manual = firebaseData.intData();
  }
}

// Function to control the motor and update the state in Firebase
void setMotorState(int newState) {
  if (newState != currentState) { // Avoid unnecessary updates
    if (newState == 1) {
      myServo.write(180); // Activate: rotate to 180°
    } else {
      myServo.write(0); // Deactivate: rotate to 0°
    }

    // Update the state in Firebase
    Firebase.setInt(firebaseData, "/state", newState);
    currentState = newState; // Update the current state
  }
}
