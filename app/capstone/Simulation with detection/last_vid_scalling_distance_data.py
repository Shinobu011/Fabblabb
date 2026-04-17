import cv2
import numpy as np
import time
import math
import matplotlib.pyplot as plt
import pandas as pd     # <-- Needed for Excel export

# -------------------------------------
# REAL WORLD DIMENSIONS (in centimeters)
# -------------------------------------
REAL_WIDTH_CM  = 121.5
REAL_HEIGHT_CM = 151.5

plt.ion()

# -------------------------------------
# FIGURE 1 → POSITION–TIME GRAPH
# -------------------------------------
fig_pos, ax_pos = plt.subplots()
ax_pos.set_title("Position–Time Graph")
ax_pos.set_xlabel("Time (s)")
ax_pos.set_ylabel("Position (cm)")
ax_pos.set_facecolor("black")

time_axis = []
x_positions = []
y_positions = []

(line_xt,) = ax_pos.plot([], [], color="cyan", label="X(t)")
(line_yt,) = ax_pos.plot([], [], color="yellow", label="Y(t)")
ax_pos.legend(loc="upper left")

# -------------------------------------
# FIGURE 2 → VELOCITY–TIME GRAPH
# -------------------------------------
fig_vel, ax_vel = plt.subplots()
ax_vel.set_title("Velocity–Time Graph (1-second updates)")
ax_vel.set_xlabel("Time (s)")
ax_vel.set_ylabel("Velocity (cm/s)")
ax_vel.set_facecolor("black")

vel_times = []
vel_values = []

(line_vel,) = ax_vel.plot([], [], color="red")

# -------------------------------------
# FIGURE 3 → DISTANCE–TIME GRAPH
# -------------------------------------
fig_dist, ax_dist = plt.subplots()
ax_dist.set_title("Distance–Time Graph")
ax_dist.set_xlabel("Time (s)")
ax_dist.set_ylabel("Distance Passed (cm)")
ax_dist.set_facecolor("black")

dist_times = []
dist_values = []

(line_dist,) = ax_dist.plot([], [], color="magenta")

total_distance_cm = 0

# -------------------------------------
# LISTS FOR EXCEL FILES
# -------------------------------------
px_list = []
py_list = []
cmx_list = []
cmy_list = []
vel_px_list = []
vel_cm_list = []
dist_list = []
dist_time_list = []

last_vel_update = time.time()
start_time = time.time()

# -------------------------------------
# VIDEO INPUT
# -------------------------------------
video_source = r"C:\Users\Osama\Downloads\car vid 2.mp4"
cap = cv2.VideoCapture(video_source)

prev_x, prev_y = 0, 0
prev_time = time.time()
speed_px = 0
speed_cm = 0

