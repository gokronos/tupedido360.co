from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
W, H, FPS = 540, 960, 24
DURATION = 38
GREEN = "#071510"
CARD = "#0d251d"
MID = "#176b4d"
LIME = "#d6f35c"
WHITE = "#ffffff"
MUTED = "#a7b8b0"

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size: int, bold: bool = False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def ease(value: float):
    value = max(0.0, min(1.0, value))
    return 1 - (1 - value) ** 3


def alpha_at(local: float, duration: float):
    return min(1.0, local / .35, (duration - local) / .35)


def wrapped(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text_block(layer, text, y, size, color=WHITE, bold=False, width=460, align="center", spacing=8):
    draw = ImageDraw.Draw(layer)
    fnt = font(size, bold)
    lines = wrapped(draw, text, fnt, width)
    line_height = size + spacing
    for index, line in enumerate(lines):
        box = draw.textbbox((0, 0), line, font=fnt)
        x = (W - (box[2] - box[0])) // 2 if align == "center" else (W - width) // 2
        draw.text((x, y + index * line_height), line, font=fnt, fill=color)
    return y + len(lines) * line_height


def brand(layer, top=38):
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((34, top, 78, top + 44), 11, fill=MID)
    draw.ellipse((48, top + 11, 64, top + 27), fill=LIME)
    draw.rectangle((46, top + 25, 66, top + 32), fill=LIME)
    draw.text((90, top + 6), "TuPedido360", font=font(23, True), fill=WHITE)
    draw.text((91, top + 31), "SU NEGOCIO EN UN SOLO LUGAR", font=font(8, True), fill=MUTED)


def phone(layer, screenshot, box, offset=0):
    x1, y1, x2, y2 = box
    width, height = x2 - x1, y2 - y1
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((x1 - 7, y1 - 7, x2 + 7, y2 + 7), 28, fill="#020806", outline="#395047", width=2)
    crop_h = int(height * screenshot.width / width)
    offset = max(0, min(offset, screenshot.height - crop_h))
    crop = screenshot.crop((0, offset, screenshot.width, offset + crop_h)).resize((width, height), Image.Resampling.LANCZOS)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), 21, fill=255)
    layer.paste(crop, (x1, y1), mask)
    draw.rounded_rectangle(((x1 + x2) // 2 - 34, y1 + 7, (x1 + x2) // 2 + 34, y1 + 13), 4, fill="#18211e")


def base():
    image = Image.new("RGB", (W, H), GREEN)
    draw = ImageDraw.Draw(image)
    draw.ellipse((-180, -220, 420, 380), fill="#0e3024")
    draw.ellipse((350, 660, 760, 1070), fill="#0b2b20")
    return image


def scene_intro(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer)
    shift = int(24 * (1 - ease(local / .8)))
    y = text_block(layer, "¿Sus pedidos se pierden entre chats, llamadas y papeles?", 220 + shift, 38, WHITE, True, 460, spacing=9)
    text_block(layer, "Cada pedido desordenado puede convertirse en tiempo perdido y clientes insatisfechos.", y + 22, 20, MUTED, False, 440, spacing=8)
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((67, 650, 473, 730), 18, fill="#102d23", outline="#315247", width=2)
    draw.text((93, 674), "Chats + papel + cuentas separadas", font=font(16, True), fill="#e5eee9")
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_solution(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer)
    text_block(layer, "Todo lo que su negocio necesita, en un solo lugar", 170, 42, WHITE, True, 470, spacing=10)
    draw = ImageDraw.Draw(layer)
    items = [("MENÚ WEB", "Tu propio enlace"), ("PEDIDOS QR", "Sin comisiones"), ("CONTROL", "Ventas e inventario")]
    for i, (title, subtitle) in enumerate(items):
        y = 430 + i * 112 + int(18 * (1 - ease(max(0, local - .25 * i) / .6)))
        draw.rounded_rectangle((54, y, 486, y + 88), 16, fill=CARD, outline="#254d3d", width=2)
        draw.ellipse((75, y + 22, 119, y + 66), fill=MID)
        draw.text((91, y + 30), "✓", font=font(20, True), fill=LIME)
        draw.text((140, y + 18), title, font=font(18, True), fill=WHITE)
        draw.text((140, y + 49), subtitle, font=font(14), fill=MUTED)
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_menu(local, duration, menu):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer, 24)
    text_block(layer, "Una página web que sí vende", 82, 32, WHITE, True)
    text_block(layer, "Sus clientes ven el menú y ordenan desde un enlace o código QR", 175, 16, MUTED, width=440)
    progress = ease(local / duration)
    phone(layer, menu, (115, 235, 425, 910), int(progress * max(0, menu.height - 900)))
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_order(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer)
    text_block(layer, "Cada pedido llega claro y al instante", 145, 38, WHITE, True, 470)
    draw = ImageDraw.Draw(layer)
    y = 350 + int(22 * (1 - ease(local / .7)))
    draw.rounded_rectangle((42, y, 498, y + 330), 20, fill="#123c2d", outline=LIME, width=2)
    draw.ellipse((69, y + 30, 123, y + 84), fill=LIME)
    draw.text((84, y + 42), "!", font=font(22, True), fill=GREEN)
    draw.text((140, y + 30), "NUEVO PEDIDO #8492", font=font(20, True), fill=LIME)
    draw.text((70, y + 115), "Cliente", font=font(13), fill=MUTED); draw.text((250, y + 115), "Carlos · Mesa 4", font=font(14, True), fill=WHITE)
    draw.text((70, y + 163), "Pedido", font=font(13), fill=MUTED); draw.text((250, y + 163), "2 hamburguesas", font=font(14, True), fill=WHITE)
    draw.text((250, y + 191), "+ 2 bebidas", font=font(14, True), fill=WHITE)
    draw.line((70, y + 238, 470, y + 238), fill="#376252", width=1)
    draw.text((70, y + 265), "TOTAL", font=font(13, True), fill=MUTED); draw.text((324, y + 258), "$54.000", font=font(24, True), fill=LIME)
    text_block(layer, "Cocina, caja y meseros trabajan conectados.", 745, 18, MUTED, width=440)
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_tools(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer)
    text_block(layer, "6 herramientas por una sola mensualidad", 115, 34, WHITE, True)
    text_block(layer, "Deje de pagar aplicaciones por separado", 260, 17, MUTED)
    draw = ImageDraw.Draw(layer)
    tools = ["Página web", "Pedidos QR", "Panel de control", "Ventas y caja", "Mini inventario", "Equipo y cocina"]
    for i, item in enumerate(tools):
        col, row = i % 2, i // 2
        x, y = 42 + col * 233, 345 + row * 142
        draw.rounded_rectangle((x, y, x + 215, y + 116), 15, fill=CARD, outline="#254d3d", width=2)
        draw.ellipse((x + 18, y + 17, x + 54, y + 53), fill=MID)
        draw.text((x + 29, y + 23), "✓", font=font(16, True), fill=LIME)
        lines = wrapped(draw, item, font(15, True), 175)
        for j, line in enumerate(lines): draw.text((x + 18, y + 68 + j * 19), line, font=font(15, True), fill=WHITE)
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_price(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer)
    text_block(layer, "Todo su negocio digital", 175, 38, WHITE, True)
    draw = ImageDraw.Draw(layer)
    pulse = 1 + .025 * math.sin(local * 5)
    bw, bh = int(440 * pulse), int(260 * pulse); x, y = (W - bw) // 2, 340 - (bh - 260) // 2
    draw.rounded_rectangle((x, y, x + bw, y + bh), 25, fill="#123f30", outline=LIME, width=3)
    label = "$30.000"
    bbox = draw.textbbox((0, 0), label, font=font(62, True)); draw.text(((W - (bbox[2]-bbox[0]))//2, y + 55), label, font=font(62, True), fill=LIME)
    text_block(layer, "COP AL MES", y + 135, 17, WHITE, True)
    text_block(layer, "≈ $1.000 al día · 0% comisión", y + 183, 17, MUTED)
    text_block(layer, "Prueba gratis durante 30 días", 690, 25, WHITE, True)
    text_block(layer, "Sin tarjeta para comenzar", 735, 16, MUTED)
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def scene_final(local, duration):
    image = base(); layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); brand(layer, 85)
    text_block(layer, "Dele a su negocio el control que merece", 260, 42, WHITE, True, 470, spacing=10)
    text_block(layer, "Empiece hoy con 30 días gratis", 445, 20, MUTED)
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((53, 565, 487, 645), 18, fill=LIME)
    cta = "QUIERO DIGITALIZAR MI NEGOCIO"; bbox = draw.textbbox((0, 0), cta, font=font(16, True))
    draw.text(((W-(bbox[2]-bbox[0]))//2, 591), cta, font=font(16, True), fill=GREEN)
    draw.text((94, 715), "WhatsApp", font=font(16, True), fill=MUTED)
    draw.text((94, 750), "+57 316 109 6811", font=font(29, True), fill=WHITE)
    draw.text((94, 810), "tupedido360.co", font=font(20, True), fill=LIME)
    layer.putalpha(int(255 * alpha_at(local, duration))); image.paste(layer, (0, 0), layer); return image


def soundtrack(path: Path):
    rate = 44100
    with wave.open(str(path), "wb") as wav:
        wav.setparams((2, 2, rate, DURATION * rate, "NONE", "not compressed"))
        chords = [(130.81, 164.81, 196.00), (146.83, 174.61, 220.00), (110.00, 138.59, 164.81), (98.00, 123.47, 146.83)]
        frames = bytearray()
        for i in range(DURATION * rate):
            t = i / rate; chord = chords[int(t / 2) % len(chords)]
            pad = sum(math.sin(2 * math.pi * f * t) for f in chord) / 3
            beat_phase = t % .5
            beat = math.sin(2 * math.pi * 70 * t) * math.exp(-beat_phase * 18)
            shimmer = math.sin(2 * math.pi * chord[2] * 2 * t) * .12
            fade = min(1, t / 1.2, (DURATION - t) / 1.5)
            sample = int(max(-1, min(1, (pad * .16 + beat * .12 + shimmer * .05) * fade)) * 32767)
            frames += sample.to_bytes(2, "little", signed=True) * 2
        wav.writeframes(frames)


def main():
    menu = Image.open(ASSETS / "menu.png").convert("RGB")
    audio = ROOT / "soundtrack.wav"; soundtrack(audio)
    output = ROOT / "tupedido360-vertical-v1.mp4"
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", str(audio), "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(output)]
    scenes = [(0, 5, scene_intro), (5, 10, scene_solution), (10, 16, lambda l, d: scene_menu(l, d, menu)), (16, 21, scene_order), (21, 27, scene_tools), (27, 33, scene_price), (33, 38, scene_final)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin
    for frame in range(DURATION * FPS):
        t = frame / FPS
        start, end, renderer = next(scene for scene in scenes if scene[0] <= t < scene[1])
        process.stdin.write(renderer(t - start, end - start).tobytes())
    process.stdin.close()
    if process.wait() != 0: raise SystemExit("FFmpeg no pudo exportar el video")
    print(output)


if __name__ == "__main__":
    main()
