"""Zero-dependency checks for the public static landing page."""

from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree
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
        self.play_controls = []
        self.anchors = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.tags.add(tag)
        if tag == "a":
            self.anchors.append(values)
        if tag in ("a", "button") and "button-play" in values.get("class", "").split():
            self.play_controls.append((tag, values))
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
    # Keep a single stable Play Now entry on the landing page.
    assert len(parser.play_controls) == 1, "Landing page needs exactly one Play Now control"
    play_tag, play_attrs = parser.play_controls[0]
    play_entry = SITE / "play" / "index.html"
    if play_entry.is_file():
        assert play_entry.stat().st_size > 0, "Playable entrypoint is empty"
        assert play_tag == "a", "When playable, Play Now must be a real link"
        assert play_attrs.get("href") == "./play/", "Play Now must point to the deployed local game route"
        assert "disabled" not in play_attrs, "A playable link must be enabled"
        assert "No playable build yet" not in html, "Remove the not-yet-playable message when game ships"
    else:
        assert play_tag == "button", "Before gameplay exists, Play Now must not be a dead link"
        assert "disabled" in play_attrs, "Before gameplay exists, Play Now must be disabled"
        assert "No playable build yet" in html, "State clearly that no game is playable"
    assert "@media (max-width: 560px)" in css, "Phone layout rules are required"
    assert "prefers-reduced-motion" in css, "Respect reduced-motion settings"
    assert "<svg " in icon and "</svg>" in icon, "Favicon must be valid-looking SVG"

    def verify_links(page_parser, root):
        for attrs in page_parser.anchors:
            href = attrs.get("href", "")
            host = urlsplit(href).hostname
            if host in ("github.com", "discord.gg"):
                assert attrs.get("target") == "_blank", f"External community link must open a new tab: {href}"
                rel = set(attrs.get("rel", "").split())
                assert {"noopener", "noreferrer"}.issubset(rel), f"Missing secure new-tab rel: {href}"
            elif href.startswith(("#", "./", "../")):
                assert attrs.get("target") != "_blank", f"Internal site link must stay in same tab: {href}"
        for link in page_parser.links:
            parsed = urlsplit(link)
            if parsed.scheme in ("https", "http", "mailto"):
                continue
            if parsed.scheme or parsed.netloc:
                raise AssertionError(f"Unsupported link: {link}")
            if parsed.path:
                target = (root / unquote(parsed.path)).resolve()
                assert target.is_relative_to(SITE.resolve()), f"Link escapes site: {link}"
                assert target.exists(), f"Broken local link: {link}"
                if target.is_dir():
                    assert (target / "index.html").is_file(), f"Directory link lacks index.html: {link}"
            if parsed.fragment and not parsed.path:
                assert unquote(parsed.fragment) in page_parser.ids, f"Missing anchor: {link}"

    verify_links(parser, SITE)
    checked_links = len(parser.links)

    if play_entry.is_file():
        play_root = SITE / "play"
        required_game = ("index.html", "app.mjs", "engine.mjs", "game.css",
                         "assets/hunting.svg", "assets/mining.svg")
        for name in required_game:
            asset = play_root / name
            assert asset.is_file() and asset.stat().st_size, f"Missing game asset: {name}"
        game_html = play_entry.read_text(encoding="utf-8")
        game_parser = SiteParser()
        game_parser.feed(game_html)
        game_parser.close()
        assert game_parser.lang == "en", "Game must declare English document language"
        assert game_parser.stylesheet and game_parser.favicon, "Game CSS/favicon missing"
        assert {"game", "huntButton", "mineButton", "sceneImage", "returnPanel",
                "testDay", "logList"}.issubset(game_parser.ids), "Missing essential gameplay UI"
        verify_links(game_parser, play_root)
        checked_links += len(game_parser.links)
        for name in ("hunting.svg", "mining.svg"):
            picture = play_root / "assets" / name
            root = ElementTree.fromstring(picture.read_text(encoding="utf-8"))
            assert root.tag == "{http://www.w3.org/2000/svg}svg", f"Invalid SVG: {name}"
        assert "prefers-reduced-motion" in (play_root / "game.css").read_text(encoding="utf-8")

    print(f"PASS: landing page, Play Now contract, game assets and {checked_links} local/external links")


if __name__ == "__main__":
    check()
