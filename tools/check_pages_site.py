"""Zero-dependency checks for the public static landing page."""

from html.parser import HTMLParser
import re
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
    for phrase in ("The Long Vigil", "Life beyond the arena", "Earn your equipment", "may be reset", "Progression limits prevent endless rewards"):
        assert phrase in html, f"Missing current alpha landing information: {phrase}"
    assert "hobby" in parser.ids, "Hobby-project statement must be on landing page"
    for phrase in ("A Hobby,", "Not a Business", "personal hobby project, not a business model", "coding and game development", "reliable servers", "hosting and development costs", "loss of progress are possible", "Constructive feedback is always welcome"):
        assert phrase in html, f"Missing HOBBY-002 statement: {phrase}"
    assert "It will always be 100% free." not in html
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

    # Exact owner-approved arena image, not the previous gate concept.
    hero_path = SITE / "assets" / "gladiator-shield-clash.png"
    assert hero_path.is_file(), "Missing gladiator hero artwork"
    hero_data = hero_path.read_bytes()
    assert hero_data[:8] == b"\x89PNG\r\n\x1a\n", "Hero must be a valid PNG"
    import hashlib
    header = f"blob {len(hero_data)}\0".encode()
    assert hashlib.sha1(header + hero_data).hexdigest() == "e4aa812be3fb64fe77fc3e27a5b0d3c7eff88d12", "Original hero artwork changed"
    assert 'src="./assets/gladiator-shield-clash.png"' in html
    assert "hero-art-painted" in html and "fate-emblem" not in html
    assert "two-handed sword" in html and "shield" in html
    assert html.index('id="vision"') < html.index('id="hobby"')
    readme = (SITE.parent / "README.md").read_text(encoding="utf-8")
    assert readme.index("## The game") < readme.index("## A Hobby, Not a Business")
    assert "It will always be 100% free." not in readme
    assert "personal hobby project, not a business model" in readme
    theme = (SITE / "grimdark.css").read_text(encoding="utf-8")
    assert ".hero-art.hero-art-painted img" in theme
    assert "object-fit: contain" in theme, "Keep the complete painting visible"

    # The old CSS cache could leave the original high-resolution painting at
    # natural dimensions, cropped within a fixed-height decorative container.
    # Changing the CSS URLs refreshes the styles; the inline sizing fallback
    # protects the image if an older stylesheet is served.
    assert 'href="./styles.css?v=20261125-gladiator-hero"' in html
    assert 'href="./grimdark.css?v=20261125-gladiator-hero"' in html
    assert ".hero-art.hero-art-painted > img" in html
    assert "max-width: 100%" in html and "height: auto" in html
    assert ".hero-art.hero-art-painted::before" in html
    assert "content: none !important" in html, "Old decorative overlays must be hidden"

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
        required_game = ("index.html", "app.mjs", "engine.mjs", "loot.mjs", "production.mjs", "game.css", "iron-ui.css",
                         "assets/hunting.webp", "assets/mining.webp", "result-readout.mjs", "armour.mjs", "smith.mjs", "arena-wallet.mjs")
        for name in required_game:
            asset = play_root / name
            assert asset.is_file() and asset.stat().st_size, f"Missing game asset: {name}"
        game_html = play_entry.read_text(encoding="utf-8")
        game_parser = SiteParser()
        game_parser.feed(game_html)
        game_parser.close()
        assert game_parser.lang == "en", "Game must declare English document language"
        assert game_parser.stylesheet and game_parser.favicon, "Game CSS/favicon missing"
        assert {"game", "activityChoices", "resourceList", "sceneImage",
                "activityProgress", "actionFill", "sceneBanner", "character-heading",
                "resultPanel", "combatReadout", "playerResult", "enemyResult",
                "workReadout", "workResultTokens",
                "skillTitle", "skillLevel", "skillXp", "skillFill", "nameInput", "saveName", "gearStats",
                "coinWallet", "equipmentEditor", "equipmentEditHeading", "armourEditor",
                "smithBuy", "itemGrade", "itemQuality"}.issubset(game_parser.ids), "Missing essential gameplay UI"
        assert not ({"level", "xpText", "xpFill", "lifetimeXp"} & game_parser.ids), (
            "Character must have no global level or XP widget"
        )
        assert not ({"rateText", "countdown", "timeInvested", "testDay", "actionCount"} & game_parser.ids), (
            "Time, action counts, and testing controls must not be exposed to players"
        )
        app_js = (play_root / "app.mjs").read_text(encoding="utf-8")
        for leak in ("baseMinutes", "SEC / ACTION", "toLocaleTimeString", "elapsedMs",
                     "timeInvested", "testDay", "gainedXP", "per cycle"):
            assert leak not in app_js, f"Player-facing time/action detail leaked: {leak}"
        assert "workReadoutForReport(report" in app_js and "aria-valuenow" in app_js
        assert "state.skills[id]" in app_js and "skillFill" in app_js
        assert "state.totalXP" not in app_js and "state.level" not in app_js
        assert 'role="progressbar"' in game_html
        assert "logList" not in game_html, "Chronicle must be fully replaced by result readout"
        assert "Welcome back." not in game_html
        assert "returnPanel" not in game_html
        assert "./iron-ui.css" in game_html, "The shared dark-fantasy theme must be active"
        assert 'class="right-rail"' in game_html, "Resource/progress panel must exist"
        verify_links(game_parser, play_root)
        checked_links += len(game_parser.links)
        engine_source = (play_root / "engine.mjs").read_text(encoding="utf-8")
        activity_ids = re.findall(r"^\s*([a-z_]+): task\(", engine_source, re.MULTILINE)
        assert len(activity_ids) == 11 and len(set(activity_ids)) == 11, "Expected eleven distinct activities"
        scene_aliases = {"foraging": "gathering", "smithing": "smelting",
                         "construction": "masonry", "farming": "gathering", "training": "masonry"}
        for activity_id in activity_ids:
            name = scene_aliases.get(activity_id, activity_id) + ".webp"
            picture = play_root / "assets" / name
            raw = picture.read_bytes()
            assert len(raw) > 30_000, f"Activity painting suspiciously small: {name}"
            assert raw[:4] == b"RIFF" and raw[8:12] == b"WEBP", f"Invalid WebP: {name}"
        assert "prefers-reduced-motion" in (play_root / "game.css").read_text(encoding="utf-8")
        theme = (play_root / "iron-ui.css").read_text(encoding="utf-8")
        assert "prefers-reduced-motion" in theme, "Respect reduced-motion users"
        assert theme.count("{") == theme.count("}"), "Mismatched CSS theme braces"

    print(f"PASS: landing page, Play Now contract, game assets and {checked_links} local/external links")


if __name__ == "__main__":
    check()
