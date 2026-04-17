import sys
import os
import json
import math

from PyQt5.QtWidgets import (
    QApplication, QWidget, QPushButton, QFileDialog,
    QMessageBox, QInputDialog, QColorDialog
)
from PyQt5.QtGui import QPixmap, QPainter, QPen, QColor
from PyQt5.QtCore import Qt, QPointF


class CarPathEditor(QWidget):
    def __init__(self):
        super().__init__()

        self.paths = []
        self.mode = "draw"

        self.snap_enabled = False  # snap toggle

        self.start_point = None
        self.end_point = None

        self.selected_car_index = None
        self.selected_endpoint = None
        self.dragging = False

        # zoom + pan
        self.zoom = 1.0
        self.pan_x = 0.0
        self.pan_y = 0.0
        self.panning = False
        self.last_pan_pos = None

        # load image
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.script_dir = script_dir

        self.image_path = os.path.join(script_dir, "intersection.png")
        if not os.path.exists(self.image_path):
            fp, _ = QFileDialog.getOpenFileName(self, "Select image", script_dir)
            if not fp:
                QMessageBox.critical(self, "Error", "No image selected.")
                sys.exit(1)
            self.image_path = fp

        self.image = QPixmap(self.image_path)
        if self.image.isNull():
            QMessageBox.critical(self, "Error", "Cannot load image.")
            sys.exit(1)

        self.origin_x = self.image.width() // 2
        self.origin_y = self.image.height() // 2

        self.REAL_WIDTH_CM = 121.5
        self.REAL_HEIGHT_CM = 151.5
        self.scale_x = self.REAL_WIDTH_CM / self.image.width()
        self.scale_y = self.REAL_HEIGHT_CM / self.image.height()

        # window
        self.setWindowTitle("Car Path Editor")
        self.resize(self.image.width(), self.image.height())

        # buttons
        btn_w = 150
        btn_h = 30
        x0 = 10
        y = 10
        dy = 35

        self.btn_draw = QPushButton("Draw Mode", self)
        self.btn_draw.setGeometry(x0, y, btn_w, btn_h)
        self.btn_draw.clicked.connect(self.set_draw_mode)
        y += dy

        self.btn_select = QPushButton("Select Mode", self)
        self.btn_select.setGeometry(x0, y, btn_w, btn_h)
        self.btn_select.clicked.connect(self.set_select_mode)
        y += dy

        self.btn_snap = QPushButton("Snap: OFF", self)
        self.btn_snap.setGeometry(x0, y, btn_w, btn_h)
        self.btn_snap.clicked.connect(self.toggle_snap)
        y += dy

        self.btn_gen = QPushButton("Generate JSON", self)
        self.btn_gen.setGeometry(x0, y, btn_w, btn_h)
        self.btn_gen.clicked.connect(self.generate_json)
        y += dy

        self.btn_load = QPushButton("Load JSON", self)
        self.btn_load.setGeometry(x0, y, btn_w, btn_h)
        self.btn_load.clicked.connect(self.load_json)
        y += dy

        self.btn_clear = QPushButton("Clear Paths", self)
        self.btn_clear.setGeometry(x0, y, btn_w, btn_h)
        self.btn_clear.clicked.connect(self.clear_paths)
        y += dy

        self.btn_delete = QPushButton("Delete Selected", self)
        self.btn_delete.setGeometry(x0, y, btn_w, btn_h)
        self.btn_delete.clicked.connect(self.delete_selected)
        y += dy

        self.btn_edit = QPushButton("Edit Selected", self)
        self.btn_edit.setGeometry(x0, y, btn_w, btn_h)
        self.btn_edit.clicked.connect(self.edit_selected)
        y += dy

        self.btn_export = QPushButton("Export BEV Map", self)
        self.btn_export.setGeometry(x0, y, btn_w, btn_h)
        self.btn_export.clicked.connect(self.export_bev)

        self.update_mode_buttons()

    # ----------------- Snap Toggle -----------------

    def toggle_snap(self):
        self.snap_enabled = not self.snap_enabled
        self.btn_snap.setText("Snap: ON" if self.snap_enabled else "Snap: OFF")

    def snap(self, x, y, spacing=50):
        if not self.snap_enabled:
            return x, y
        return round(x/spacing)*spacing, round(y/spacing)*spacing

    # ----------------- Modes -----------------

    def set_draw_mode(self):
        self.mode = "draw"
        self.update_mode_buttons()

    def set_select_mode(self):
        self.mode = "select"
        self.update_mode_buttons()

    def update_mode_buttons(self):
        self.btn_draw.setStyleSheet("background-color: #88ff88;" if self.mode == "draw" else "")
        self.btn_select.setStyleSheet("background-color: #88ff88;" if self.mode == "select" else "")

    # ----------------- Painting -----------------

    def paintEvent(self, event):
        p = QPainter(self)
        p.save()
        p.translate(self.pan_x, self.pan_y)
        p.scale(self.zoom, self.zoom)
        self.draw_scene(p)
        p.restore()

    def draw_scene(self, p):
        p.drawPixmap(0, 0, self.image)
        self.draw_grid(p)
        self.draw_paths(p)

        if self.mode == "draw" and self.start_point and self.end_point:
            pen = QPen(Qt.yellow, 2, Qt.DashLine)
            p.setPen(pen)
            p.drawLine(self.start_point, self.end_point)

    def draw_grid(self, p):
        spacing = 50
        w = self.image.width()
        h = self.image.height()

        pen = QPen(QColor(150,150,150), 1)
        p.setPen(pen)

        for x in range(0, w, spacing):
            p.drawLine(x, 0, x, h)
        for y in range(0, h, spacing):
            p.drawLine(0, y, w, y)

        pen = QPen(Qt.cyan, 2)
        p.setPen(pen)
        p.drawLine(self.origin_x, 0, self.origin_x, h)
        p.drawLine(0, self.origin_y, w, self.origin_y)
        p.setBrush(Qt.cyan)
        p.drawEllipse(QPointF(self.origin_x, self.origin_y), 5, 5)

    # ----------------- Spline -----------------

    def catmull_rom(self, pts, samples=20):
        if len(pts) <= 2:
            return pts

        extended = [pts[0]] + pts + [pts[-1]]
        out = []

        for i in range(len(extended)-3):
            p0, p1, p2, p3 = extended[i:i+4]

            for j in range(samples):
                t = j / samples
                t2, t3 = t*t, t*t*t

                x = 0.5 * (
                    (2*p1[0])
                    + (-p0[0] + p2[0]) * t
                    + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * t2
                    + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * t3
                )
                y = 0.5 * (
                    (2*p1[1])
                    + (-p0[1] + p2[1]) * t
                    + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * t2
                    + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * t3
                )
                out.append((x,y))

        out.append(pts[-1])
        return out

    # ----------------- Draw paths -----------------

    def draw_paths(self, p):
        for idx, car in enumerate(self.paths):
            color = QColor(car["color_bgr"][2], car["color_bgr"][1], car["color_bgr"][0])

            p.setPen(QPen(color, 3 if idx == self.selected_car_index else 2))
            p.setBrush(color)

            ctrl = [car["start_px"]] + car["turn_points"] + [car["end_px"]]
            spline = self.catmull_rom(ctrl)

            for a, b in zip(spline, spline[1:]):
                p.drawLine(QPointF(*a), QPointF(*b))

            # draw nodes
            for x, y in ctrl:
                p.drawEllipse(QPointF(x, y), 5, 5)

    # ----------------- Mouse -----------------

    def widget_to_image(self, x, y):
        return (x - self.pan_x) / self.zoom, (y - self.pan_y) / self.zoom

    def mousePressEvent(self, e):
        if e.button() == Qt.RightButton:
            self.panning = True
            self.last_pan_pos = e.pos()
            return

        if e.button() != Qt.LeftButton:
            return

        x, y = self.widget_to_image(e.x(), e.y())
        if not (0 <= x <= self.image.width() and 0 <= y <= self.image.height()):
            return

        x, y = self.snap(x, y)

        if self.mode == "draw":
            if self.start_point is None:
                self.start_point = QPointF(x,y)
            else:
                self.end_point = QPointF(x,y)
                self.store_path()
                self.start_point = None
                self.end_point = None
            self.update()
            return

        if self.mode == "select":
            idx, info = self.find_nearest_point(x,y)
            self.selected_car_index = idx
            self.selected_endpoint = info
            self.dragging = idx is not None
            self.update()
            return

    def mouseMoveEvent(self, e):
        if self.panning and self.last_pan_pos:
            dx = e.x() - self.last_pan_pos.x()
            dy = e.y() - self.last_pan_pos.y()
            self.pan_x += dx
            self.pan_y += dy
            self.last_pan_pos = e.pos()
            self.update()
            return

        if not (e.buttons() & Qt.LeftButton):
            return

        if self.mode == "select" and self.dragging and self.selected_car_index is not None:
            car = self.paths[self.selected_car_index]
            etype, eindex = self.selected_endpoint

            x, y = self.widget_to_image(e.x(), e.y())
            x, y = self.snap(x, y)

            if etype == "start":
                car["start_px"] = (x,y)
            elif etype == "end":
                car["end_px"] = (x,y)
            elif etype == "turn":
                car["turn_points"][eindex] = (x,y)

            self.update()

    def mouseReleaseEvent(self, e):
        if e.button() == Qt.RightButton:
            self.panning = False
            self.last_pan_pos = None
        if e.button() == Qt.LeftButton:
            self.dragging = False

    def mouseDoubleClickEvent(self, e):
        if self.mode != "select":
            return

        x, y = self.widget_to_image(e.x(), e.y())
        x, y = self.snap(x, y)

        seg = self.find_nearest_segment(x, y)
        if not seg:
            return

        car_idx, seg_idx, px, py = seg
        car = self.paths[car_idx]

        turns = car["turn_points"]
        inserts = seg_idx
        if inserts > len(turns):
            inserts = len(turns)

        car["turn_points"].insert(inserts, (px, py))

        # SYNC TIMING DATA
        if "stop_times" in car:
            # New point is at index inserts + 1 (0 is start)
            car["stop_times"].insert(inserts + 1, "000")
        if "time_to_reach_points" in car:
            # Split segment seg_idx into two
            car["time_to_reach_points"].insert(inserts, 2.0)

        self.selected_car_index = car_idx
        self.selected_endpoint = ("turn", inserts)
        self.update()

    def wheelEvent(self, e):
        old = self.zoom
        delta = e.angleDelta().y()

        self.zoom *= 1.1 if delta > 0 else 0.9
        self.zoom = max(0.2, min(5, self.zoom))

        mx, my = e.x(), e.y()
        self.pan_x = mx - (mx - self.pan_x) * (self.zoom / old)
        self.pan_y = my - (my - self.pan_y) * (self.zoom / old)
        self.update()

    # ----------------- Path Tools -----------------

    def store_path(self):
        sx, sy = self.start_point.x(), self.start_point.y()
        ex, ey = self.end_point.x(), self.end_point.y()

        # FIXED COLOR DIALOG
        color = QColorDialog.getColor(parent=self)
        if not color.isValid():
            return

        w, ok = QInputDialog.getDouble(self, "Car width", "Width (cm):", 18)
        if not ok:
            return
        h, ok2 = QInputDialog.getDouble(self, "Car height", "Height (cm):", 9)
        if not ok2:
            return

        self.paths.append({
            "id": f"car{len(self.paths)+1}",
            "start_px": (sx, sy),
            "turn_points": [],
            "end_px": (ex, ey),
            "size": [w, h],
            "moving_start_time": "000",
            "stop_times": ["000", "000"],
            "time_to_reach_points": [2],
            "color_bgr": [color.blue(), color.green(), color.red()]
        })

    def clear_paths(self):
        self.paths = []
        self.selected_car_index = None
        self.selected_endpoint = None
        self.start_point = None
        self.end_point = None
        self.update()

    # ----------------- Selection -----------------

    def find_nearest_point(self, x, y, thresh=12):
        best = None
        best_d2 = thresh * thresh

        for i, car in enumerate(self.paths):
            px, py = car["start_px"]
            d2 = (px-x)**2 + (py-y)**2
            if d2 < best_d2:
                best = (i, ("start", None))
                best_d2 = d2

            px, py = car["end_px"]
            d2 = (px-x)**2 + (py-y)**2
            if d2 < best_d2:
                best = (i, ("end", None))
                best_d2 = d2

            for ti,(tx,ty) in enumerate(car["turn_points"]):
                d2 = (tx-x)**2 + (ty-y)**2
                if d2 < best_d2:
                    best = (i, ("turn", ti))
                    best_d2 = d2

        return best if best else (None, None)

    def find_nearest_segment(self, x, y, thresh=12):
        best = None
        best_d2 = thresh * thresh

        for i, car in enumerate(self.paths):
            pts = [car["start_px"]] + car["turn_points"] + [car["end_px"]]

            for si in range(len(pts)-1):
                x1,y1 = pts[si]
                x2,y2 = pts[si+1]

                vx, vy = x2-x1, y2-y1
                wx, wy = x-x1, y-y1

                seglen2 = vx*vx + vy*vy
                if seglen2 == 0:
                    continue

                t = (vx*wx + vy*wy) / seglen2
                t = max(0, min(1,t))

                projx = x1 + t*vx
                projy = y1 + t*vy

                d2 = (projx-x)**2 + (projy-y)**2
                if d2 < best_d2:
                    best = (i, si, projx, projy)
                    best_d2 = d2

        return best

    # ----------------- Editing -----------------

    def delete_selected(self):
        if self.selected_car_index is None or self.selected_endpoint is None:
            return

        etype, eidx = self.selected_endpoint
        if etype != "turn":
            QMessageBox.information(self, "Error", "Cannot delete start/end point.")
            return

        car = self.paths[self.selected_car_index]
        del car["turn_points"][eidx]

        # SYNC TIMING DATA
        if "stop_times" in car:
            if len(car["stop_times"]) > eidx + 1:
                del car["stop_times"][eidx + 1]
        if "time_to_reach_points" in car:
            if len(car["time_to_reach_points"]) > eidx:
                del car["time_to_reach_points"][eidx]

        self.selected_endpoint = None
        self.update()

    def edit_selected(self):
        if self.selected_car_index is None:
            return

        car = self.paths[self.selected_car_index]
        old = QColor(car["color_bgr"][2],car["color_bgr"][1],car["color_bgr"][0])
        new = QColorDialog.getColor(old,self)
        if new.isValid():
            car["color_bgr"] = [new.blue(),new.green(),new.red()]

        w,h = car["size"]
        w2, ok = QInputDialog.getDouble(self,"Width","Width (cm):",w)
        if ok:
            h2,ok2 = QInputDialog.getDouble(self,"Height","Height (cm):",h)
            if ok2:
                car["size"] = [w2,h2]

        t_start, ok3 = QInputDialog.getText(self, "Start Time", "Moving Start Time (s):", text=str(car.get("moving_start_time", "000")))
        if ok3:
            car["moving_start_time"] = t_start

        num_pts = len(car["turn_points"]) + 2
        
        stops_str, ok4 = QInputDialog.getText(self, "Stop Times", f"Enter {num_pts} stop times (s) separated by comma:", text=",".join([str(x) for x in car.get("stop_times", ["0"]*num_pts)]))
        if ok4:
            car["stop_times"] = [s.strip() for s in stops_str.split(",")]
        
        reach_str, ok5 = QInputDialog.getText(self, "Reach Times", f"Enter {num_pts-1} travel durations (s) separated by comma:", text=",".join([str(x) for x in car.get("time_to_reach_points", ["2"]*(num_pts-1))]))
        if ok5:
            car["time_to_reach_points"] = [float(r.strip()) for r in reach_str.split(",")]

        self.update()

    # ----------------- JSON -----------------

    def px_to_cm(self, x, y):
        return (x - self.origin_x)*self.scale_x, (self.origin_y - y)*self.scale_y

    def cm_to_px(self, cx, cy):
        return self.origin_x + cx/self.scale_x, self.origin_y - cy/self.scale_y

    def generate_json(self):
        out = {"cars": []}

        for car in self.paths:
            ctrl_px = [car["start_px"]] + car["turn_points"] + [car["end_px"]]

            # Convert control points to cm properly
            ctrl_cm = []
            for x, y in ctrl_px:
                cx, cy = self.px_to_cm(x, y)
                ctrl_cm.append([round(cx, 3), round(cy, 3)])

            # Generate spline in cm
            spline_px = self.catmull_rom(ctrl_px)
            spline_cm = []
            for x, y in spline_px:
                cx, cy = self.px_to_cm(x, y)
                spline_cm.append([round(cx, 3), round(cy, 3)])

            # Ensure timing arrays are correct length
            num_pts = len(ctrl_cm)
            stops = car.get("stop_times", ["000"]*num_pts)
            if len(stops) < num_pts:
                stops += ["000"] * (num_pts - len(stops))
            else:
                stops = stops[:num_pts]

            reaches = car.get("time_to_reach_points", [2]*(num_pts-1))
            if len(reaches) < num_pts - 1:
                reaches += [2] * (num_pts - 1 - len(reaches))
            else:
                reaches = reaches[:num_pts-1]

            out["cars"].append({
                "id": car["id"],
                "center_start_point": ctrl_cm[0],
                "center_end_point": ctrl_cm[-1],
                "size": car["size"],
                "moving_start_time": car.get("moving_start_time", "000"),
                "stop_times": stops,
                "time_to_reach_points": reaches,
                "color_bgr": car["color_bgr"],
                "control_points_cm": ctrl_cm,
                "spline_points_cm": spline_cm
            })

        fp = os.path.join(self.script_dir, "cars_config.json")
        with open(fp, "w") as f:
            json.dump(out, f, indent=2)

        QMessageBox.information(self, "Saved", fp)


    def load_json(self):
        fp,_=QFileDialog.getOpenFileName(self,"Load JSON",self.script_dir,"*.json")
        if not fp:
            return

        with open(fp,"r") as f:
            data=json.load(f)

        self.paths=[]
        for car in data.get("cars",[]):
            ctrl=car["control_points_cm"]
            start=ctrl[0]
            end=ctrl[-1]
            turns=ctrl[1:-1]

            start_px=self.cm_to_px(*start)
            end_px=self.cm_to_px(*end)
            turn_px=[ self.cm_to_px(*tp) for tp in turns ]

            self.paths.append({
                "id":car["id"],
                "start_px":start_px,
                "turn_points":turn_px,
                "end_px":end_px,
                "size":car["size"],
                "moving_start_time":car.get("moving_start_time", "000"),
                "stop_times":car.get("stop_times", ["0"]*(len(ctrl))),
                "time_to_reach_points":car.get("time_to_reach_points", [2]*(len(ctrl)-1)),
                "color_bgr":car["color_bgr"]
            })

        self.update()

    # ----------------- BEV -----------------

    def export_bev(self):
        pix=QPixmap(self.image.size())
        pix.fill(Qt.black)
        p=QPainter(pix)
        self.draw_scene(p)
        p.end()

        fp=os.path.join(self.script_dir,"bev_map.png")
        pix.save(fp)
        QMessageBox.information(self,"Saved",fp)


# ----------------- MAIN -----------------

if __name__ == "__main__":
    app=QApplication(sys.argv)
    win=CarPathEditor()
    win.show()
    sys.exit(app.exec())
