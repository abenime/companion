#!/usr/bin/env python3
from __future__ import annotations

import html
import re
import shutil
import subprocess
import textwrap
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parent
BASE = ROOT / "companion-pitch-deck.pptx"
OUT = ROOT / "companion-pitch-deck.pptx"
FINAL_COPY = ROOT / "companion-pitch-deck-final.pptx"
TMP_DIR = ROOT / ".pptx_render"
TMP_PPTX = ROOT / "companion-pitch-deck.tmp.pptx"

SLIDE_W = 1600
SLIDE_H = 900
EMU_W = 9144000
EMU_H = 5143500

BG = "#101417"
PANEL = "#182025"
PANEL2 = "#202B31"
INK = "#F3F6F0"
MUTED = "#AEB7AD"
SUBTLE = "#748074"
SAGE = "#8E9F8E"
SAGE2 = "#C5D2BD"
AMBER = "#D9B48F"
TERRA = "#D17E73"
CYAN = "#7EB7C7"
VIOLET = "#B79ADB"
DARK = "#080B0D"

NS_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types"


def e(text: str) -> str:
    return html.escape(text, quote=True)


def wrap(text: str, chars: int) -> list[str]:
    return textwrap.wrap(text, width=chars, break_long_words=False, replace_whitespace=False)


def text_svg(
    x: int,
    y: int,
    text: str | list[str],
    size: int,
    color: str = INK,
    weight: int = 400,
    anchor: str = "start",
    line_gap: float = 1.18,
    family: str = "Inter, Aptos, Arial, sans-serif",
    opacity: float = 1.0,
) -> str:
    lines = [text] if isinstance(text, str) else text
    spans = []
    for idx, line in enumerate(lines):
        dy = "0" if idx == 0 else f"{size * line_gap}"
        spans.append(f'<tspan x="{x}" dy="{dy}">{e(line)}</tspan>')
    return (
        f'<text x="{x}" y="{y}" fill="{color}" opacity="{opacity}" '
        f'font-family="{family}" font-size="{size}" font-weight="{weight}" '
        f'text-anchor="{anchor}">{"".join(spans)}</text>'
    )


def rect(x: int, y: int, w: int, h: int, fill: str, stroke: str = "rgba(255,255,255,.12)", rx: int = 16, opacity: float = 1.0, sw: int = 1) -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" opacity="{opacity}" stroke="{stroke}" stroke-width="{sw}"/>'


def circle(cx: int, cy: int, r: int, fill: str = "none", stroke: str = SAGE, sw: int = 5, opacity: float = 1.0) -> str:
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"/>'


def pill(x: int, y: int, text: str, color: str = SAGE) -> tuple[str, int]:
    w = max(135, min(260, len(text) * 10 + 34))
    svg = rect(x, y, w, 42, color, stroke=color, rx=21, opacity=0.18)
    svg += text_svg(x + w // 2, y + 27, text.upper(), 12, SAGE2 if color == SAGE else INK, 800, "middle")
    return svg, w


def chrome(section: str, num: int) -> str:
    out = []
    out.append(circle(92, 68, 26, fill=SAGE, stroke="none"))
    out.append(text_svg(92, 78, "C", 26, BG, 900, "middle"))
    out.append(text_svg(140, 78, "COMPANION", 18, SAGE2, 800))
    out.append(text_svg(1490, 78, section.upper(), 15, MUTED, 800, "end"))
    out.append(rect(76, 852, 360, 6, SAGE, stroke="none", rx=3))
    out.append(rect(436, 852, 190, 6, AMBER, stroke="none", rx=3))
    out.append(rect(626, 852, 120, 6, TERRA, stroke="none", rx=3))
    out.append(text_svg(1490, 850, f"{num:02d}/10", 13, SUBTLE, 800, "end"))
    return "\n".join(out)


def svg_open(section: str, num: int) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{SLIDE_W}" height="{SLIDE_H}" viewBox="0 0 {SLIDE_W} {SLIDE_H}">',
        "<defs>",
        '<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#101417"/><stop offset=".58" stop-color="#141A1D"/><stop offset="1" stop-color="#0F1518"/></linearGradient>',
        '<pattern id="grid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke="rgba(255,255,255,.035)" stroke-width="1"/></pattern>',
        '<filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity=".32"/></filter>',
        "</defs>",
        '<rect width="1600" height="900" fill="url(#bg)"/>',
        '<rect width="1600" height="900" fill="url(#grid)"/>',
        chrome(section, num),
    ]


