# Boiler Smart Control System

A simple project to remotely control my boiler using:
- An ESP32 microcontroller with a servo motor.
- A React Native mobile app.
- Firebase for real-time data storage.

## How It Works
- **ESP32 & Servo**: The ESP32 reads times and commands from Firebase, then moves a servo to switch the boiler ON/OFF.
- **Scheduling**: Set `activationTime` and `deactivationTime` for automatic control.
- **Manual Override**: Switch to manual mode (ON or OFF) from the mobile app.
- **Real-Time Sync**: Changes made in the app update the ESP32 instantly via Firebase.

## Setup Steps
1. **Hardware**: Connect ESP32 to Wi-Fi, attach servo to GPIO pin (e.g., pin 25).
2. **Firebase**: Create a Firebase Realtime Database project. Get URL and secret/auth key.
3. **ESP32 Code**: Update Wi-Fi and Firebase details, upload the code.
4. **React Native App**: Update `firebaseConfig.js` with Firebase credentials and run `npm start`.

## Controls
- **AUTO (manual=0)**: Follow scheduled times.
- **MANUAL OFF (manual=1)**: Force OFF.
- **MANUAL ON (manual=2)**: Force ON.

Set times in `HH:MM` format for up to two time slots per day of the week. If `activationTime < deactivationTime`, boiler runs within that daily window. If `activationTime > deactivationTime`, it runs past midnight until the deactivation time.

## Troubleshooting
- Check Wi-Fi, Firebase credentials, and servo wiring.
- Ensure NTP time sync is correct for accurate scheduling.

## License
MIT License
