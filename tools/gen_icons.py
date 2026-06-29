#!/usr/bin/env python3
"""Generate PWA/iOS PNG icons from scratch using only the Python stdlib.
Draws a rounded sky-blue tile with a simple white airplane glyph.
Outputs: icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon-180.png
"""
import os, math, struct, zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")
BG_TOP = (16, 58, 102)      # deep sky
BG_BOT = (44, 122, 196)     # lighter sky
PLANE = (245, 250, 255)
ACCENT = (255, 209, 102)

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def point_in_poly(px, py, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi):
            inside = not inside
        j = i
    return inside

def make_icon(size, maskable=False):
    # RGBA buffer
    buf = bytearray(size * size * 4)
    cx = size / 2.0
    r = size * (0.5 if maskable else 0.46)        # tile radius
    corner = size * 0.22                           # rounded-corner radius
    pad = (size - 2 * r) / 2 if not maskable else 0

    # Plane polygon (top-down silhouette), defined in a unit space then scaled.
    s = size
    fuse_w = s * 0.06
    poly_body = [
        (cx, s * 0.20),                 # nose
        (cx + fuse_w, s * 0.52),
        (cx + fuse_w, s * 0.66),
        (cx, s * 0.74),                 # tail point
        (cx - fuse_w, s * 0.66),
        (cx - fuse_w, s * 0.52),
    ]
    poly_wing = [
        (cx, s * 0.40),
        (cx + s * 0.30, s * 0.60),
        (cx + s * 0.30, s * 0.66),
        (cx, s * 0.54),
        (cx - s * 0.30, s * 0.66),
        (cx - s * 0.30, s * 0.60),
    ]
    poly_tail = [
        (cx, s * 0.66),
        (cx + s * 0.12, s * 0.76),
        (cx + s * 0.12, s * 0.80),
        (cx, s * 0.74),
        (cx - s * 0.12, s * 0.80),
        (cx - s * 0.12, s * 0.76),
    ]

    for y in range(size):
        ty = y / (size - 1)
        bg = lerp(BG_TOP, BG_BOT, ty)
        for x in range(size):
            idx = (y * size + x) * 4
            # rounded tile mask
            inside_tile = True
            if not maskable:
                dx = max(abs(x - cx) - (r - corner), 0)
                dy = max(abs(y - cx) - (r - corner), 0)
                inside_tile = (dx * dx + dy * dy) <= corner * corner or \
                              (abs(x - cx) <= r - corner and abs(y - cx) <= r) or \
                              (abs(y - cx) <= r - corner and abs(x - cx) <= r)
            if not inside_tile:
                buf[idx:idx+4] = bytes((0, 0, 0, 0))
                continue
            col = bg
            if point_in_poly(x, y, poly_body) or point_in_poly(x, y, poly_wing) or point_in_poly(x, y, poly_tail):
                col = PLANE
            buf[idx] = col[0]; buf[idx+1] = col[1]; buf[idx+2] = col[2]; buf[idx+3] = 255
    return bytes(buf)

def write_png(path, size, rgba):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)  # filter type 0
        raw.extend(rgba[y*stride:(y+1)*stride])
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)

def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("apple-touch-icon-180.png", 180, False),
        ("maskable-512.png", 512, True),
    ]
    for name, size, mask in jobs:
        rgba = make_icon(size, mask)
        write_png(os.path.join(OUT, name), size, rgba)
        print("wrote", name)

if __name__ == "__main__":
    main()
