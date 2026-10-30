"""
04 · Dynamic Scraper — 자바스크립트로 그려지는 페이지 · 무한 스크롤 · 숨은 API 역추적

대상: https://quotes.toscrape.com (스크래핑 연습용 공개 사이트)
  /js/      → HTML 에 데이터가 없고 자바스크립트가 화면을 그림
  /scroll   → 스크롤할 때마다 데이터를 추가로 불러오는 무한 스크롤

같은 데이터를 네 가지 방법으로 수집해 속도·결과를 비교합니다.
  A. requests 로 HTML 요청        → 0건 (왜 브라우저가 필요한지 증명)
  B. 헤드리스 브라우저 + '다음' 클릭  → 페이지네이션 자동 순회
  C. 헤드리스 브라우저 + 무한 스크롤  → 새 항목이 안 나올 때까지 스크롤, 그 사이 네트워크 요청 감청
  D. C 에서 찾아낸 JSON API 를 직접 호출 → 브라우저 없이 가장 빠르고 가벼운 방법

구조 변경 대응
- 항목마다 선택자 후보를 여러 개 두고 순서대로 시도 (사이트 클래스명이 바뀌어도 버팀)
- 필수 필드 검증 + 최소 건수 미달 시 StructureChanged 예외 → 조용히 빈 결과를 납품하는 사고 방지

사용법
    python dynamic_scraper.py
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

BASE = "https://quotes.toscrape.com"
HERE = Path(__file__).parent
log = logging.getLogger("dynamic")

# 선택자 후보: 앞에서부터 시도하고 처음 맞는 것을 사용
SELECTORS: dict[str, list[str]] = {
    "item": ["div.quote", "[itemtype*='CreativeWork']", "article.quote", "li.quote"],
    "text": ["span.text", "[itemprop='text']", ".quote-text", "q"],
    "author": ["small.author", "[itemprop='author']", ".quote-author", ".author"],
    "tags": ["a.tag", ".tags a", "[itemprop='keywords']", ".tag"],
}


class StructureChanged(RuntimeError):
    """사이트 구조가 바뀌어 신뢰할 수 있는 결과를 만들 수 없을 때."""


@dataclass
class Quote:
    text: str
    author: str
    tags: list[str] = field(default_factory=list)


# ───────────────────────────── 파싱 (브라우저와 무관 → 테스트 가능) ─────────────────────────────


def select_first(root: BeautifulSoup | Tag, key: str, many: bool = False):
    for sel in SELECTORS[key]:
        found = root.select(sel) if many else root.select_one(sel)
        if found:
            return found, sel
    return ([] if many else None), None


def extract_quotes(html: str) -> tuple[list[Quote], dict[str, str | None]]:
    """HTML 에서 인용구를 뽑고, 실제로 사용된 선택자도 함께 돌려줍니다."""
    soup = BeautifulSoup(html, "lxml")
    items, item_sel = select_first(soup, "item", many=True)
    used: dict[str, str | None] = {"item": item_sel, "text": None, "author": None, "tags": None}
    quotes: list[Quote] = []
    for it in items:
        text_el, used["text"] = select_first(it, "text")
        author_el, used["author"] = select_first(it, "author")
        tag_els, tag_sel = select_first(it, "tags", many=True)
        used["tags"] = tag_sel or used["tags"]
        if text_el is None or author_el is None:
            continue
        tags = [t.get_text(strip=True) for t in tag_els]
        if len(tags) == 1 and "," in tags[0]:  # meta keywords 형태 "a,b,c"
            tags = [t for t in tags[0].split(",") if t]
        quotes.append(Quote(text_el.get_text(strip=True), author_el.get_text(strip=True), tags))
    return quotes, used


def validate(quotes: list[Quote], min_expected: int, source: str) -> None:
    if len(quotes) < min_expected:
        raise StructureChanged(f"{source}: {len(quotes)}건 수집 (최소 {min_expected}건 기대) — 사이트 구조 변경 의심")
    empty = [q for q in quotes if not q.text or not q.author]
    if empty:
        raise StructureChanged(f"{source}: 필수 필드가 빈 항목 {len(empty)}건")


# ───────────────────────────── 수집 전략 ─────────────────────────────


def strategy_requests() -> list[Quote]:
    html = requests.get(f"{BASE}/js/", timeout=15, headers={"User-Agent": "Mozilla/5.0"}).text
    quotes, _ = extract_quotes(html)
    return quotes


def strategy_browser_paginate(browser, shot_path: Path) -> tuple[list[Quote], int, dict]:
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto(f"{BASE}/js/")
    quotes: list[Quote] = []
    pages = 0
    used: dict = {}
    while True:
        page.wait_for_selector(SELECTORS["item"][0], timeout=10_000)
        if pages == 0:
            page.screenshot(path=str(shot_path))
        batch, used = extract_quotes(page.content())
        validate(batch, 1, f"/js/ {pages + 1}페이지")
        quotes.extend(batch)
        pages += 1
        nxt = page.locator("li.next a")
        if nxt.count() == 0:
            break
        nxt.click()
        page.wait_for_load_state("domcontentloaded")
    page.close()
    return quotes, pages, used


def strategy_browser_scroll(browser) -> tuple[list[Quote], int, list[str]]:
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    api_calls: list[str] = []
    page.on(
        "response",
        lambda r: (
            api_calls.append(r.url)
            if r.request.resource_type in ("xhr", "fetch") and "json" in (r.headers.get("content-type") or "")
            else None
        ),
    )
    page.goto(f"{BASE}/scroll")
    page.wait_for_selector(SELECTORS["item"][0])
    scrolls, stale = 0, 0
    last = page.locator(SELECTORS["item"][0]).count()
    while stale < 3:  # 3번 연속 새 항목이 없으면 끝으로 판단
        page.mouse.wheel(0, 20_000)
        page.wait_for_timeout(700)
        scrolls += 1
        now = page.locator(SELECTORS["item"][0]).count()
        stale = stale + 1 if now == last else 0
        last = now
    quotes, _ = extract_quotes(page.content())
    page.close()
    return quotes, scrolls, api_calls


def strategy_direct_api(endpoint: str) -> tuple[list[Quote], int]:
    session = requests.Session()
    quotes: list[Quote] = []
    page_no = 1
    while True:
        data = session.get(endpoint, params={"page": page_no}, timeout=15).json()
        quotes.extend(Quote(q["text"], q["author"]["name"], q["tags"]) for q in data["quotes"])
        if not data.get("has_next"):
            return quotes, page_no
        page_no += 1


# ───────────────────────────── 실행 ─────────────────────────────


def timed(fn, *args):
    t0 = time.perf_counter()
    result = fn(*args)
    return result, round(time.perf_counter() - t0, 2)


def main() -> None:
    from playwright.sync_api import sync_playwright

    ap = argparse.ArgumentParser(description="동적 페이지 수집 4가지 전략 비교")
    ap.add_argument("--out", type=Path, default=HERE / "output")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(), logging.FileHandler(args.out / "run.log", "w", encoding="utf-8")],
    )
    results = []

    a, ta = timed(strategy_requests)
    log.info("A. requests       — %3d건 / %.2fs  ← HTML 에 데이터가 없음 (자바스크립트 렌더링)", len(a), ta)
    results.append({"key": "A", "name": "requests 단순 요청", "items": len(a), "sec": ta})

    with sync_playwright() as p:
        browser = p.chromium.launch()
        (b, pages, used), tb = timed(strategy_browser_paginate, browser, args.out / "rendered.png")
        log.info("B. 브라우저+클릭   — %3d건 / %.2fs  (%d페이지, 선택자 %s)", len(b), tb, pages, used["item"])
        results.append({"key": "B", "name": "브라우저 + 다음 클릭", "items": len(b), "sec": tb, "pages": pages})

        (c, scrolls, calls), tc = timed(strategy_browser_scroll, browser)
        log.info("C. 브라우저+스크롤 — %3d건 / %.2fs  (스크롤 %d회, JSON 요청 %d건 감청)", len(c), tc, scrolls, len(calls))
        results.append({"key": "C", "name": "브라우저 + 무한 스크롤", "items": len(c), "sec": tc, "scrolls": scrolls})
        browser.close()

    if not calls:
        raise StructureChanged("무한 스크롤에서 JSON API 요청을 찾지 못했습니다")
    parsed = urlparse(calls[0])
    endpoint = urljoin(BASE, parsed.path)
    log.info("   감청한 API → %s", endpoint)

    (d, api_pages), td = timed(strategy_direct_api, endpoint)
    log.info("D. API 직접 호출   — %3d건 / %.2fs  (%d회 요청, 브라우저 없음)", len(d), td, api_pages)
    results.append({"key": "D", "name": "숨은 API 직접 호출", "items": len(d), "sec": td, "requests": api_pages})

    for name, qs in (("B", b), ("C", c), ("D", d)):
        validate(qs, 50, f"전략 {name}")
    same = {q.text for q in b} == {q.text for q in c} == {q.text for q in d}
    log.info("검증 — B·C·D 결과 동일: %s / 중복 제거 후 %d건", "예" if same else "아니오", len({q.text for q in d}))

    with (args.out / "quotes.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["text", "author", "tags"])
        w.writerows([q.text, q.author, "|".join(q.tags)] for q in d)
    (args.out / "quotes.json").write_text(json.dumps([asdict(q) for q in d], ensure_ascii=False, indent=2), encoding="utf-8")

    authors: dict[str, int] = {}
    tags: dict[str, int] = {}
    for q in d:
        authors[q.author] = authors.get(q.author, 0) + 1
        for t in q.tags:
            tags[t] = tags.get(t, 0) + 1
    summary = {
        "source": BASE,
        "strategies": results,
        "endpoint": endpoint,
        "consistent": same,
        "items": len(d),
        "speedup_api_vs_browser": round(tc / td, 1) if td else None,
        "top_authors": sorted(authors.items(), key=lambda x: -x[1])[:6],
        "top_tags": sorted(tags.items(), key=lambda x: -x[1])[:10],
    }
    (args.out / "run_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("완료 — API 직접 호출이 브라우저 스크롤보다 %.1f배 빠름 → %s", summary["speedup_api_vs_browser"], args.out.name)


if __name__ == "__main__":
    main()
