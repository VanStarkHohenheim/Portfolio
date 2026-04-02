"""
Fetches RSS feeds from cybersecurity / AI-military sources,
filters by keywords and writes veille-data.json at the repo root.
"""

import feedparser
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ---------------------------------------------------------------------------
# Sources RSS
# ---------------------------------------------------------------------------
RSS_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://feeds.feedburner.com/Securityweek",
    "https://www.schneier.com/feed/atom/",
    "https://www.cert.ssi.gouv.fr/feed/",
    "https://www.bleepingcomputer.com/feed/",
    "https://www.zdnet.fr/feeds/rss/actualites/securite/",
    "https://www.lemonde.fr/pixels/rss_full.xml",
    "https://www.01net.com/feed/",
]

# ---------------------------------------------------------------------------
# Mots-clés (un seul suffit pour garder l'article)
# ---------------------------------------------------------------------------
KEYWORDS = [
    "intelligence artificielle", "artificial intelligence",
    "machine learning", "deep learning",
    "armement", "arme", "weapon", "military", "militaire",
    "drone", "autonomous weapon", "armes autonomes",
    "cyber", "cybersécurité", "cybersecurity",
    "défense", "defense", "defence",
    "deepseek", "openai", "chatgpt", "llm", "gpt",
    "robot soldat", "killbot", "lethal autonomous",
    "renseignement artificiel", "algorithme militaire",
]

MAX_ARTICLES = 20
OUTPUT_FILE = "Portfolio/veille-data.json"


def strip_html(text: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", text).strip()


def parse_date(entry) -> tuple[str, float]:
    """Return (human-readable month/year, unix timestamp)."""
    for field in ("published", "updated"):
        raw = entry.get(field, "")
        if not raw:
            continue
        try:
            dt = parsedate_to_datetime(raw)
            months_fr = [
                "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
            ]
            label = f"{months_fr[dt.month]} {dt.year}"
            return label, dt.timestamp()
        except Exception:
            pass
    return "Récent", 0.0


def matches(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in KEYWORDS)


def fetch_all() -> list[dict]:
    articles: list[dict] = []

    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url, request_headers={"User-Agent": "Mozilla/5.0"})
            source_name = feed.feed.get("title", url)

            for entry in feed.entries[:15]:
                title = strip_html(entry.get("title", ""))
                summary = strip_html(
                    entry.get("summary", "") or entry.get("description", "")
                )[:400]
                link = entry.get("link", "")

                if not title or not link:
                    continue
                if not (matches(title) or matches(summary)):
                    continue

                date_label, ts = parse_date(entry)
                articles.append(
                    {
                        "title": title,
                        "summary": summary,
                        "link": link,
                        "date": date_label,
                        "timestamp": ts,
                        "source": source_name,
                    }
                )
        except Exception as exc:
            print(f"[WARN] {url} → {exc}", file=sys.stderr)

    # Deduplicate by title, sort newest first
    seen: set[str] = set()
    unique: list[dict] = []
    for a in sorted(articles, key=lambda x: x["timestamp"], reverse=True):
        key = a["title"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(a)

    return unique[:MAX_ARTICLES]


def main() -> None:
    articles = fetch_all()
    payload = {
        "updated": datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC"),
        "articles": articles,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"✓ {len(articles)} articles enregistrés dans {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
