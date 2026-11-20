"""Zero-dependency checks for the public static landing page."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


SITE = Path(__file__).resolve().parents[1] / "site"


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.tags = set()
        self.lang = None
        self.stylesheet = False
        self.favicon = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.tags.add(tag)
        if tag == "html":
            self.lang = values.get("lang")
        if values.get("id"):
            assert values["id"] not in self.ids, f"Duplicate HTML ID: {values['id']}"
            self.ids.add(values["id"])
        for key in ("href", "src"):
            if values.get(key):
                self.links.append(values[key])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.stylesheet = True
        if tag == "link" and values.get("rel") == "icon":
            self.favicon = True


def check():
    required = ("index.html", "styles.css", "favicon.svg")
    for name in required:
        path = SITE / name
        assert path.is_file() and path.stat().st_size > 0, f"Missing or empty {name}"

    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "styles.css").read_text(encoding="utf-8")
    icon = (SITE / "favicon.svg").read_text(encoding="utf-8")
    parser = SiteParser()
    parser.feed(html)
    parser.close()

    assert parser.lang == "en", "Declare the document language"
    assert parser.stylesheet and parser.favicon, "Stylesheet and icon are required"
    assert {"header", "nav", "main", "footer", "h1", "h2"}.issubset(parser.tags)
    assert {"main", "vision", "library"}.issubset(parser.ids)
    assert "No playable build yet" in html, "Do not claim the game is playable"
    assert "@media (max-width: 560px)" in css, "Phone layout rules are required"
    assert "prefers-reduced-motion" in css, "Respect reduced-motion settings"
    assert "<svg " in icon and "</svg>" in icon, "Favicon must be valid-looking SVG"

    for link in parser.links:
        parsed = urlsplit(link)
        if parsed.scheme in ("https", "http", "mailto"):
            continue
        if parsed.scheme or parsed.netloc:
            raise AssertionError(f"Unsupported link: {link}")
        if parsed.path:
            target = (SITE / unquote(parsed.path)).resolve()
            assert target.is_relative_to(SITE.resolve()), f"Link escapes site: {link}"
            assert target.exists(), f"Broken local link: {link}"
        if parsed.fragment:
            assert unquote(parsed.fragment) in parser.ids, f"Missing anchor: {link}"

    print(f"PASS: static landing page structure, local assets and {len(parser.links)} links")


if __name__ == "__main__":
    check()
