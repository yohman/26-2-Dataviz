import base64
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen


class LocalEditorTest(unittest.TestCase):
    def test_save_reorders_and_duplicates_without_overwriting_existing_ink_slots(self):
        root = Path(__file__).resolve().parents[1]
        module = runpy.run_path(root / "scripts/lecture_editor_server.py")
        handler = module["EditorHandler"]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "week08.json"
            path.write_bytes((root / "content/slides/week08.json").read_bytes())
            handler.do_GET.__globals__["DECK_FILE"] = path
            handler.do_GET.__globals__["ROOT"] = Path(directory).resolve()
            with module["ThreadingHTTPServer"](("127.0.0.1", 0), handler) as server:
                server.token = "fixture-token"
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                try:
                    origin = f"http://127.0.0.1:{server.server_port}"
                    with urlopen(origin + "/api/deck") as response:
                        draft = json.load(response)
                    deck = draft["deck"]
                    first, second = deck["slides"][:2]
                    notes = {"ja": "改訂したノート", "en": "Revised notes"}
                    png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO/aFioAAAAASUVORK5CYII="
                    pixels = base64.b64decode(png)
                    image_path = f"{module['IMPORT_ROOT']}/{hashlib.sha256(pixels).hexdigest()}.png"
                    def row(slide, ident):
                        return {"id": ident, "sourceId": slide["id"], "title": slide["title"], "notes": notes}
                    body = json.dumps({
                        "revision": draft["revision"],
                        "images": {image_path: png},
                        "slides": [
                            row(second, second["id"]), row(first, "test-copy"),
                            {"id": "new-graphic", "sourceId": None,
                             "title": {"ja": "図を読む", "en": "Reading a chart"}, "notes": notes,
                             "content": {"layout": "split", "body": notes, "alt": notes,
                                         "image": image_path}},
                        ],
                    }).encode()
                    def save(caller):
                        return urlopen(Request(origin + "/api/deck", data=body, headers={
                            "Content-Type": "application/json", "X-Lecture-Editor": draft["token"], "Origin": caller,
                        }))
                    with self.assertRaises(HTTPError) as foreign:
                        save("https://example.org")
                    self.assertEqual(foreign.exception.code, 403)
                    with save(origin) as response:
                        result = json.load(response)["deck"]
                    self.assertEqual(result, json.loads(path.read_text()))
                    self.assertEqual([s["id"] for s in result["slides"]], [second["id"], "test-copy", "new-graphic"])
                    self.assertEqual([s["page"] for s in result["slides"]], [1, 2, 3])
                    self.assertEqual(result["slides"][0]["annotationPage"], second["annotationPage"])
                    self.assertGreater(result["slides"][1]["annotationPage"], max(s.get("annotationPage", s["page"]) for s in deck["slides"]))
                    self.assertEqual(result["slides"][1]["href"], first["href"])
                    self.assertEqual(result["slides"][1]["notes"], notes)
                    self.assertEqual(result["slides"][2]["kind"], "editable")
                    self.assertEqual(result["slides"][2]["content"]["body"], notes)
                    self.assertEqual(result["slides"][2]["content"]["image"], image_path)
                    with urlopen(origin + "/" + image_path) as asset:
                        self.assertEqual(asset.read(), pixels)
                    self.assertEqual([c["id"] for c in result["chapters"]], [second["id"]])
                    with self.assertRaises(HTTPError) as stale:
                        save(origin)
                    self.assertEqual(stale.exception.code, 409)
                    with self.assertRaises(ValueError):
                        module["decode_images"]({image_path: base64.b64encode(b"<svg></svg>").decode()})
                    for bad in ("javascript:alert(1)", "assets/images/../../secrets.png", "https://name:secret@example.org/a.png"):
                        with self.assertRaises(ValueError):
                            module["slide_image"](bad, required=True)
                finally:
                    server.shutdown()
                    thread.join()


if __name__ == "__main__":
    unittest.main()
