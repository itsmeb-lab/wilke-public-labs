import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://itsmeb-lab.github.io/wilke-public-labs/"
SITE_URL = urlsplit(SITE)


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.anchors = set()
        self.hrefs = []
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        selected = dict(attrs)
        if selected.get("id"):
            self.anchors.add(selected["id"])
        if tag == "a" and selected.get("name"):
            self.anchors.add(selected["name"])
        if tag == "a" and selected.get("href"):
            self.hrefs.append(selected["href"])


def content_path(url):
    path = Path(unquote(url.path[len(SITE_URL.path):]))
    target = (ROOT / path).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError("Link escapes the deployed file tree.")
    if target.is_dir():
        target = target / "index.html"
    return target


sitemap = ElementTree.parse(ROOT / "sitemap.xml")
urls = [item.text for item in sitemap.findall(".//{*}loc")]
pages = {}
checked = 0
anchored = 0
issues = []
for url in urls:
    local = content_path(urlsplit(url))
    pages.setdefault(local, Page(local))
    for href in pages[local].hrefs:
        linked = urlsplit(urljoin(url, href))
        if linked.scheme != "https" or linked.netloc != SITE_URL.netloc or not linked.path.startswith(SITE_URL.path):
            continue
        checked += 1
        target = content_path(linked)
        if not target.is_file():
            issues.append({"from": local.relative_to(ROOT).as_posix(), "href": href, "issue": "missing target"})
        elif linked.fragment and target.suffix == ".html":
            anchored += 1
            if target not in pages:
                pages[target] = Page(target)
            if unquote(linked.fragment) not in pages[target].anchors:
                issues.append({"from": local.relative_to(ROOT).as_posix(), "href": href, "issue": "missing anchor"})
print("INTERNAL_LINK_RECEIPT " + json.dumps({
    "canonicals": len(urls), "local_links": checked, "anchor_links": anchored, "issues": issues,
}))
