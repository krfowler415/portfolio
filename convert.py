from PIL import Image
import os

# Disable the decompression bomb limit — your Firefly PNGs are huge but safe
Image.MAX_IMAGE_PIXELS = None

files = [
    'images/terrain-dark.png',
    'images/terrain-light.png',
    'images/intro-ufo.png',
    'images/eDreams-Final-DefaultPage.png',
    'images/Alien-Image-dark.png',
    'images/Alien-Image-light.png',
]

MAX_WIDTH = 8000  # 2× retina for 4K displays — more than enough

for f in files:
    if not os.path.exists(f):
        print(f"Skipping {f} — not found")
        continue
    
    img = Image.open(f)
    
    # Resize if wider than 8000px, keeping aspect ratio
    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        new_height = int(img.height * ratio)
        img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
        resized = True
    else:
        resized = False
    
    out = f.replace('.png', '.webp')
    img.save(out, 'WEBP', quality=95, method=6)
    
    orig = os.path.getsize(f) / (1024*1024)
    new = os.path.getsize(out) / (1024*1024)
    
    if resized:
        print(f"{f}: {orig:.1f}MB → {new:.1f}MB (resized from {img.width}px to {MAX_WIDTH}px)")
    else:
        print(f"{f}: {orig:.1f}MB → {new:.1f}MB")

print("\nDone.")