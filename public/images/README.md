# Images Directory Structure

This directory contains all the local images used in the FabLab website. Please add your images to the appropriate subdirectories:

## Directory Structure

```
public/images/
├── logos/
│   └── fablab-logo.png          # Main FabLab logo (navbar, favicon)
├── team/
│   ├── amr.jpg                  # Amr Elkhooly
│   ├── yousef.jpg               # Yousef Gaber
│   ├── yassen.jpg               # Yassen Ahmed
│   ├── omar.jpg                 # Omar Fathy
│   ├── zahraa.jpg               # Zahraa Abdelmonem
│   └── amr-manager.jpg          # Amr Abdelshafy (Manager)
├── gallery/
│   ├── 3d-printing.jpg          # 3D Printing Workshop
│   ├── laser-cutting.jpg        # Laser Cutting Station
│   ├── student-projects.jpg     # Student Projects
│   ├── innovation-space.jpg     # Innovation Space
│   ├── electronics-lab.jpg      # Electronics Lab
│   └── team-collaboration.jpg   # Team Collaboration
└── machines/
    ├── 3d-printer.jpg           # 3D Printer
    ├── laser-cutter.jpg         # Laser Cutter
    ├── cnc-router.jpg           # CNC Router
    ├── electronics-station.jpg  # Electronics Station
    └── vinyl-cutter.jpg         # Vinyl Cutter
```

## Image Requirements

### Team Photos
- **Format**: JPG or PNG
- **Size**: Square aspect ratio (1:1) recommended
- **Resolution**: Minimum 300x300px, recommended 500x500px or higher
- **Style**: Professional headshots with clear, well-lit faces

### Gallery Images
- **Format**: JPG or PNG
- **Size**: Landscape aspect ratio (16:9 or 4:3) recommended
- **Resolution**: Minimum 800x600px, recommended 1200x800px or higher
- **Style**: High-quality photos showing FabLab activities, equipment, and projects

### Machine Images
- **Format**: JPG or PNG
- **Size**: Landscape aspect ratio (16:9 or 4:3) recommended
- **Resolution**: Minimum 800x600px, recommended 1200x800px or higher
- **Style**: Clear photos of equipment in action or well-lit static shots

### Logo
- **Format**: PNG (with transparency) or SVG
- **Size**: Square aspect ratio (1:1)
- **Resolution**: Minimum 200x200px, recommended 400x400px or higher
- **Style**: Clean, professional logo design

## Adding Images

1. **Download or prepare your images** according to the requirements above
2. **Rename them** to match the exact filenames listed in the directory structure
3. **Place them** in the appropriate subdirectory
4. **Test the website** to ensure all images load correctly

## Fallback Images

If any images are missing, the website will show broken image icons. Make sure to add all required images for the best user experience.

## Optimization Tips

- Compress images before adding them to reduce file size
- Use appropriate formats (JPG for photos, PNG for graphics with transparency)
- Consider using WebP format for better compression (if supported by your build process)
