"""
02 · Price Monitor — 가격·재고 변동 감지 + 텔레그램 알림 봇

기능
- targets.json 에 URL + CSS 선택자만 적으면 어떤 상품 페이지든 감시
- SQLite 에 가격 이력 저장 → 이전 값·역대 최저가와 비교
- 이벤트 4종 감지: 가격 하락(%), 목표가 도달, 역대 최저가, 재입고
- 같은 알림 반복 발송 방지 (쿨다운)
- 텔레그램 Bot API 발송 (토큰이 없으면 콘솔 + alerts.jsonl 로 대체)

사용법
    python monitor.py --demo --cycles 48     # 로컬 목업 쇼핑몰로 48시간치 시뮬레이션
    python monitor.py --once                 # targets.json 1회 점검 (cron 용)
    python monitor.py --interval 600         # 10분 간격 상주 실행 (systemd 용)

환경변수
    TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HERE = Path(__file__).parent
KST = timezone(timedelta(hours=9))
log = logging.getLogger("monitor")
MIN_SAMPLES_FOR_LOW = 12  # 이력이 충분히 쌓이기 전에는 "역대 최저가" 판정 보류
NEW_LOW_MARGIN = 0.01     # 기존 최저가보다 1% 이상 낮을 때만 알림 (몇백 원 차이 소음 제거)

SCHEMA = """
CREATE TABLE IF NOT EXISTS price_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id  TEXT    NOT NULL,
    checked_at TEXT    NOT NULL,
    price      INTEGER,
    in_stock   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_history_target ON price_history(target_id, checked_at);
CREATE TABLE IF NOT EXISTS alerts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id  TEXT NOT NULL,
    kind       TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


@dataclass
class Target:
    id: str
    name: str
    url: str
    price_selector: str
    stock_selector: str
    out_of_stock_text: str = "품절"
    target_price: int | None = None
    drop_pct: float = 5.0


@dataclass
class Snapshot:
    price: int | None
    in_stock: bool


# ───────────────────────────── 수집 ─────────────────────────────

def fetch_snapshot(target: Target, session: requests.Session) -> Snapshot:
    resp = session.get(target.url, timeout=10, headers={"User-Agent": "Mozilla/5.0 PriceMonitor/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")
    price_el = soup.select_one(target.price_selector)
    stock_el = soup.select_one(target.stock_selector)
    price = int(re.sub(r"[^\d]", "", price_el.get_text())) if price_el else None
    in_stock = not (stock_el and target.out_of_stock_text in stock_el.get_text())
    return Snapshot(price=price, in_stock=in_stock)


# ───────────────────────────── 판정 ─────────────────────────────

def detect_events(db: sqlite3.Connection, t: Target, snap: Snapshot) -> list[tuple[str, str]]:
    prev = db.execute(
        "SELECT price, in_stock FROM price_history WHERE target_id=? ORDER BY id DESC LIMIT 1", (t.id,)
    ).fetchone()
    low, samples = db.execute(
        "SELECT MIN(price), COUNT(*) FROM price_history WHERE target_id=? AND price IS NOT NULL", (t.id,)
    ).fetchone()
    events: list[tuple[str, str]] = []
    if prev is None or snap.price is None:
        return events
    prev_price, prev_stock = prev

    if prev_stock == 0 and snap.in_stock:
        events.append(("RESTOCK", f"🔔 재입고 — {t.name} ₩{snap.price:,}"))
    if prev_price and snap.price < prev_price:
        pct = (prev_price - snap.price) / prev_price * 100
        if pct >= t.drop_pct:
            events.append(("PRICE_DROP", f"📉 {pct:.1f}% 하락 — {t.name} ₩{prev_price:,} → ₩{snap.price:,}"))
    if samples >= MIN_SAMPLES_FOR_LOW and snap.price < low * (1 - NEW_LOW_MARGIN):
        events.append(("NEW_LOW", f"🏆 역대 최저가 — {t.name} ₩{snap.price:,} (기존 ₩{low:,})"))
    if t.target_price and snap.price <= t.target_price and (prev_price is None or prev_price > t.target_price):
        events.append(("TARGET_HIT", f"🎯 목표가 도달 — {t.name} ₩{snap.price:,} ≤ ₩{t.target_price:,}"))
    return events


# ───────────────────────────── 알림 ─────────────────────────────

class Notifier:
    def __init__(self, cooldown: timedelta = timedelta(hours=3)) -> None:
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.cooldown = cooldown
        self.jsonl = HERE / "output" / "alerts.jsonl"

    @property
    def channel(self) -> str:
        return "telegram" if self.token and self.chat_id else "console"

    def recently_sent(self, db: sqlite3.Connection, target_id: str, kind: str, now: datetime) -> bool:
        row = db.execute(
            "SELECT created_at FROM alerts WHERE target_id=? AND kind=? ORDER BY id DESC LIMIT 1", (target_id, kind)
        ).fetchone()
        return bool(row) and now - datetime.fromisoformat(row[0]) < self.cooldown

    def send(self, db: sqlite3.Connection, target: Target, events: list[tuple[str, str]], now: datetime) -> bool:
        """같은 상품에서 동시에 발생한 이벤트는 메시지 1건으로 묶어서 보냅니다."""
        fresh = []
        for kind, message in events:
            if kind != "NEW_LOW" and self.recently_sent(db, target.id, kind, now):
                log.info("쿨다운으로 생략: %s", message)
            else:
                fresh.append((kind, message))
        if not fresh:
            return False
        text = "\n".join(m for _, m in fresh) + f"\n{target.url}"
        if self.channel == "telegram":
            r = requests.post(
                f"https://api.telegram.org/bot{self.token}/sendMessage",
                json={"chat_id": self.chat_id, "text": text, "disable_web_page_preview": True},
                timeout=10,
            )
            r.raise_for_status()
        kinds = [k for k, _ in fresh]
        log.info("ALERT %s %s", "+".join(kinds), " / ".join(m for _, m in fresh))
        db.executemany(
            "INSERT INTO alerts(target_id, kind, message, created_at) VALUES (?,?,?,?)",
            [(target.id, k, m, now.isoformat()) for k, m in fresh],
        )
        with self.jsonl.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"at": now.isoformat(), "target": target.id, "kinds": kinds, "text": text}, ensure_ascii=False) + "\n")
        return True


