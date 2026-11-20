"""Loopback-only Week 8 slide editor. Run from the course checkout."""
import argparse
import base64
import binascii
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DECK_FILE = ROOT / "content/slides/week08.json"
MAX_REQUEST = 48 * 1024 * 1024
MAX_IMAGE = 10 * 1024 * 1024
MAX_IMAGE_BATCH = 30 * 1024 * 1024
IMPORT_ROOT = "assets/images/lecture/editor-imports"
ID = re.compile(r"[a-z0-9][a-z0-9-]{0,79}")
IMAGE = re.compile(r"assets/images/[a-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg|avif)", re.I)
WRITE_LOCK = threading.Lock()


def revision(raw):
    return hashlib.sha256(raw).hexdigest()


def localized(value, *, required, limit):
    if not isinstance(value, dict) or set(value) != {"ja", "en"}:
        raise ValueError("Both languages are required.")
    if any(not isinstance(s, str) or len(s) > limit or (required and not s.strip()) for s in value.values()):
        raise ValueError("Check the text lengths for both languages.")
    return value


def slide_image(value, *, required=False, staged=()):
    if value == "" and not required:
        return value
    if not isinstance(value, str) or len(value) > 2000 or re.search(r"[\s\\<>\"']", value):
        raise ValueError("Use a course image path or an HTTPS image URL.")
    if IMAGE.fullmatch(value) and all(p not in {"", ".", ".."} for p in value.split("/")):
        if value in staged:
            return value
        image = (ROOT / value).resolve()
        if image.is_relative_to(ROOT / "assets/images") and image.is_file():
            return value
        raise ValueError("That course image was not found.")
    parsed = urlsplit(value)
    if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password:
        return value
    raise ValueError("Use a course image path or an HTTPS image URL.")


def slide_content(value, staged=()):
    if not isinstance(value, dict) or value.get("layout") not in ("type", "split", "figure"):
        raise ValueError("Choose a valid slide layout.")
    layout = value["layout"]
    return {
        "layout": layout,
        "body": localized(value.get("body"), required=False, limit=480),
        "image": slide_image(value.get("image", ""), required=layout != "type", staged=staged),
        "alt": localized(value.get("alt"), required=False, limit=250),
    }


def apply_edits(deck, rows, staged=()):
    if not isinstance(rows, list) or not 1 <= len(rows) <= 200:
        raise ValueError("A deck must contain between 1 and 200 slides.")
    originals = {slide["id"]: slide for slide in deck["slides"]}
    highest = max(slide.get("annotationPage", slide["page"]) for slide in originals.values())
    next_slot = max(deck.get("nextAnnotationPage", 1), highest + 1)
    new_slides, seen = [], set()
    for page, row in enumerate(rows, 1):
        if not isinstance(row, dict):
            raise ValueError("Invalid slide.")
        ident, source = row.get("id"), row.get("sourceId")
        if not isinstance(ident, str) or not ID.fullmatch(ident) or ident in seen:
            raise ValueError("Invalid or duplicate slide ID.")
        is_blank = source is None and ident not in originals
        if not is_blank and (not isinstance(source, str) or source not in originals or (ident in originals and source != ident)):
            raise ValueError("Invalid slide source. Reload the editor.")
        slide = {**({"kind": "editable"} if is_blank else originals[source]), "id": ident, "page": page}
        title = localized(row.get("title"), required=True, limit=250)
        notes = localized(row.get("notes"), required=False, limit=8000)
        slide.update(title=title, notes=notes)
        if "content" in row:
            if row["content"] is None:
                slide.pop("content", None)
            else:
                slide["content"] = slide_content(row["content"], staged)
        if slide["kind"] == "editable" and not slide.get("content"):
            raise ValueError("A new slide needs an editable layout.")
        if "image" in row and row["image"] != slide.get("image"):
            if "image" not in slide:
                raise ValueError("Use an image layout to add an image.")
            slide["image"] = slide_image(row["image"], required=True, staged=staged)
        if "steps" in row and row["steps"] != slide.get("steps"):
            if "steps" not in slide:
                raise ValueError("This layout has no editable steps.")
            steps = localized(row["steps"], required=False, limit=480)
            slide["steps"] = {lang: [line.strip() for line in text.splitlines() if line.strip()] for lang, text in steps.items()}
        if "caption" in row and row["caption"] != slide.get("caption"):
            if "caption" not in slide:
                raise ValueError("This layout has no editable caption.")
            slide["caption"] = localized(row["caption"], required=False, limit=480)
        if ident not in originals:
            slide["annotationPage"] = next_slot
            next_slot += 1
        else:
            slide["annotationPage"] = originals[ident].get("annotationPage", originals[ident]["page"])
        new_slides.append(slide)
        seen.add(ident)
    order = {slide["id"]: i for i, slide in enumerate(new_slides)}
    chapters = sorted((c for c in deck.get("chapters", []) if c["id"] in seen), key=lambda c: order[c["id"]])
    return {**deck, "chapters": chapters, "slides": new_slides, "nextAnnotationPage": next_slot}


def imported_image_type(raw):
    if raw.startswith(b"\x89PNG\r\n\x1a\n") and raw[12:16] == b"IHDR":
        return "png"
    if raw.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if raw.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return "webp"
    return None


