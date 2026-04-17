#include <WiFi.h>
#include <WebServer.h>

// ====== WiFi Credentials (UPDATE THESE) ======
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// ====== Motor Pins ======
#define in1 26     // Right Motor IN1
#define in2 27     // Right Motor IN2
#define in3 25     // Left Motor IN3
#define in4 33     // Left Motor IN4

#define ena 14     // Right Motor PWM (enable)
#define enb 32     // Left  Motor PWM (enable)

// ====== IR Sensor Pins ======
#define rightIR 34   // Right IR sensor (digital)
#define leftIR  35   // Left  IR sensor (digital)

// ====== Settings ======
// ====== Settings ======
int speedDiv = 2.5;       // 1 = fast, 2 = medium, 3 = slow
const int BLACK_IS = 1; // change to 1 if your sensors output 1 on black

// ====== Script / Command execution state ======
#include <vector>
std::vector<String> scriptLines;
int scriptIndex = 0;
bool isExecutingScript = false;
unsigned long waitEndTime = 0;
int trackingSpeed = 0;   // 0 = stopped, >0 = active

WebServer server(80);

void setup() {
  Serial.begin(115200);

  // Motor pins
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(in3, OUTPUT);
  pinMode(in4, OUTPUT);

  // PWM pins
  pinMode(ena, OUTPUT);
  pinMode(enb, OUTPUT);

  // IR sensor pins
  pinMode(rightIR, INPUT);
  pinMode(leftIR, INPUT);

  setSpeed(0);
  stopMotor();
  Serial.println("System starting...");

  // WiFi Connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Web Server Routes
  server.on("/command", HTTP_POST, handleCommand);
  // Allow GET too for testing in browser if needed
  server.on("/command", HTTP_GET, handleCommand);
  
  server.begin();
  Serial.println("Web server started");
}

void loop() {
  server.handleClient();
  
  // 1. Process Script (Non-blocking)
  processScript();

  // 2. Run Line Follower (if active)
  if (trackingSpeed > 0) {
    runLineFollower();
  } else {
    stopMotor();
  }
}

// Splits string by delimiters
void parseScript(String body) {
  scriptLines.clear();
  scriptIndex = 0;
  isExecutingScript = true;
  waitEndTime = 0;

  int start = 0; 
  int end = body.indexOf(';');
  while (end != -1) {
    scriptLines.push_back(body.substring(start, end));
    start = end + 1;
    end = body.indexOf(';', start);
  }
  // Add last part if any (in case of no semicolon at very end)
  if (start < body.length()) {
    String last = body.substring(start);
    last.trim();
    if (last.length() > 0) scriptLines.push_back(last);
  }
}

void handleCommand() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    Serial.println("Received script:");
    Serial.println(body);
    
    // Parse and start execution
    parseScript(body);
    
    server.send(200, "text/plain", "Script received and started");
  } else {
    server.send(400, "text/plain", "No body received");
  }
}

void processScript() {
  if (!isExecutingScript) return;

  // Check if we are in a 'sleep' wait period
  if (millis() < waitEndTime) return;

  // Process commands loop (handle instantaneous commands immediately)
  while (scriptIndex < scriptLines.size()) {
    String line = scriptLines[scriptIndex];
    line.trim();
    scriptIndex++; // Advance index for next time (unless we wait)

    if (line.length() == 0) continue;

    Serial.print("Executing: ");
    Serial.println(line);

    if (line.startsWith("forward")) {
      // Format: forward(250)
      int fps = line.indexOf('(');
      int lps = line.indexOf(')');
      if (fps != -1 && lps != -1) {
        String valStr = line.substring(fps + 1, lps);
        int val = valStr.toInt();
        trackingSpeed = val;
        setSpeed(trackingSpeed);
        Serial.print("Set tracking speed to: ");
        Serial.println(trackingSpeed);
      }
    } 
    else if (line.startsWith("sleep")) {
      // Format: sleep(3000)
      int fps = line.indexOf('(');
      int lps = line.indexOf(')');
      if (fps != -1 && lps != -1) {
        String valStr = line.substring(fps + 1, lps);
        int val = valStr.toInt();
        waitEndTime = millis() + val;
        Serial.print("Sleeping for ms: ");
        Serial.println(val);
        // Break loop to wait
        return; 
      }
    }
    // Add other commands here if needed
  }

  if (scriptIndex >= scriptLines.size()) {
    isExecutingScript = false;
    Serial.println("Script finished");
  }
}

void runLineFollower() {
  // If speed is 0 or stopped, do nothing (handled in loop)
  
  int rawR = digitalRead(rightIR);
  int rawL = digitalRead(leftIR);

  // Normalize
  int R_black = (rawR == BLACK_IS) ? 1 : 0;
  int L_black = (rawL == BLACK_IS) ? 1 : 0;

  // Behavior
  if (R_black == 0 && L_black == 0) {
    forward();
  }
  else if (R_black == 1 && L_black == 0) {
    turnRight();
  }
  else if (R_black == 0 && L_black == 1) {
    turnLeft();
  }
  else { // Both Black
    stopMotor();
  }
  
  // Small delay not needed for logic, but maybe for stability? 
  // removed delay(15) because it blocks command processing slightly.
  // WiFi handling + loop overhead is enough delay typically.
  delay(1); 
}

// ====== Motor control functions ======

void reverse() {
  digitalWrite(in1, LOW);
  digitalWrite(in2, HIGH);
  digitalWrite(in3, LOW);
  digitalWrite(in4, HIGH);
}

void forward() {
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  digitalWrite(in3, HIGH);
  digitalWrite(in4, LOW);
}

void turnRight() {
  digitalWrite(in1, LOW);
  digitalWrite(in2, HIGH);
  digitalWrite(in3, HIGH);
  digitalWrite(in4, LOW);
}

void turnLeft() {
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  digitalWrite(in3, LOW);
  digitalWrite(in4, HIGH);
}

void stopMotor() {
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
  digitalWrite(in3, LOW);
  digitalWrite(in4, LOW);
}

void setSpeed(int speed) {
  // Constrain 0-255
  if (speed < 0) speed = 0;
  if (speed > 255) speed = 255;
  analogWrite(ena, speed);
  analogWrite(enb, speed);
}