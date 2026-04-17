import cv2
import numpy as np
import json
import os
import argparse
import sys
import math
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for headless mode
import matplotlib.pyplot as plt
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG_PATH = os.path.join(SCRIPT_DIR, "cars_config.json")

# -------------------------------------
# REAL WORLD DIMENSIONS (in centimeters)
# -------------------------------------
REAL_WIDTH_CM = 121.5
REAL_HEIGHT_CM = 151.5

# -------------------------------------
# DATA TRACKING STRUCTURES (per car)
# -------------------------------------
# Dictionary to track data for each detected car (by label)
car_data = {}  # key: car_label, value: dict with tracking data

def load_synthetic_cars(config_path: str):
    if not config_path:
        print("Warning: No config path provided", file=sys.stderr)
        return []
    if not os.path.exists(config_path):
        print(f"Warning: Config file not found: {config_path}", file=sys.stderr)
        return []
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            cars = data.get("cars", [])
            print(f"Loaded {len(cars)} synthetic car(s) from {config_path}", file=sys.stderr)
            return cars
    except Exception as e:
        print(f"Error loading config file {config_path}: {e}", file=sys.stderr)
        return []

def debug_sim_config(synthetic_cars):
    """Print simulated car timing config to stderr for debugging."""
    print("--- Simulated Cars Configuration ---", file=sys.stderr)
    for i, car in enumerate(synthetic_cars):
        if car.get("type") == "simulated":
            cid = car.get("id", f"Sim_{i}")
            stops = car.get("stop_times") or car.get("stopTime") or car.get("stop_time") or []
            reaches = car.get("time_to_reach_points") or car.get("timeToReachPoints") or []
            print(f"Car {cid}: start={car.get('moving_start_time')}, stops={stops}, reaches={reaches}", file=sys.stderr)
    print("------------------------------------", file=sys.stderr)


import serial
import time

# Global Serial for Traffic Lights
arduino_serial = None

def init_arduino(port):
    global arduino_serial
    try:
        arduino_serial = serial.Serial(port, 9600, timeout=1)
        print(f"Connected to Arduino on {port}", file=sys.stderr)
    except Exception as e:
        print(f"Failed to connect to Arduino on {port}: {e}", file=sys.stderr)

def send_traffic_signal(signal):
    if arduino_serial:
        try:
            arduino_serial.write((signal + '\n').encode())
            print(f"Sent to Arduino: {signal}", file=sys.stderr)
        except Exception as e:
            print(f"Serial write error: {e}", file=sys.stderr)

# ... (rest of imports)

# -------------------------------------
# TRAFFIC LOGIC CONSTANTS
# -------------------------------------
CRITICAL_DISTANCE = 40.0 # cm from intersection
MAX_CAPACITY_X = 5       # Max cars allowed in intersection
INTERSECTION_CENTER_X = 640 // 2  # px, approximate
INTERSECTION_CENTER_Y = 480 // 2



def send_arduino_command(arduino_ser, signal):
    """
    Send traffic light command to Arduino via serial port.
    
    Args:
        arduino_ser: Serial port object (or None if not connected)
        signal: Command string (e.g., "RED", "GREEN", "GREEN_NORTH", etc.)
    """
    if not arduino_ser:
        return
    
    try:
        command = signal + '\n'
        arduino_ser.write(command.encode('utf-8'))
        arduino_ser.flush()
        print(f"[Traffic] Sent signal to Arduino: {signal}")
    except Exception as e:
        print(f"[Traffic] Error sending to Arduino: {e}")