def decode_images(values):
    if not isinstance(values, dict) or len(values) > 200:
        raise ValueError("Invalid slide image upload.")
    staged, total = {}, 0
    for path, image in values.items():
        if not isinstance(image, str) or len(image) > (MAX_IMAGE + 2) // 3 * 4:
            raise ValueError("Each image must be 10 MB or smaller.")
        try:
            raw = base64.b64decode(image, validate=True)
        except (binascii.Error, ValueError) as error:
            raise ValueError("Could not read that image.") from error
        total += len(raw)
        if len(raw) > MAX_IMAGE or total > MAX_IMAGE_BATCH:
            raise ValueError("Save no more than 30 MB of new images at once.")
        extension = imported_image_type(raw)
        if not extension or path != f"{IMPORT_ROOT}/{revision(raw)}.{extension}":
            raise ValueError("Choose a PNG, JPEG, WebP, or GIF image.")
        staged[path] = raw
    return staged


def save_with_images(deck, staged):
    referenced = {path for slide in deck["slides"] for path in (slide.get("image"), slide.get("content", {}).get("image"))}
    if set(staged) - referenced:
        raise ValueError("A new image is no longer on a slide. Retry the save.")
    folder = ROOT / IMPORT_ROOT
    created = []
    try:
        if staged:
            folder.mkdir(parents=True, exist_ok=True)
            if folder.resolve() != folder:
                raise OSError("Image folder points outside its expected location.")
        for path, raw in staged.items():
            file = ROOT / path
            if file.is_symlink():
                raise OSError("Unexpected link in the image folder.")
            if file.exists():
                if file.read_bytes() != raw:
                    raise OSError("An imported image file has changed.")
                continue
            with tempfile.NamedTemporaryFile(dir=folder, delete=False) as stream:
                temp = Path(stream.name)
                try:
                    stream.write(raw)
                    stream.flush()
                    os.replace(temp, file)
                    created.append(file)
                finally:
                    temp.unlink(missing_ok=True)
        return write_deck(deck)
    except OSError:
        for file in created:
            file.unlink(missing_ok=True)
        raise


def write_deck(deck):
    payload = (json.dumps(deck, ensure_ascii=False, indent=2) + "\n").encode()
    with tempfile.NamedTemporaryFile(dir=DECK_FILE.parent, delete=False) as file:
        temp = Path(file.name)
        try:
            file.write(payload)
            file.flush()
            os.fsync(file.fileno())
            temp.chmod(DECK_FILE.stat().st_mode & 0o777)
            os.replace(temp, DECK_FILE)
        finally:
            temp.unlink(missing_ok=True)
    return payload


class EditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    @property
    def host(self):
        return f"127.0.0.1:{self.server.server_port}"

    def send_json(self, status, value):
        raw = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def allowed_static(self, path):
        item = Path(self.translate_path(path)).resolve()
        if not item.is_relative_to(ROOT) or not item.is_file():
            return False
        parts = item.relative_to(ROOT).parts
        return (
            parts[0] == "assets"
            or parts == ("content", "slides", "week08.json")
            or parts == ("data", "week07-examples.json")
            or len(parts) == 1 and parts[0] in {"lecture-edit.html", "lecture.html", "favicon.svg"}
        )

    def do_GET(self):
        if self.headers.get("Host") != self.host:
            self.send_error(403)
        elif urlsplit(self.path).path == "/api/deck":
            raw = DECK_FILE.read_bytes()
            self.send_json(200, {"deck": json.loads(raw), "revision": revision(raw), "token": self.server.token, "editorVersion": 3})
        elif self.allowed_static(self.path):
            super().do_GET()
        else:
            self.send_error(404)

    def do_HEAD(self):
        if self.headers.get("Host") == self.host and self.allowed_static(self.path):
            super().do_HEAD()
        else:
            self.send_error(404)

    def do_POST(self):
        if (
            urlsplit(self.path).path != "/api/deck"
            or self.headers.get("Host") != self.host
            or self.headers.get("Origin") != f"http://{self.host}"
            or self.headers.get("X-Lecture-Editor") != self.server.token
        ):
            self.send_error(403)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_REQUEST or self.headers.get_content_type() != "application/json":
                raise ValueError("Invalid edit request.")
            request = json.loads(self.rfile.read(size))
            if not isinstance(request, dict):
                raise ValueError("Invalid edit request.")
            with WRITE_LOCK:
                raw = DECK_FILE.read_bytes()
                if request.get("revision") != revision(raw):
                    self.send_json(409, {"error": "The source deck changed. Reload before saving."})
                    return
                staged = decode_images(request.get("images", {}))
                deck = apply_edits(json.loads(raw), request.get("slides"), staged)
                saved = save_with_images(deck, staged)
            self.send_json(200, {"deck": deck, "revision": revision(saved)})
        except ValueError as error:
            self.send_json(400, {"error": str(error)})
        except OSError:
            self.send_json(500, {"error": "Could not write the deck to the local checkout."})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8768)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), EditorHandler)
    server.token = secrets.token_urlsafe(32)
    print(f"Week 8 editor: http://127.0.0.1:{server.server_port}/lecture-edit.html", flush=True)
    server.serve_forever()