# ───────────────────────────── 실행 ─────────────────────────────

def run_cycle(db: sqlite3.Connection, targets: list[Target], notifier: Notifier, session: requests.Session, now: datetime) -> int:
    sent = 0
    for t in targets:
        try:
            snap = fetch_snapshot(t, session)
        except Exception as exc:
            log.error("%s 수집 실패: %s", t.name, exc)
            continue
        events = detect_events(db, t, snap)
        if events:
            sent += notifier.send(db, t, events, now)
        db.execute(
            "INSERT INTO price_history(target_id, checked_at, price, in_stock) VALUES (?,?,?,?)",
            (t.id, now.isoformat(), snap.price, int(snap.in_stock)),
        )
    db.commit()
    return sent


def load_targets(path: Path, base_url: str | None = None) -> list[Target]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    targets = [Target(**item) for item in raw]
    if base_url:
        for t in targets:
            t.url = t.url.replace("{base}", base_url)
    return targets


def export_history(db: sqlite3.Connection, targets: list[Target], path: Path) -> None:
    data = []
    for t in targets:
        rows = db.execute(
            "SELECT checked_at, price, in_stock FROM price_history WHERE target_id=? ORDER BY id", (t.id,)
        ).fetchall()
        alerts = db.execute(
            "SELECT created_at, kind, message FROM alerts WHERE target_id=? ORDER BY id", (t.id,)
        ).fetchall()
        data.append({
            "id": t.id,
            "name": t.name,
            "target_price": t.target_price,
            "history": [{"at": r[0], "price": r[1], "in_stock": bool(r[2])} for r in rows],
            "alerts": [{"at": a[0], "kind": a[1], "message": a[2]} for a in alerts],
        })
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="가격·재고 변동 감지 봇")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--demo", action="store_true", help="로컬 목업 쇼핑몰로 시뮬레이션")
    mode.add_argument("--once", action="store_true", help="1회 점검 후 종료 (cron)")
    mode.add_argument("--interval", type=int, help="N초 간격 상주 실행")
    ap.add_argument("--cycles", type=int, default=48, help="--demo 시뮬레이션 횟수 (1회 = 1시간)")
    ap.add_argument("--targets", type=Path, default=HERE / "targets.json")
    ap.add_argument("--db", type=Path, default=HERE / "output" / "prices.db")
    args = ap.parse_args()

    args.db.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(), logging.FileHandler(args.db.parent / "run.log", "w", encoding="utf-8")],
    )
    notifier = Notifier()
    session = requests.Session()

    if args.demo:
        from mock_shop import MockShop, serve

        args.db.unlink(missing_ok=True)
        notifier.jsonl.unlink(missing_ok=True)
        shop = MockShop()
        server = serve(shop, port=8765)
        targets = load_targets(args.targets, base_url="http://127.0.0.1:8765")
        db = sqlite3.connect(args.db)
        db.executescript(SCHEMA)
        clock = datetime(2026, 10, 27, 9, 0, tzinfo=KST)
        total = 0
        log.info("데모 시작 — 상품 %d개 × %d시간, 알림 채널: %s", len(targets), args.cycles, notifier.channel)
        for _ in range(args.cycles):
            total += run_cycle(db, targets, notifier, session, clock)
            shop.tick()
            clock += timedelta(hours=1)
        server.shutdown()
        export_history(db, targets, args.db.parent / "history.json")
        checks = db.execute("SELECT COUNT(*) FROM price_history").fetchone()[0]
        summary = {
            "products": len(targets),
            "cycles": args.cycles,
            "checks": checks,
            "messages": total,
            "events": db.execute("SELECT COUNT(*) FROM alerts").fetchone()[0],
            "by_kind": dict(db.execute("SELECT kind, COUNT(*) FROM alerts GROUP BY kind").fetchall()),
            "channel": notifier.channel,
        }
        (args.db.parent / "run_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        log.info("완료 — 점검 %d회, 이벤트 %d건 → 메시지 %d건 %s", checks, summary["events"], total, summary["by_kind"])
        return

    targets = load_targets(args.targets)
    db = sqlite3.connect(args.db)
    db.executescript(SCHEMA)
    while True:
        sent = run_cycle(db, targets, notifier, session, datetime.now(KST))
        log.info("점검 완료 — 알림 %d건", sent)
        if args.once or not args.interval:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