def svg_close(parts: list[str]) -> str:
    parts.append("</svg>")
    return "\n".join(parts)


def title(parts: list[str], eyebrow: str, headline: str, sub: str | None = None, width_chars: int = 26) -> None:
    parts.append(text_svg(115, 178, eyebrow.upper(), 17, SAGE, 850))
    parts.append(text_svg(115, 250, wrap(headline, width_chars), 58, INK, 850, line_gap=1.05))
    if sub:
        parts.append(text_svg(115, 465, wrap(sub, 48), 29, MUTED, 450, line_gap=1.28))


def card(x: int, y: int, w: int, h: int, label: str, heading: str, body: str, accent: str = SAGE, body_chars: int = 30, heading_size: int = 28, body_size: int = 20) -> str:
    out = [f'<g filter="url(#softShadow)">', rect(x, y, w, h, PANEL, rx=18, opacity=0.94), "</g>"]
    out.append(circle(x + 44, y + 44, 24, fill=accent, stroke="none"))
    out.append(text_svg(x + 44, y + 53, label, 17, BG, 900, "middle"))
    heading_y = y + 92
    if h <= 180:
        body_y = y + 126
    elif h <= 230:
        body_y = y + 146
    else:
        body_y = y + 164
    out.append(text_svg(x + 28, heading_y, wrap(heading, 20), heading_size, INK, 800, line_gap=1.06))
    out.append(text_svg(x + 28, body_y, wrap(body, body_chars), body_size, MUTED, 430, line_gap=1.16))
    return "\n".join(out)


