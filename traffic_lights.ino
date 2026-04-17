#include <Servo.h>

// ================= TRAFFIC LIGHT PINS =================

// NORTH 
#define RED1  2
#define YELLOW1  3
#define GREEN1   4

// SOUTH
#define RED2     7
#define YELLOW2  6
#define GREEN2   5

// EAST
#define RED3     8
#define YELLOW3  9
#define GREEN3   10

// WEST
#define RED4     11
#define YELLOW4  12
#define GREEN4   13

// ================= SERVO CONFIG =================
Servo barrierServo1;
Servo barrierServo2;

#define SERVO1_PIN A5
#define SERVO2_PIN A1

// ================= LDR + LED =================
#define LDR_PIN A3
#define LED_PIN A4
int ldrValue = 0;
int threshold = 500;

// ================= BUZZER =================
#define BUZZER_PIN A2
bool buzzerActive = false;
int buzzerFreq = 800;
bool buzzerUp = true;
unsigned long lastBuzzerUpdate = 0;

// ================= STATE =================
String currentSignal = "RED";

// ================= SETUP =================
void setup() {
  Serial.begin(9600);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // LED Pins
  pinMode(RED1, OUTPUT);     pinMode(YELLOW1, OUTPUT);     pinMode(GREEN1, OUTPUT);
  pinMode(RED2, OUTPUT);     pinMode(YELLOW2, OUTPUT);     pinMode(GREEN2, OUTPUT);
  pinMode(RED3, OUTPUT);     pinMode(YELLOW3, OUTPUT);     pinMode(GREEN3, OUTPUT);
  pinMode(RED4, OUTPUT);     pinMode(YELLOW4, OUTPUT);     pinMode(GREEN4, OUTPUT);

  // ===== SERVO INIT =====
  barrierServo1.attach(SERVO1_PIN);
  barrierServo2.attach(SERVO2_PIN);

  delay(500);

  barrierServo1.write(100);
  barrierServo2.write(0);

  delay(1000);
  barrierServo1.write(0);
  barrierServo2.write(90);
  delay(1000);
  barrierServo1.write(100);
  barrierServo2.write(0);

  setAllRed();

  Serial.println("Traffic Controller READY");
}

// ================= LOOP =================
void loop() {

  // ===== SERIAL COMMANDS =====
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length()) processCommand(cmd);
  }

  // ===== LDR =====
  ldrValue = analogRead(LDR_PIN);
  Serial.println(ldrValue);

  if (ldrValue < threshold)
    digitalWrite(LED_PIN, HIGH);
  else
    digitalWrite(LED_PIN, LOW);

  // ===== BUZZER SIREN =====
  handleEmergencyBuzzer();

  delay(50);
}

// ================= COMMAND HANDLER =================
void processCommand(String cmd) {

  // ===== SERVO + BUZZER =====
  if (cmd == "RED_SEQUENCE") {
    executeRedSequence();
    return;
  }

  if (cmd == "TRAFFIC_SEQ_T") {
    executeTrafficSeqT();
    return;
  }

  if (cmd == "OPEN_SERVOS") {
    barrierServo1.write(0);
    barrierServo2.write(90);
    buzzerActive = true;
    Serial.println("Servos OPEN - Emergency Mode");
    return;
  }

  if (cmd == "CLOSE_SERVOS") {
    barrierServo1.write(100);
    barrierServo2.write(0);
    buzzerActive = false;
    noTone(BUZZER_PIN);
    Serial.println("Servos CLOSED - Normal Mode");
    return;
  }

  if (cmd == currentSignal) return;

  if (currentSignal.indexOf("GREEN") >= 0) {
    handleYellowTransition(currentSignal);
    delay(1500);
    clearYellows();
  }

  currentSignal = cmd;

  if (cmd == "GREEN_NORTH")
    setLights(LOW,LOW,HIGH,  HIGH,LOW,LOW,  HIGH,LOW,LOW,  HIGH,LOW,LOW);

  else if (cmd == "GREEN_SOUTH")
    setLights(HIGH,LOW,LOW,  LOW,LOW,HIGH,  HIGH,LOW,LOW,  HIGH,LOW,LOW);

  else if (cmd == "GREEN_EAST")
    setLights(HIGH,LOW,LOW,  HIGH,LOW,LOW,  LOW,LOW,HIGH,  HIGH,LOW,LOW);

  else if (cmd == "GREEN_WEST")
    setLights(HIGH,LOW,LOW,  HIGH,LOW,LOW,  HIGH,LOW,LOW,  LOW,LOW,HIGH);

  else
    setAllRed();

  Serial.println("State: " + cmd);
}

