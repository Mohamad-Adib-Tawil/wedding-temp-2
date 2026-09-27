"""Draw a text-free, original 1200 × 630 social preview using Pillow."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

WIDTH, HEIGHT = 1200, 630
image = Image.new('RGB', (WIDTH, HEIGHT))
pixels = image.load()
for y in range(HEIGHT):
    for x in range(WIDTH):
        glow = max(0, 1 - (((x - 600) / 700) ** 2 + ((y - 245) / 480) ** 2))
        pixels[x, y] = (int(29 + 80 * glow), int(21 + 56 * glow), int(17 + 37 * glow))

shine = Image.new('RGBA', image.size)
soft = ImageDraw.Draw(shine)
soft.ellipse((350, -120, 850, 570), fill=(246, 208, 137, 96))
shine = shine.filter(ImageFilter.GaussianBlur(120))
image = Image.alpha_composite(image.convert('RGBA'), shine)
draw = ImageDraw.Draw(image)

# A symmetric stage with drawn curtains and a central arched opening.
for offset in range(0, 275, 25):
    color = (88 + offset // 12, 62 + offset // 16, 43 + offset // 20, 230)
    draw.polygon([(0, 0), (280 - offset // 4, 0), (250 - offset // 5, 355), (175 - offset // 4, HEIGHT), (0, HEIGHT)], fill=color)
    draw.polygon([(WIDTH, 0), (WIDTH - 280 + offset // 4, 0), (WIDTH - 250 + offset // 5, 355), (WIDTH - 175 + offset // 4, HEIGHT), (WIDTH, HEIGHT)], fill=color)

draw.rounded_rectangle((350, 100, 850, 670), radius=225, fill=(43, 30, 22, 255), outline=(199, 160, 97, 255), width=8)
draw.rounded_rectangle((374, 124, 826, 653), radius=205, fill=(80, 57, 38, 255), outline=(238, 204, 137, 170), width=3)
for x in (421, 468, 732, 779):
    draw.line((x, 265, x, 620), fill=(178, 137, 82, 130), width=3)

# A simple original chandelier silhouette with hanging crystals.
draw.line((600, 0, 600, 107), fill=(246, 218, 160), width=4)
for radius, y in ((150, 180), (112, 223), (75, 261)):
    draw.arc((600 - radius, y - 45, 600 + radius, y + 65), 0, 180, fill=(246, 218, 160), width=4)
    for dx in (-radius, -radius // 2, 0, radius // 2, radius):
        crystal_y = y + 45 - int(22 * abs(dx) / radius)
        draw.line((600 + dx, crystal_y, 600 + dx, crystal_y + 26), fill=(247, 222, 163), width=2)
        draw.ellipse((596 + dx, crystal_y + 22, 604 + dx, crystal_y + 31), fill=(255, 239, 190))
for x, y in ((195, 168), (978, 182), (305, 404), (902, 385), (520, 441), (675, 471), (110, 520), (1050, 510)):
    draw.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(246, 215, 152))

path = Path(__file__).resolve().parent.parent / 'assets/images/social-preview.png'
path.parent.mkdir(parents=True, exist_ok=True)
image.convert('RGB').save(path, optimize=True)