# ==========================
# MAIN LOOP
# ==========================
while True:
    ret, frame = cap.read()
    if not ret:
        print("End of video or cannot read frame.")
        break

    h, w, _ = frame.shape
    origin_x = w // 2
    origin_y = h // 2

    # SCALE px → cm
    scale_x = REAL_WIDTH_CM / w
    scale_y = REAL_HEIGHT_CM / h
    avg_scale = (scale_x + scale_y) / 2.0

    # Draw axes
    cv2.line(frame, (origin_x, 0), (origin_x, h), (255,255,255), 2)
    cv2.line(frame, (0, origin_y), (w, origin_y), (255,255,255), 2)
    cv2.putText(frame, "(0,0)", (origin_x+10, origin_y-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # RED
    red_lower1 = np.array([0,120,70])
    red_upper1 = np.array([10,255,255])
    red_lower2 = np.array([170,120,70])
    red_upper2 = np.array([180,255,255])
    red_mask = cv2.inRange(hsv, red_lower1, red_upper1) + cv2.inRange(hsv, red_lower2, red_upper2)

    # BLUE
    blue_lower = np.array([70, 40, 40])
    blue_upper = np.array([150, 255, 255])
    blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)

    kernel = np.ones((7,7), np.uint8)
    blue_mask = cv2.morphologyEx(blue_mask, cv2.MORPH_CLOSE, kernel)
    blue_mask = cv2.morphologyEx(blue_mask, cv2.MORPH_OPEN, kernel)

    red_mask = cv2.medianBlur(red_mask, 7)
    blue_mask = cv2.medianBlur(blue_mask, 7)

    red_contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    blue_contours, _ = cv2.findContours(blue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    red_x = red_y = 0
    red_x_cm = red_y_cm = 0

    contour_list = []
    if red_contours:
        contour_list.append(("RED", max(red_contours, key=cv2.contourArea)))
    if blue_contours:
        contour_list.append(("BLUE", max(blue_contours, key=cv2.contourArea)))

    if contour_list:
        color_name, cnt = contour_list[0]
        area = cv2.contourArea(cnt)

        if area > 300:
            x, y, w_box, h_box = cv2.boundingRect(cnt)
            cx = x + w_box//2
            cy = y + h_box//2

            color_draw = (0, 255, 0) if color_name == "RED" else (255, 0, 0)
            cv2.rectangle(frame, (x,y), (x+w_box,y+h_box), color_draw, 3)
            cv2.circle(frame, (cx,cy), 7, color_draw, -1)

            red_x = cx - origin_x
            red_y = cy - origin_y

            red_x_cm = red_x * scale_x
            red_y_cm = red_y * scale_y

            # DISTANCE UPDATE (EVERY FRAME)
            if len(x_positions) > 0:
                dx_cm = red_x_cm - x_positions[-1]
                dy_cm = red_y_cm - y_positions[-1]
                total_distance_cm += math.sqrt(dx_cm*dx_cm + dy_cm*dy_cm)

            now = time.time()
            dt = now - prev_time
            dx = red_x - prev_x
            dy = red_y - prev_y
            speed_px = math.sqrt(dx*dx + dy*dy) / dt
            speed_cm = speed_px * avg_scale

            prev_x, prev_y = red_x, red_y
            prev_time = now

            # TIME + POSITION LOGGING
            t = int(now - start_time)
            time_axis.append(t)
            x_positions.append(red_x_cm)
            y_positions.append(red_y_cm)

            # ===== Excel Storage =====
            px_list.append(red_x)
            py_list.append(red_y)
            cmx_list.append(red_x_cm)
            cmy_list.append(red_y_cm)
            vel_px_list.append(speed_px)
            vel_cm_list.append(speed_cm)
            dist_list.append(total_distance_cm)
            dist_time_list.append(t)

            # UPDATE POSITION GRAPH
            line_xt.set_xdata(time_axis)
            line_xt.set_ydata(x_positions)
            line_yt.set_xdata(time_axis)
            line_yt.set_ydata(y_positions)
            ax_pos.set_xlim(0, max(time_axis)+1)
            ax_pos.set_ylim(min(x_positions+y_positions)-20, max(x_positions+y_positions)+20)
            fig_pos.canvas.draw()
            fig_pos.canvas.flush_events()

            # UPDATE DISTANCE GRAPH
            dist_times.append(t)
            dist_values.append(total_distance_cm)
            line_dist.set_xdata(dist_times)
            line_dist.set_ydata(dist_values)
            ax_dist.set_xlim(0, max(dist_times)+1)
            ax_dist.set_ylim(0, max(dist_values)+20)
            fig_dist.canvas.draw()
            fig_dist.canvas.flush_events()

            # UPDATE VELOCITY GRAPH (1 second)
            if now - last_vel_update >= 1.0:
                vel_times.append(t)
                vel_values.append(speed_cm)
                line_vel.set_xdata(vel_times)
                line_vel.set_ydata(vel_values)
                ax_vel.set_xlim(0, max(vel_times)+1)
                ax_vel.set_ylim(0, max(vel_values)+20)
                fig_vel.canvas.draw()
                fig_vel.canvas.flush_events()
                last_vel_update = now

    # DISPLAY TEXT
    cv2.putText(frame, f"X = {red_x} px | {red_x_cm:.2f} cm", (10,30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
    cv2.putText(frame, f"Y = {red_y} px | {red_y_cm:.2f} cm", (10,60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
    cv2.putText(frame, f"Speed = {speed_px:.2f} px/s | {speed_cm:.2f} cm/s", (10,90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

    cv2.imshow("Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ==========================================================
# EXPORT TO EXCEL FILES
# ==========================================================

# 1️⃣ POSITION–TIME FILE
df_pos = pd.DataFrame({
    "Time (s)": time_axis,
    "X (px)": px_list,
    "Y (px)": py_list,
    "X (cm)": cmx_list,
    "Y (cm)": cmy_list
})
df_pos.to_excel("position_time.xlsx", index=False)

# 2️⃣ DISTANCE–TIME FILE
df_dist = pd.DataFrame({
    "Time (s)": dist_time_list,
    "Distance Passed (cm)": dist_list
})
df_dist.to_excel("distance_time.xlsx", index=False)

# 3️⃣ VELOCITY–TIME FILE
df_vel = pd.DataFrame({
    "Time (s)": vel_times,
    "Velocity (px/s)": vel_px_list[:len(vel_times)],
    "Velocity (cm/s)": vel_cm_list[:len(vel_times)]
})
df_vel.to_excel("velocity_time.xlsx", index=False)

print("Excel files saved successfully:")
print("✔ position_time.xlsx")
print("✔ distance_time.xlsx")
print("✔ velocity_time.xlsx")

cap.release()
cv2.destroyAllWindows()
plt.close("all")