def orbit(cx: int = 1240, cy: int = 475, size: int = 430) -> str:
    out = []
    out.append(circle(cx, cy, size // 2, stroke=CYAN, sw=9, opacity=0.55))
    out.append(circle(cx, cy, size // 2 - 55, stroke=AMBER, sw=8, opacity=0.55))
    out.append(circle(cx, cy, size // 2 - 112, stroke=SAGE, sw=9, opacity=0.75))
    out.append(circle(cx, cy, 62, fill=SAGE, stroke="none"))
    out.append(text_svg(cx, cy + 20, "C", 52, BG, 900, "middle"))
    return "\n".join(out)


def phone_mock(x: int = 1120, y: int = 150) -> str:
    out = []
    out.append(rect(x, y, 350, 620, DARK, stroke="#000", rx=44, sw=3))
    out.append(rect(x + 22, y + 28, 306, 564, "#12161A", stroke="rgba(255,255,255,.10)", rx=32))
    out.append(text_svg(x + 52, y + 80, "WELLNESS ORBIT", 13, SAGE2, 850))
    out.append(rect(x + 247, y + 62, 54, 26, SAGE, stroke=SAGE, rx=13, opacity=0.22))
    out.append(text_svg(x + 274, y + 80, "LIVE", 9, SAGE2, 850, "middle"))
    out.append(circle(x + 175, y + 205, 82, stroke=SAGE, sw=9, opacity=0.72))
    out.append(text_svg(x + 175, y + 225, "85", 48, INK, 850, "middle"))
    out.append(text_svg(x + 175, y + 335, "Your cognitive load is steady", 18, INK, 750, "middle"))
    out.append(rect(x + 52, y + 388, 108, 78, PANEL2, stroke="rgba(255,255,255,.10)", rx=16))
    out.append(text_svg(x + 106, y + 420, "Energy", 12, MUTED, 500, "middle"))
    out.append(text_svg(x + 106, y + 452, "85", 31, INK, 850, "middle"))
    out.append(rect(x + 190, y + 388, 108, 78, PANEL2, stroke="rgba(255,255,255,.10)", rx=16))
    out.append(text_svg(x + 244, y + 420, "Focus", 12, MUTED, 500, "middle"))
    out.append(text_svg(x + 244, y + 452, "90", 31, INK, 850, "middle"))
    out.append(rect(x + 52, y + 505, 246, 58, PANEL, stroke=SAGE, rx=16, opacity=0.95))
    out.append(text_svg(x + 175, y + 541, "Start 60s reset?", 17, INK, 850, "middle"))
    return "\n".join(out)


def slide_svgs() -> list[str]:
    slides: list[str] = []

    p = svg_open("Hackathon Pitch", 1)
    title(p, "Behavioral wellness, made simple", "Companion", "A wellness app that notices when your daily patterns change and helps before stress builds up.", 20)
    p.append(text_svg(115, 635, wrap("Understanding wellness through behavior, not questionnaires.", 45), 34, AMBER, 800))
    x = 115
    for txt in ["No mood journal", "Works quietly", "Privacy first", "Built to demo"]:
        item, w = pill(x, 735, txt)
        p.append(item)
        x += w + 18
    p.append(orbit(1245, 465, 470))
    slides.append(svg_close(p))

    p = svg_open("The Problem", 2)
    title(p, "People do not log how they feel every day", "Wellness apps depend on the hardest habit: remembering to check in.", "When someone is tired, stressed, or overloaded, they are least likely to open an app and explain it clearly.", 27)
    p.append(card(1030, 145, 420, 180, "1", "They forget", "Manual tracking fades after the first few days.", TERRA, 36, 26, 18))
    p.append(card(1030, 355, 420, 180, "2", "They notice too late", "Stress shows up in sleep, focus, movement, and screen habits.", AMBER, 36, 26, 18))
    p.append(card(1030, 565, 420, 180, "3", "Incomplete picture", "A phone app alone cannot see work and rest patterns together.", CYAN, 36, 26, 18))
    slides.append(svg_close(p))

    p = svg_open("The Whole System", 3)
    title(p, "How Companion works in simple words", "It notices patterns, understands what changed, and suggests one helpful next step.", None, 44)
    p.append(card(120, 435, 390, 250, "1", "Notice", "Approved signals like sleep, movement, screen time, work switching, and rest breaks.", SAGE, 28, 30, 21))
    p.append(card(605, 435, 390, 250, "2", "Understand", "Compares today with the user's normal routine, so advice is personal.", AMBER, 28, 30, 21))
    p.append(card(1090, 435, 390, 250, "3", "Support", "Offers a calm recommendation, chat explanation, or quick breathing reset.", CYAN, 28, 30, 21))
    p.append(text_svg(800, 770, wrap("The user does not need to diagnose themselves. The system turns everyday behavior into early support.", 78), 25, AMBER, 800, "middle"))
    slides.append(svg_close(p))

    p = svg_open("Why Different", 4)
    title(p, "What makes this project stand out", "Companion is not another mood tracker. It is a proactive wellness companion.", None, 38)
    p.append(card(120, 355, 390, 220, "A", "Passive by design", "Users do not have to fill out daily forms for the app to become useful.", SAGE, 30, 28, 20))
    p.append(card(605, 355, 390, 220, "B", "Cross-device view", "It combines life signals and work signals into one wellness picture.", AMBER, 30, 28, 20))
    p.append(card(1090, 355, 390, 220, "C", "Action, not just charts", "It explains the change and offers a small intervention immediately.", CYAN, 30, 28, 20))
    bars = [54, 80, 118, 168, 208, 190, 250]
    for idx, bh in enumerate(bars):
        p.append(rect(145 + idx * 62, 785 - bh, 30, bh, TERRA if idx > 3 else SAGE, stroke="none", rx=15, opacity=0.9))
    p.append(text_svg(725, 675, "Forecasting reveals risk before it becomes visible.", 32, INK, 850))
    p.append(text_svg(725, 725, wrap("Passive signals become timely support instead of another static mood chart.", 58), 22, MUTED, 450))
    slides.append(svg_close(p))

    p = svg_open("Product Experience", 5)
    title(p, "What the user sees", "A calm home screen, a clear forecast, and one useful action.", "No guilt, no streak pressure, no noisy dashboard.", 31)
    x = 115
    for txt, color in [("Wellness Orbit", SAGE), ("Burnout forecast", TERRA), ("Companion chat", CYAN), ("Guided breathing", AMBER)]:
        item, w = pill(x, 650, txt, color)
        p.append(item)
        x += w + 18
    p.append(phone_mock(1095, 145))
    slides.append(svg_close(p))

    p = svg_open("Privacy & Trust", 6)
    title(p, "Wellness support should not feel like surveillance", "Companion uses signals, not personal content.", "Users stay in control of what is collected, ignored, and deleted.", 37)
    p.append(card(105, 420, 325, 220, "1", "No private content", "No messages, screenshots, typed words, or personal documents.", SAGE, 25, 25, 19))
    p.append(card(465, 420, 325, 220, "2", "User approval", "Collection starts from clear permission and onboarding choices.", CYAN, 25, 25, 19))
    p.append(card(825, 420, 325, 220, "3", "Skip sensitive apps", "Users can ignore banking, password, work, or private apps.", AMBER, 25, 25, 19))
    p.append(card(1185, 420, 325, 220, "4", "Delete controls", "Delete today's logs or purge all telemetry.", TERRA, 25, 25, 19))
    slides.append(svg_close(p))

    p = svg_open("What We Built", 7)
    title(p, "Real product depth for the hackathon", "The demo is already built across user, support, and admin experiences.", None, 43)
    features = [
        ("1", "Mobile app", "Onboarding, dashboard, settings, forecasts, breathing.", SAGE),
        ("2", "Web dashboard", "Login, live scores, chat, forecast chart, privacy controls.", CYAN),
        ("3", "Desktop collector", "Work rhythm, idle time, task switching, local buffer.", AMBER),
        ("4", "Wellness reasoning", "Pattern changes become risk, explanation, and action.", VIOLET),
        ("5", "Notifications", "Timely interventions when risk rises.", SAGE),
        ("6", "Privacy center", "Toggles, ignored apps, and delete controls.", CYAN),
        ("7", "Admin console", "User health, subscriptions, pricing, purge actions.", AMBER),
        ("8", "Business layer", "Free, premium, and organization plan structure.", TERRA),
    ]
    for idx, (label, heading, body, color) in enumerate(features):
        col = idx % 4
        row = idx // 4
        p.append(card(85 + col * 380, 345 + row * 220, 335, 175, label, heading, body, color, 36, 23, 16))
    slides.append(svg_close(p))

    p = svg_open("Demo", 8)
    title(p, "What judges will see", "From everyday behavior to a useful wellness action.", None, 42)
    steps = [
        ("01", "Start with consent", "Show onboarding, profile setup, and privacy choices.", SAGE),
        ("02", "Show the dashboard", "Energy, focus, stress, risk, and the Wellness Orbit.", CYAN),
        ("03", "Explain the insight", "Ask why focus dropped or why risk changed.", AMBER),
        ("04", "Take action", "Launch a breathing reset or show a timely recommendation.", TERRA),
    ]
    for idx, (num, heading, body, color) in enumerate(steps):
        x = 120 + idx * 370
        p.append(rect(x, 380, 310, 335, PANEL, rx=20, opacity=0.95))
        p.append(text_svg(x + 36, 465, num, 58, color, 900))
        p.append(text_svg(x + 36, 548, wrap(heading, 17), 26, INK, 850, line_gap=1.1))
        p.append(text_svg(x + 36, 635, wrap(body, 26), 19, MUTED, 450, line_gap=1.16))
    slides.append(svg_close(p))

    p = svg_open("Business Model", 9)
    title(p, "Subscription with organization expansion", "Start with individuals, then expand to schools, companies, and wellness programs.", None, 44)
    plans = [
        ("FREE", "$0", "Basic monitoring and privacy controls.", "Low-friction adoption", SAGE),
        ("PREMIUM", "$9.99", "Forecasts, deeper insights, explanations, and interventions.", "Recurring revenue", AMBER),
        ("ORGANIZATIONS", "B2B", "Aggregate wellness trends with privacy protection.", "Scalable expansion", CYAN),
    ]
    for idx, (name, price, body, foot, color) in enumerate(plans):
        x = 135 + idx * 455
        p.append(rect(x, 350, 360, 350, PANEL, stroke=color, rx=22, opacity=0.96, sw=2))
        p.append(text_svg(x + 38, 425, name, 18, color, 850))
        p.append(text_svg(x + 38, 505, price, 58, SAGE2, 900))
        p.append(text_svg(x + 38, 585, wrap(body, 27), 21, MUTED, 450, line_gap=1.18))
        p.append(text_svg(x + 38, 680, foot, 17, INK, 850))
    slides.append(svg_close(p))

    p = svg_open("Vision", 10)
    title(p, "Where this goes next", "Wellness technology should support people before problems become visible.", "Companion can become the personal wellness layer that understands routine, protects privacy, and gives timely help.", 30)
    p.append(text_svg(115, 685, wrap("From reactive mood tracking to proactive behavioral wellness.", 42), 32, AMBER, 850))
    p.append(card(1055, 160, 400, 150, "1", "For users", "Less logging, more useful support.", SAGE, 28, 26, 19))
    p.append(card(1055, 355, 400, 170, "2", "For organizations", "Earlier wellness signals without personal content.", AMBER, 28, 26, 19))
    p.append(card(1055, 570, 400, 170, "3", "For judges", "A complete platform with a clear demo and growth path.", CYAN, 28, 26, 19))
    slides.append(svg_close(p))

    return slides


def render_pngs(svgs: list[str]) -> list[Path]:
    if shutil.which("rsvg-convert") is None:
        raise SystemExit("rsvg-convert is required to render the PowerPoint slide images.")
    TMP_DIR.mkdir(exist_ok=True)
    pngs = []
    for idx, svg in enumerate(svgs, start=1):
        svg_path = TMP_DIR / f"slide{idx}.svg"
        png_path = TMP_DIR / f"slide{idx}.png"
        svg_path.write_text(svg, encoding="utf-8")
        subprocess.run(
            ["rsvg-convert", "-w", "1920", "-h", "1080", "-f", "png", "-o", str(png_path), str(svg_path)],
            check=True,
        )
        pngs.append(png_path)
    return pngs


def image_slide_xml(rel_id: str = "rIdImage") -> bytes:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="Designed slide"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="{rel_id}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="{EMU_W}" cy="{EMU_H}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>""".encode("utf-8")


def add_png_content_type(content_types: bytes) -> bytes:
    root = ET.fromstring(content_types)
    has_png = any(el.attrib.get("Extension") == "png" for el in root.findall(f"{{{NS_CT}}}Default"))
    if not has_png:
        default = ET.Element(f"{{{NS_CT}}}Default", {"Extension": "png", "ContentType": "image/png"})
        root.insert(0, default)
    ET.register_namespace("", NS_CT)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_rels(original: bytes, slide_num: int) -> bytes:
    root = ET.fromstring(original)
    for child in list(root):
        if child.attrib.get("Id") == "rIdImage" or "companion-slide" in child.attrib.get("Target", ""):
            root.remove(child)
    rel = ET.Element(
        f"{{{NS_REL}}}Relationship",
        {
            "Id": "rIdImage",
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            "Target": f"../media/companion-slide{slide_num}.png",
        },
    )
    root.append(rel)
    ET.register_namespace("", NS_REL)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def package_pptx(pngs: list[Path]) -> None:
    slide_re = re.compile(r"ppt/slides/slide(\d+)\.xml$")
    rel_re = re.compile(r"ppt/slides/_rels/slide(\d+)\.xml\.rels$")
    written_media: set[str] = set()

    with zipfile.ZipFile(BASE, "r") as zin, zipfile.ZipFile(TMP_PPTX, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            name = item.filename
            if name.startswith("ppt/media/companion-slide") and name.endswith(".png"):
                continue
            data = zin.read(name)

            slide_match = slide_re.match(name)
            rel_match = rel_re.match(name)
            if slide_match:
                num = int(slide_match.group(1))
                if 1 <= num <= len(pngs):
                    data = image_slide_xml()
            elif rel_match:
                num = int(rel_match.group(1))
                if 1 <= num <= len(pngs):
                    data = rewrite_rels(data, num)
            elif name == "[Content_Types].xml":
                data = add_png_content_type(data)

            zout.writestr(item, data)

        for idx, png in enumerate(pngs, start=1):
            media_name = f"ppt/media/companion-slide{idx}.png"
            if media_name not in written_media:
                zout.writestr(media_name, png.read_bytes())
                written_media.add(media_name)

    TMP_PPTX.replace(OUT)
    shutil.copy2(OUT, FINAL_COPY)


def main() -> None:
    svgs = slide_svgs()
    pngs = render_pngs(svgs)
    package_pptx(pngs)


if __name__ == "__main__":
    main()
