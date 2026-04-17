// Traffic Light Controller for 4 Modules (North, South, East, West)
// Receives commands from Python script via Serial (USB)

// Traffic Light 1 LED Pins (NORTH)
const int RED1 = 2;
const int YELLOW1 = 3;
const int GREEN1 = 4;

// Traffic Light 2 LED Pins (SOUTH)
const int RED2 = 5;
const int YELLOW2 = 6;
const int GREEN2 = 7;

// Traffic Light 3 LED Pins (EAST)
const int RED3 = 8;
const int YELLOW3 = 9;
const int GREEN3 = 10;

// Traffic Light 4 LED Pins (WEST)
const int RED4 = 11;
const int YELLOW4 = 12;
const int GREEN4 = 13;

String currentSignal = "RED"; // Initial state

void setup() {
  Serial.begin(9600);
  
  // Initialize all pins as OUTPUT
  pinMode(RED1, OUTPUT);
  pinMode(YELLOW1, OUTPUT);
  pinMode(GREEN1, OUTPUT);

  pinMode(RED2, OUTPUT);
  pinMode(YELLOW2, OUTPUT);
  pinMode(GREEN2, OUTPUT);

  pinMode(RED3, OUTPUT);
  pinMode(YELLOW3, OUTPUT);
  pinMode(GREEN3, OUTPUT);

  pinMode(RED4, OUTPUT);
  pinMode(YELLOW4, OUTPUT);
  pinMode(GREEN4, OUTPUT);

  // Start with All Red
  setAllRed();
  Serial.println("Traffic Controller Ready - 4 Modules");
}

void loop() {
  // Check for incoming serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // Remove whitespace/newlines
    
    if (command.length() > 0) {
      processCommand(command);
    }
  }
}

void processCommand(String cmd) {
  if (cmd == currentSignal) return; // No change needed
  
  // Safety Transition: Yellow light logic
  // If we are changing from a GREEN state to something else, show yellow first
  if (currentSignal.indexOf("GREEN") >= 0) {
    handleYellowTransition(currentSignal);
    delay(1500); // 1.5 seconds yellow for safety
    clearYellows();
  }
  
  currentSignal = cmd;
  
  // Apply the new signal state
  if (cmd == "GREEN_NORTH") {
    // North Green, others Red
    setLights(LOW, LOW, HIGH,  HIGH, LOW, LOW,  HIGH, LOW, LOW,  HIGH, LOW, LOW);
  }
  else if (cmd == "GREEN_SOUTH") {
    // South Green, others Red
    setLights(HIGH, LOW, LOW,  LOW, LOW, HIGH,  HIGH, LOW, LOW,  HIGH, LOW, LOW);
  }
  else if (cmd == "GREEN_EAST") {
    // East Green, others Red
    setLights(HIGH, LOW, LOW,  HIGH, LOW, LOW,  LOW, LOW, HIGH,  HIGH, LOW, LOW);
  }
  else if (cmd == "GREEN_WEST") {
    // West Green, others Red
    setLights(HIGH, LOW, LOW,  HIGH, LOW, LOW,  HIGH, LOW, LOW,  LOW, LOW, HIGH);
  }
  else if (cmd == "RED") {
    setAllRed();
  }
  else {
    // Default to RED for safety on unknown commands
    setAllRed();
    currentSignal = "RED";
  }
  
  Serial.print("State changed to: ");
  Serial.println(cmd);
}

// Helper to set all pins at once
// Order: North(R,Y,G), South(R,Y,G), East(R,Y,G), West(R,Y,G)
void setLights(int r1, int y1, int g1, int r2, int y2, int g2, int r3, int y3, int g3, int r4, int y4, int g4) {
  digitalWrite(RED1, r1);
  digitalWrite(YELLOW1, y1);
  digitalWrite(GREEN1, g1);
  
  digitalWrite(RED2, r2);
  digitalWrite(YELLOW2, y2);
  digitalWrite(GREEN2, g2);
  
  digitalWrite(RED3, r3);
  digitalWrite(YELLOW3, y3);
  digitalWrite(GREEN3, g3);

  digitalWrite(RED4, r4);
  digitalWrite(YELLOW4, y4);
  digitalWrite(GREEN4, g4);
}

void setAllRed() {
  setLights(HIGH, LOW, LOW, HIGH, LOW, LOW, HIGH, LOW, LOW, HIGH, LOW, LOW);
}

void clearYellows() {
  digitalWrite(YELLOW1, LOW);
  digitalWrite(YELLOW2, LOW);
  digitalWrite(YELLOW3, LOW);
  digitalWrite(YELLOW4, LOW);
}

// Logic to determine which yellow light to turn on based on current green
void handleYellowTransition(String state) {
  if (state == "GREEN_NORTH") {
    digitalWrite(GREEN1, LOW);
    digitalWrite(YELLOW1, HIGH);
  } else if (state == "GREEN_SOUTH") {
    digitalWrite(GREEN2, LOW);
    digitalWrite(YELLOW2, HIGH);
  } else if (state == "GREEN_EAST") {
    digitalWrite(GREEN3, LOW);
    digitalWrite(YELLOW3, HIGH);
  } else if (state == "GREEN_WEST") {
    digitalWrite(GREEN4, LOW);
    digitalWrite(YELLOW4, HIGH);
  }
}
