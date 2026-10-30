import sqlite3
from datetime import datetime, timedelta

import mock_shop
import monitor
import pytest
import requests

T0 = datetime(2026, 10, 27, 9, 0, tzinfo=monitor.KST)


@pytest.fixture
def db():
    conn = sqlite3.connect(":memory:")
    conn.executescript(monitor.SCHEMA)
    return conn


@pytest.fixture
def target():
    return monitor.Target(
        id="T1",
        name="상품",
        url="http://x/p",
        price_selector="strong.price",
        stock_selector="p.stock",
        target_price=80_000,
        drop_pct=5,
    )


def seed(db, prices, stock=True):
    for i, p in enumerate(prices):
        db.execute(
            "INSERT INTO price_history(target_id, checked_at, price, in_stock) VALUES (?,?,?,?)",
            ("T1", (T0 + timedelta(hours=i)).isoformat(), p, int(stock)),
        )


def kinds(events):
    return {k for k, _ in events}


def test_first_check_has_no_events(db, target):
    assert monitor.detect_events(db, target, monitor.Snapshot(50_000, True)) == []


def test_small_drop_is_ignored(db, target):
    seed(db, [100_000])
    assert monitor.detect_events(db, target, monitor.Snapshot(97_000, True)) == []


def test_drop_and_target_hit(db, target):
    seed(db, [100_000])
    assert kinds(monitor.detect_events(db, target, monitor.Snapshot(79_000, True))) == {"PRICE_DROP", "TARGET_HIT"}


def test_target_hit_only_when_crossing(db, target):
    seed(db, [79_000])
    assert "TARGET_HIT" not in kinds(monitor.detect_events(db, target, monitor.Snapshot(78_000, True)))


def test_new_low_needs_history_and_margin(db, target):
    seed(db, [100_000] * 5)
    assert "NEW_LOW" not in kinds(monitor.detect_events(db, target, monitor.Snapshot(90_000, True)))
    seed(db, [100_000] * monitor.MIN_SAMPLES_FOR_LOW)
    assert "NEW_LOW" not in kinds(monitor.detect_events(db, target, monitor.Snapshot(99_500, True)))
    assert "NEW_LOW" in kinds(monitor.detect_events(db, target, monitor.Snapshot(98_000, True)))


def test_restock(db, target):
    seed(db, [100_000], stock=False)
    assert kinds(monitor.detect_events(db, target, monitor.Snapshot(100_000, True))) == {"RESTOCK"}


def test_notifier_bundles_and_applies_cooldown(db, target, tmp_path, monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    n = monitor.Notifier()
    n.jsonl = tmp_path / "alerts.jsonl"
    events = [("PRICE_DROP", "a"), ("TARGET_HIT", "b")]
    assert n.send(db, target, events, T0) is True
    assert len(n.jsonl.read_text().splitlines()) == 1  # 2개 이벤트 → 메시지 1건
    assert n.send(db, target, [("PRICE_DROP", "c")], T0 + timedelta(hours=1)) is False  # 쿨다운
    assert n.send(db, target, [("PRICE_DROP", "d")], T0 + timedelta(hours=4)) is True


def test_end_to_end_with_mock_shop(db, tmp_path, monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    shop = mock_shop.MockShop(seed=1)
    server = mock_shop.serve(shop, port=0)
    try:
        base = f"http://127.0.0.1:{server.server_address[1]}"
        targets = monitor.load_targets(monitor.HERE / "targets.json", base_url=base)
        n = monitor.Notifier()
        n.jsonl = tmp_path / "alerts.jsonl"
        session = requests.Session()
        for h in range(30):
            monitor.run_cycle(db, targets, n, session, T0 + timedelta(hours=h))
            shop.tick()
    finally:
        server.shutdown()
    assert db.execute("SELECT COUNT(*) FROM price_history").fetchone()[0] == 30 * len(targets)
    assert db.execute("SELECT COUNT(*) FROM price_history WHERE price IS NULL").fetchone()[0] == 0
