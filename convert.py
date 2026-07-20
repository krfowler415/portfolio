from PIL import Image
import os

files = [
    'terrain-dark.png',
    'terrain-light.png',
    'images/Alien-Image-dark.png',
    'images/Alien-Image-light.png',
]

for f in files:
    if not os.path.exists(f):
        continue
    img = Image.open(f)
    out = f.replace('.png', '.webp')
    # 90 = visually identical to PNG. 95 = even safer for Firefly grain.
    img.save(out, 'WEBP', quality=95, method=6)
    orig = os.path.getsize(f) / (1024*1024)
    new = os.path.getsize(out) / (1024*1024)
    print(f"{f}: {orig:.1f}MB → {new:.1f}MB")

print("\nDone.")