def check_traffic_logic(detected_cars, arduino_ser):
    """
    Traffic control system:
    1. Identify cars in critical zone for North, East, South
    2. Prioritize side with most cars (within capacity)
    3. Return signal string
    """
    # Configuration
    CRITICAL_DISTANCE = 80.0  # Increased for better responsiveness
    MAX_CAPACITY_S = 5 
    MIN_SPEED = 0.5 
    SAFETY_MARGIN = 1.0
    
    if not detected_cars:
        return "RED"
    
    sides = {
        'NORTH': [],
        'EAST': [],
        'SOUTH': [],
        'WEST': []
    }
    
    # Classify cars into sides
    for label, car_pos in detected_cars.items():
        x_cm = car_pos.get('x_cm', 0)
        y_cm = car_pos.get('y_cm', 0)
        dist_from_center = math.sqrt(x_cm**2 + y_cm**2)
        
        if dist_from_center > CRITICAL_DISTANCE:
            continue
        
        speed_cm = MIN_SPEED
        if label in car_data and len(car_data[label]['vel_cm_list']) > 0:
            speed_cm = max(MIN_SPEED, car_data[label]['vel_cm_list'][-1])
        
        car_info = {
            'label': label,
            'dist': dist_from_center,
            'speed': speed_cm,
        }
        
        # Custom Quadrant Mapping:
        # NORTH (Pins 2,3,4) <- South West (x < 0, y > 0)
        # SOUTH (Pins 5,6,7) <- North East (x > 0, y < 0)
        # WEST (Pins 11,12,13) <- South East (x > 0, y > 0)
        # EAST (Pins 8,9,10) <- North West (x < 0, y < 0)
        
        if x_cm <= 0 and y_cm >= 0:
            sides['NORTH'].append(car_info)
        elif x_cm >= 0 and y_cm <= 0:
            sides['SOUTH'].append(car_info)
        elif x_cm >= 0 and y_cm >= 0:
            sides['WEST'].append(car_info)
        else: # x_cm < 0 and y_cm < 0
            sides['EAST'].append(car_info)

    active_sides = {k: v for k, v in sides.items() if len(v) > 0}
    
    if len(active_sides) == 0:
        return "RED"
    
    # Priority logic: 
    # 1. Emergency Cars (ORANGE CAR) get absolute priority
    for side_name, cars in active_sides.items():
        for car in cars:
            if car['label'] == "ORANGE CAR":
                return f"GREEN_{side_name}"

    # 2. Side with most cars
    side_counts = [(name, len(cars)) for name, cars in active_sides.items()]
    side_counts.sort(key=lambda x: x[1], reverse=True)
    
    best_signal = "RED"
    for side_name, count in side_counts:
        if count <= MAX_CAPACITY_S:
            best_signal = f"GREEN_{side_name}"
            break
    
    return best_signal


def parse_args():
    p = argparse.ArgumentParser(description="Headless detection...")
    p.add_argument("--input", required=True, help="Input video/url")
    p.add_argument("--output", default="", help="Output file")
    p.add_argument("--config", default=DEFAULT_CONFIG_PATH, help="Config file")
    p.add_argument("--mjpeg", action="store_true", help="MJPEG mode")
    p.add_argument("--jpeg-quality", type=int, default=80, help="JPEG quality")
    p.add_argument("--realtime", action="store_true", help="Realtime sleep")
    p.add_argument("--speed", type=float, default=1.0, help="Speed multiplier")
    return p.parse_args()

# ... (process_frame signature needs update or access to globals? better to call check_traffic_logic inside loop)

def main():
    args = parse_args()

    if args.mjpeg:
        process_video_mjpeg(args.input, args.config, jpeg_quality=args.jpeg_quality, realtime=args.realtime, speed=args.speed)
        return 0

    if not args.output:
        raise RuntimeError("--output is required unless --mjpeg is used")

    process_video(args.input, args.output, args.config)
    return 0

# Need to inject check_traffic_logic call into process_video_mjpeg loop
# modifying process_video_mjpeg to call logic



