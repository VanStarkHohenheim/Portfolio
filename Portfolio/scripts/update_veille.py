"""
Fetches RSS feeds, filters articles that mention BOTH AI and military topics,
and writes veille-data.json.
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
    "https://www.defensenews.com/arc/outboundfeeds/rss/",
    "https://www.lemonde.fr/international/rss_full.xml",
    "https://www.lemonde.fr/pixels/rss_full.xml",
    "https://www.01net.com/feed/",
    "https://www.lefigaro.fr/rss/figaro_international.xml",
]

# ---------------------------------------------------------------------------
# Deux groupes : un article doit matcher AU MOINS UN de chaque groupe
# ---------------------------------------------------------------------------
AI_KEYWORDS = [
    "intelligence artificielle", "artificial intelligence",
    "machine learning", "deep learning",
    "algorithme", "autonome", "autonomous",
    "deepseek", "chatgpt", "gpt", "llm",
    "modèle d'ia", "système d'ia", "ai system",
    "réseau de neurones", "neural network",
]

MILITARY_KEYWORDS = [
    "armement", "armes autonomes", "autonomous weapon", "lethal autonomous",
    "militaire", "military", "armée", "army",
    "soldat", "soldier", "combat", "battlefield", "champ de bataille",
    "guerre", "warfare", "war ",
    "drone", "uav", "missile",
    "otan", "nato", "pentagone", "pentagon", "darpa",
    "défense nationale", "national defense", "national defence",
    "robot soldat", "killbot", "systèmes d'armes", "weapon system",
    "renseignement militaire", "cyber militaire", "cyberguerre", "cyberwar",
    "lavender", "project convergence", "sala", "laws ",
]

MAX_ARTICLES = 20
OUTPUT_FILE = "Portfolio/veille-data.json"


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", text).strip()


def parse_date(entry) -> tuple[str, float]:
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
    has_ai       = any(kw in t for kw in AI_KEYWORDS)
    has_military = any(kw in t for kw in MILITARY_KEYWORDS)
    return has_ai and has_military


def fetch_all() -> list[dict]:
    articles: list[dict] = []

    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url, request_headers={"User-Agent": "Mozilla/5.0"})
            source_name = feed.feed.get("title", url)

            for entry in feed.entries[:15]:
                title   = strip_html(entry.get("title", ""))
                summary = strip_html(
                    entry.get("summary", "") or entry.get("description", "")
                )[:400]
                link = entry.get("link", "")

                if not title or not link:
                    continue
                combined = title + " " + summary
                if not matches(combined):
                    continue

                date_label, ts = parse_date(entry)
                articles.append({
                    "title":     title,
                    "summary":   summary,
                    "link":      link,
                    "date":      date_label,
                    "timestamp": ts,
                    "source":    source_name,
                })
        except Exception as exc:
            print(f"[WARN] {url} → {exc}", file=sys.stderr)

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