// ================= RED SEQUENCE =================
void executeRedSequence() {
  Serial.println("Executing Red Sequence Parallel...");
  
  // Phase 1: All RED (0-8s)
  setAllRed();
  delay(8000);
  
  // Phase 2: N, S, E finished 8s RED -> Turn GREEN for 3s. West still RED.
  // setLights(N, S, E, W)
  setLights(LOW,LOW,HIGH,  LOW,LOW,HIGH,  LOW,LOW,HIGH,  HIGH,LOW,LOW);
  delay(3000);
  
  // Phase 3: N, S, E finished 3s GREEN -> Return to RED. West still RED (total 11s so far).
  setAllRed();
  delay(4000); // Wait until t=15s for West
  
  // Phase 4: West finished 15s RED -> Turn GREEN for 3s.
  setLights(HIGH,LOW,LOW,  HIGH,LOW,LOW,  HIGH,LOW,LOW,  LOW,LOW,HIGH);
  delay(3000);
  
  // Done - Transition back to AI
  setAllRed();
  while(Serial.available() > 0) Serial.read(); // Clear backlog
  currentSignal = "RED"; 
  Serial.println("Red Sequence Finished - AI resumed");
}

// ================= SEQUENCE T =================
void executeTrafficSeqT() {
  Serial.println("Executing Sequence T Parallel...");
  
  // Step 1: N/S GREEN (starts 16s), E/W RED (starts 4s)
  // setLights(N, S, E, W)
  setLights(LOW,LOW,HIGH,  LOW,LOW,HIGH,  HIGH,LOW,LOW,  HIGH,LOW,LOW);
  delay(4000); 
  
  // Step 2: E/W finished 4s RED -> Turn GREEN for 12s.
  // N/S continue GREEN (total 16s). All are GREEN now.
  setLights(LOW,LOW,HIGH,  LOW,LOW,HIGH,  LOW,LOW,HIGH,  LOW,LOW,HIGH);
  delay(12000);
  
  // Done - Transition back to AI
  setAllRed();
  while(Serial.available() > 0) Serial.read(); // Clear backlog
  currentSignal = "RED";
  Serial.println("Sequence T Finished - AI resumed");
}

// ================= EMERGENCY BUZZER =================
void handleEmergencyBuzzer() {
  if (!buzzerActive) return;

  if (millis() - lastBuzzerUpdate > 20) {
    lastBuzzerUpdate = millis();

    tone(BUZZER_PIN, buzzerFreq);

    if (buzzerUp) {
      buzzerFreq += 15;
      if (buzzerFreq >= 1400) buzzerUp = false;
    } else {
      buzzerFreq -= 15;
      if (buzzerFreq <= 800) buzzerUp = true;
    }
  }
}

// ================= HELPERS =================
void setLights(int r1,int y1,int g1,int r2,int y2,int g2,
               int r3,int y3,int g3,int r4,int y4,int g4) {
  digitalWrite(RED1,r1); digitalWrite(YELLOW1,y1); digitalWrite(GREEN1,g1);
  digitalWrite(RED2,r2); digitalWrite(YELLOW2,y2); digitalWrite(GREEN2,g2);
  digitalWrite(RED3,r3); digitalWrite(YELLOW3,y3); digitalWrite(GREEN3,g3);
  digitalWrite(RED4,r4); digitalWrite(YELLOW4,y4); digitalWrite(GREEN4,g4);
}

void setAllRed() {
  setLights(HIGH,LOW,LOW, HIGH,LOW,LOW, HIGH,LOW,LOW, HIGH,LOW,LOW);
}

void clearYellows() {
  digitalWrite(YELLOW1,LOW);
  digitalWrite(YELLOW2,LOW);
  digitalWrite(YELLOW3,LOW);
  digitalWrite(YELLOW4,LOW);
}

void handleYellowTransition(String s) {
  if (s == "GREEN_NORTH") { digitalWrite(GREEN1,LOW); digitalWrite(YELLOW1,HIGH); }
  if (s == "GREEN_SOUTH") { digitalWrite(GREEN2,LOW); digitalWrite(YELLOW2,HIGH); }
  if (s == "GREEN_EAST")  { digitalWrite(GREEN3,LOW); digitalWrite(YELLOW3,HIGH); }
  if (s == "GREEN_WEST")  { digitalWrite(GREEN4,LOW); digitalWrite(YELLOW4,HIGH); }
}