def process_frame(frame, video_time_sec: float, synthetic_cars):
    # -------------------------------------------
    # IMAGE DIMENSIONS AND SCALING
    # -------------------------------------------
    # Auto-rotate to Portrait if input is Landscape (to match config)
    if frame.shape[1] > frame.shape[0]:
        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)

    # Resize frame for faster processing (max width 640)
    original_h, original_w = frame.shape[:2]
    target_w = 640
    if original_w > target_w:
        scale_factor = target_w / original_w
        new_h = int(original_h * scale_factor)
        frame = cv2.resize(frame, (target_w, new_h))

    h, w, _ = frame.shape
    origin_x = w // 2
    origin_y = h // 2

    scale_x = REAL_WIDTH_CM / w
    scale_y = REAL_HEIGHT_CM / h
    avg_scale = (scale_x + scale_y) / 2.0

    # -------------------------------------------
    # DRAW GRID (AXES)
    # -------------------------------------------
    cv2.line(frame, (origin_x, 0), (origin_x, h), (255, 255, 255), 2)
    cv2.line(frame, (0, origin_y), (w, origin_y), (255, 255, 255), 2)
    cv2.putText(frame, "(0,0)", (origin_x + 10, origin_y - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # -------------------------------------------
    # SPLINE CAR MOVEMENT (INTERPOLATED + ROTATED BODY)
    # -------------------------------------------
    # -------------------------------------------
    # Track BOTH simulated and detected cars
    # Ensure local simulation time starts from 0 for this session
    if not hasattr(process_frame, "sim_start_time") or video_time_sec < getattr(process_frame, "last_vid_time", -1.0):
        process_frame.sim_start_time = video_time_sec
        process_frame.last_vid_time = video_time_sec
        print(f"[Debug] Simulation start/reset anchor: {video_time_sec:.2f}s", file=sys.stderr)
    
    process_frame.last_vid_time = video_time_sec
    sim_time = video_time_sec - process_frame.sim_start_time
    
    # -------------------------------------------
    # Track BOTH simulated and detected cars
    # -------------------------------------------
    detected_cars = {}

    for idx_car, car in enumerate(synthetic_cars):
        if car.get("type") != "simulated":
            continue

        try:
            spline = car["spline_points_cm"]
            size_cm = car["size"]
            # Improved segment-based movement to respect stop_times
            num_ctrl_points = len(car.get("control_points_cm", []))
            
            # Support multiple possible field names for stop times and start times
            raw_stops = car.get("stop_times") or car.get("stopTime") or car.get("stop_time") or []
            stop_times = [float(st) for st in (raw_stops if isinstance(raw_stops, list) else [raw_stops])]
            
            t_start_raw = car.get("moving_start_time") or car.get("movingStartTime") or 0
            t_start = float(t_start_raw)
            
            # Robust reach times parsing
            time_to_reach_points = car.get("time_to_reach_points") or car.get("timeToReachPoints") or []
            if not time_to_reach_points: continue
            time_to_reach_points = [float(t) for t in time_to_reach_points]

            if len(stop_times) < num_ctrl_points:
                stop_times += [0.0] * (num_ctrl_points - len(stop_times))
            
            n_spline = len(spline)
            # samples_per_seg calculation: assumes uniform distribution of spline points among segments
            if num_ctrl_points > 1:
                samples_per_seg = (n_spline - 1) / (num_ctrl_points - 1)
            else:
                samples_per_seg = 0
            
            current_t = t_start
            found_pos = False
            is_waiting = False
            cx_cm, cy_cm = spline[-1]
            dx_cm, dy_cm = 0.0, 0.0
            
            if sim_time < t_start: 
                # Not started yet - could draw at start position or not draw
                continue

            for i in range(num_ctrl_points):
                # Wait at point i
                wait_duration = stop_times[i]
                if sim_time < current_t + wait_duration:
                    idx = int(round(i * samples_per_seg))
                    idx = max(0, min(n_spline - 1, idx))
                    cx_cm, cy_cm = spline[idx]
                    # For orientation while waiting, look ahead if possible
                    if idx < n_spline - 1:
                        dx_cm = spline[idx+1][0] - spline[idx][0]
                        dy_cm = spline[idx+1][1] - spline[idx][1]
                    elif idx > 0:
                        dx_cm = spline[idx][0] - spline[idx-1][0]
                        dy_cm = spline[idx][1] - spline[idx-1][1]
                    found_pos = True
                    is_waiting = True
                    break
                current_t += wait_duration
                
                # Move to point i+1
                if i < num_ctrl_points - 1:
                    travel_duration = float(time_to_reach_points[i] if i < len(time_to_reach_points) else time_to_reach_points[-1])
                    if sim_time < current_t + travel_duration:
                        alpha_seg = (sim_time - current_t) / travel_duration
                        start_idx = i * samples_per_seg
                        end_idx = (i + 1) * samples_per_seg
                        
                        pos_in_spline = start_idx + alpha_seg * (end_idx - start_idx)
                        idx_low = int(pos_in_spline)
                        idx_high = min(idx_low + 1, n_spline - 1)
                        t_interp = pos_in_spline - idx_low
                        
                        x1, y1 = spline[idx_low]
                        x2, y2 = spline[idx_high]
                        cx_cm = x1 + (x2 - x1) * t_interp
                        cy_cm = y1 + (y2 - y1) * t_interp
                        dx_cm = x2 - x1
                        dy_cm = y2 - y1
                        found_pos = True
                        break
                    current_t += travel_duration
            
            if not found_pos:
                cx_cm, cy_cm = spline[-1]
                if n_spline > 1:
                    dx_cm = spline[-1][0] - spline[-2][0]
                    dy_cm = spline[-1][1] - spline[-2][1]

            x1, y1 = cx_cm, cy_cm # For compatibility below if needed
            x2, y2 = cx_cm + dx_cm, cy_cm + dy_cm # Mock next point for drawing logic
            
            # --- ADD TO TRACKING ---
            car_id_base = car.get("id", "Sim")
            label = f"{car_id_base}_{idx_car}" if car_id_base else f"Sim_{idx_car}"
            detected_cars[label] = {
                'x_cm': cx_cm,
                'y_cm': cy_cm,
                'x_px': origin_x + cx_cm / scale_x,
                'y_px': origin_y - cy_cm / scale_y,
                'is_waiting': is_waiting
            }

            # --- DRAW CAR ---
            cx_px = origin_x + cx_cm / scale_x
            cy_px = origin_y - cy_cm / scale_y
            dx_px = (x2 - x1) / scale_x
            dy_px = -(y2 - y1) / scale_y
            
            norm = np.hypot(dx_px, dy_px) or 1.0
            dir_x, dir_y = dx_px/norm, dy_px/norm
            perp_x, perp_y = -dir_y, dir_x
            
            L_px, W_px = size_cm[0]/scale_x, size_cm[1]/scale_y
            center = np.array([cx_px, cy_px])
            corners = []
            for sL in [1, -1]:
                for sW in [1, -1]:
                    corners.append(center + (sL*L_px/2)*np.array([dir_x, dir_y]) + (sW*W_px/2)*np.array([perp_x, perp_y]))
            
            corners = np.array(corners, dtype=np.int32).reshape(-1, 1, 2)
            cv2.fillPoly(frame, [corners], tuple(car.get("color_bgr", [255, 255, 255])))
            if is_waiting:
                cv2.putText(frame, "STOPPED", (int(cx_px) - 20, int(cy_px) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
            
        except Exception as e:
            continue

    # -------------------------------------------
    # HSV COLOR DETECTION (detect real cars in video)
    # -------------------------------------------
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # RED
    red_lower1 = np.array([0, 125, 110])
    red_upper1 = np.array([7, 255, 255])
    red_lower2 = np.array([173, 125, 110])
    red_upper2 = np.array([180, 255, 255])
    red_mask = cv2.inRange(hsv, red_lower1, red_upper1) + cv2.inRange(hsv, red_lower2, red_upper2)

    # ORANGE
    orange_lower = np.array([10, 150, 120])
    orange_upper = np.array([25, 255, 255])
    orange_mask = cv2.inRange(hsv, orange_lower, orange_upper)

    # YELLOW
    yellow_lower = np.array([25, 80, 80])
    yellow_upper = np.array([35, 255, 255])
    yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)

    # BLUE (Tightened to avoid road noise)
    blue_lower = np.array([100, 150, 50]) # Higher Saturation floor
    blue_upper = np.array([135, 255, 255])
    blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)

    # PURPLE (for BGR [158, 23, 171] -> HSV [153, 221, 171])
    purple_lower = np.array([140, 50, 50])
    purple_upper = np.array([170, 255, 255])
    purple_mask = cv2.inRange(hsv, purple_lower, purple_upper)

    # MASK CLEANING
    kernel = np.ones((7, 7), np.uint8)
    masks = {
        "RED CAR": (red_mask, (0, 0, 255)),
        "ORANGE CAR": (orange_mask, (0, 140, 255)),
        "YELLOW CAR": (yellow_mask, (0, 255, 255)),
        "BLUE CAR": (blue_mask, (255, 0, 0)),
        "PURPLE CAR": (purple_mask, (158, 23, 171)), # BGR for the requested purple
    }

    # INCREASED MIN_AREA to avoid road markings/small noise
    MIN_AREA = 1000 

    def detect(mask, frame, label, box_color):
        # تنظيف الماسك
        mask_clean = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        # دمج الأجزاء المتقاربة حتى تظهر السيارة ككتلة واحدة
        kernel_merge = np.ones((25, 25), np.uint8)
        merged_mask = cv2.morphologyEx(mask_clean, cv2.MORPH_CLOSE, kernel_merge)

        # استخراج الكونتور الموحد
        contours, _ = cv2.findContours(merged_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if len(contours) == 0:
            return None

        # اختيار أكبر كونتور فقط (السيارة الحقيقية)
        c = max(contours, key=cv2.contourArea)

        if cv2.contourArea(c) < MIN_AREA:
            return None

        # رسم صندوق واحد فقط حول السيارة (NO fixed simulated car drawn)
        x, y, w_box, h_box = cv2.boundingRect(c)
        cx = x + w_box // 2
        cy = y + h_box // 2

        cv2.rectangle(frame, (x, y), (x + w_box, y + h_box), box_color, 2)
        display_label = f"EMERGENCY" if label == "ORANGE CAR" else label
        cv2.putText(frame, display_label, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)

        # Return car position data for tracking
        return {
            'cx': cx,
            'cy': cy,
            'x_px': cx - origin_x,
            'y_px': cy - origin_y,
            'x_cm': (cx - origin_x) * scale_x,
            'y_cm': (cy - origin_y) * scale_y
        }

    # Merge detected real cars with simulated cars
    for label, (mask, color) in masks.items():
        car_data_result = detect(mask, frame, label, color)
        if car_data_result:
            detected_cars[label] = car_data_result

    # Update tracking data for detected cars
    current_time = sim_time
    
    for label, car_pos in detected_cars.items():
        if label not in car_data:
            # Initialize tracking for this car
            car_data[label] = {
                'time_axis': [],
                'x_positions': [],
                'y_positions': [],
                'px_list': [],
                'py_list': [],
                'cmx_list': [],
                'cmy_list': [],
                'vel_px_list': [],
                'vel_cm_list': [],
                'dist_list': [],
                'dist_time_list': [],
                'vel_times': [],
                'vel_values': [],
                'total_distance_cm': 0.0,
                'prev_x': 0.0,
                'prev_y': 0.0,
                'prev_time': current_time,
                'last_vel_update': current_time
            }
        
        data = car_data[label]
        
        # Calculate distance traveled
        if len(data['x_positions']) > 0:
            dx_cm = car_pos['x_cm'] - data['x_positions'][-1]
            dy_cm = car_pos['y_cm'] - data['y_positions'][-1]
            data['total_distance_cm'] += math.sqrt(dx_cm*dx_cm + dy_cm*dy_cm)
        
        # Calculate velocity
        dt = current_time - data['prev_time']
        if dt > 0:
            dx = car_pos['x_px'] - data['prev_x']
            dy = car_pos['y_px'] - data['prev_y']
            speed_px = math.sqrt(dx*dx + dy*dy) / dt
            speed_cm = speed_px * avg_scale
        else:
            speed_px = 0.0
            speed_cm = 0.0
        
        # Update previous values
        data['prev_x'] = car_pos['x_px']
        data['prev_y'] = car_pos['y_px']
        data['prev_time'] = current_time
        
        # Store data only every 1 second to prevent lag
        if current_time - data['last_vel_update'] >= 1.0:
            t = int(current_time)
            data['time_axis'].append(t)
            data['x_positions'].append(car_pos['x_cm'])
            data['y_positions'].append(car_pos['y_cm'])
            data['px_list'].append(car_pos['x_px'])
            data['py_list'].append(car_pos['y_px'])
            data['cmx_list'].append(car_pos['x_cm'])
            data['cmy_list'].append(car_pos['y_cm'])
            data['vel_px_list'].append(speed_px)
            data['vel_cm_list'].append(speed_cm)
            data['dist_list'].append(data['total_distance_cm'])
            data['dist_time_list'].append(t)
            data['vel_times'].append(t)
            data['vel_values'].append(speed_cm)
            data['last_vel_update'] = current_time
        
        # Display text on frame (shifted down to avoid Sim Time panel)
        y_offset = 60 + list(detected_cars.keys()).index(label) * 50
        cv2.putText(frame, f"{label}: X={car_pos['x_px']:.0f}px/{car_pos['x_cm']:.2f}cm Y={car_pos['y_px']:.0f}px/{car_pos['y_cm']:.2f}cm", 
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.putText(frame, f"Speed: {speed_px:.2f}px/s | {speed_cm:.2f}cm/s", 
                   (10, y_offset + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        
        # Add side classification label (for traffic light logic debug)
        x_cm = car_pos['x_cm']
        y_cm = car_pos['y_cm']
        dist_from_center = math.sqrt(x_cm**2 + y_cm**2)
        
        if dist_from_center <= 50.0:  # CRITICAL_DISTANCE
            if x_cm <= 0 and y_cm >= 0:
                side = "NORTH (SW Zone)"
            elif x_cm >= 0 and y_cm <= 0:
                side = "SOUTH (NE Zone)"
            elif x_cm >= 0 and y_cm >= 0:
                side = "WEST (SE Zone)"
            else: # x_cm < 0 and y_cm < 0
                side = "EAST (NW Zone)"
            
            if label == "ORANGE CAR":
                side = f"!!! EMERGENCY !!! -> {side}"
            
            cv2.putText(frame, f"Side: {side} | Dist: {dist_from_center:.1f}cm [CRITICAL]", 
                       (10, y_offset + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 2)

    # -------------------------------------------
    # DRAW PANEL
    # -------------------------------------------
    cv2.rectangle(frame, (10, 10), (260, 45), (0, 0, 0), -1)
    cv2.putText(frame, f"Sim Time: {sim_time:.2f}s", (20, 38),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    return frame, detected_cars


def process_video(input_path: str, output_path: str, config_path: str):
    synthetic_cars = load_synthetic_cars(config_path)

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open input video: {input_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    if not np.isfinite(fps) or fps <= 0.1:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)

    writer = None
    video_time_sec = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if writer is None:
            # Fallback to actual frame size if capture properties are missing
            h0, w0 = frame.shape[:2]
            if width <= 0:
                width = int(w0)
            if height <= 0:
                height = int(h0)

            os.makedirs(os.path.dirname(os.path.abspath(output_path)) or ".", exist_ok=True)
            writer = open_video_writer(output_path, fps, width, height)
            if not writer.isOpened():
                raise RuntimeError(f"Failed to open output writer: {output_path}")

        video_time_sec = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        frame, _ = process_frame(frame, video_time_sec, synthetic_cars)  # Ignore detected_cars for regular video
        writer.write(frame)

    cap.release()
    if writer is not None:
        writer.release()


def process_video_mjpeg(input_path: str, config_path: str, jpeg_quality: int = 80, realtime: bool = False, speed: float = 1.0):
    """
    Streams MJPEG to stdout: Content-Type: multipart/x-mixed-replace; boundary=frame
    Each part contains a single JPEG frame.
    speed: multiplier for frame timing (0.1 to 5.0)
    """
    synthetic_cars = load_synthetic_cars(config_path)
    debug_sim_config(synthetic_cars)
    speed = max(0.1, min(5.0, speed))
    last_sent_time = -1  # Track last time data was sent
    



    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open input video: {input_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    if not np.isfinite(fps) or fps <= 0.1:
        fps = 30.0

    frame_time = 1.0 / fps if fps > 0 else 0.0
    boundary = b"--frame\r\n"

    # clamp quality
    jpeg_quality = int(max(30, min(95, jpeg_quality)))

    start_wall_time = None

    while True:
        t0 = time.perf_counter()
        ret, frame = cap.read()
        if not ret:
            break

        video_time_sec = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        
        # Fallback to wall-clock time if timestamp is invalid (common in live streams)
        if video_time_sec <= 0:
            if start_wall_time is None:
                start_wall_time = time.time()
            video_time_sec = time.time() - start_wall_time
        frame, detected_cars = process_frame(frame, video_time_sec, synthetic_cars)
        
        # --- Traffic Light Logic ---
        # Run every frame - the function internally optimizes
        current_decision = check_traffic_logic(detected_cars, None)
        # ---------------------------

        # Send tracking data as JSON via stderr (every 1 second only)
        current_time_int = int(video_time_sec)

        if current_time_int != last_sent_time:
            data_json = {}
            # Only populate if we have car data
            if car_data:
                for label, data in car_data.items():
                    if len(data['time_axis']) > 0:
                        data_json[label] = {
                            'time': data['time_axis'][-1],
                            'x_cm': data['x_positions'][-1] if data['x_positions'] else 0,
                            'y_cm': data['y_positions'][-1] if data['y_positions'] else 0,
                            'velocity_cm_s': data['vel_cm_list'][-1] if data['vel_cm_list'] else 0,
                            'distance_cm': data['dist_list'][-1] if data['dist_list'] else 0,
                            'all_times': data['time_axis'],
                            'all_x': data['x_positions'],
                            'all_y': data['y_positions'],
                            'all_velocities': data['vel_cm_list'],
                            'all_distances': data['dist_list'],
                            'vel_times': data['vel_times'],
                            'vel_values': data['vel_values']
                        }
            
            # Send packet even if data_json is empty, because we MUST send traffic_decision
            json_str = json.dumps({
                'type': 'tracking_data', 
                'data': data_json, 
                'video_time': video_time_sec,
                'traffic_decision': current_decision,
                'emergency_car_detected': "ORANGE CAR" in detected_cars
            })
            if "ORANGE CAR" in detected_cars:
                print(f"[Debug] Emergency car detected - Requesting OPEN_SERVOS", file=sys.stderr)
            else:
                if last_sent_time != -1: # Only print close if we were open
                     pass # We could track state here but simpler to do in frontend
            print(f"DATA:{json_str}", file=sys.stderr, flush=True)
            # print(f"DATA:{json_str}", file=sys.stderr, flush=True)
            last_sent_time = current_time_int

        ok, enc = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
        if not ok:
            continue

        jpg = enc.tobytes()
        headers = (
            boundary
            + b"Content-Type: image/jpeg\r\n"
            + f"Content-Length: {len(jpg)}\r\n\r\n".encode("ascii")
        )

        sys.stdout.buffer.write(headers)
        sys.stdout.buffer.write(jpg)
        sys.stdout.buffer.write(b"\r\n")
        sys.stdout.buffer.flush()

        if realtime and frame_time > 0:
            elapsed = time.perf_counter() - t0
            # Apply speed multiplier: higher speed = less sleep (faster playback)
            sleep_s = (frame_time / speed) - elapsed
            if sleep_s > 0:
                time.sleep(sleep_s)

    cap.release()
    # end boundary (optional)
    sys.stdout.buffer.write(b"--frame--\r\n")
    sys.stdout.buffer.flush()
    
    # Send final data summary
    if car_data:
        final_data = {}
        for label, data in car_data.items():
            final_data[label] = {
                'time_axis': data['time_axis'],
                'x_positions': data['x_positions'],
                'y_positions': data['y_positions'],
                'vel_times': data['vel_times'],
                'vel_values': data['vel_values'],
                'dist_times': data['dist_time_list'],
                'dist_values': data['dist_list']
            }
        json_str = json.dumps({'type': 'final_data', 'data': final_data})
        print(f"DATA:{json_str}", file=sys.stderr, flush=True)


def main():
    args = parse_args()

    if args.mjpeg:
        process_video_mjpeg(args.input, args.config, jpeg_quality=args.jpeg_quality, realtime=args.realtime, speed=args.speed)
        return 0

    if not args.output:
        raise RuntimeError("--output is required unless --mjpeg is used")

    process_video(args.input, args.output, args.config)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(str(e), file=sys.stderr)
        raise SystemExit(1)
