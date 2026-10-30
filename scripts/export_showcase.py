"""
세 데모의 실제 실행 결과(output/)를 쇼케이스 사이트가 읽는 JSON 으로 모읍니다.

    python scripts/export_showcase.py   →  site/src/data/showcase.json
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMOS = ROOT / "demos"
OUT = ROOT / "site" / "src" / "data" / "showcase.json"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_log(path: Path, limit: int = 40) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [ln.replace(str(ROOT) + "/", "./") for ln in lines[:limit]]


def main() -> None:
    s_out = DEMOS / "01_web_scraper" / "output"
    m_out = DEMOS / "02_price_monitor" / "output"
    e_out = DEMOS / "03_excel_report" / "output"

    books = read_json(s_out / "books.json")
    history = read_json(m_out / "history.json")
    for item in history:  # 사이트에는 가격 배열만 있으면 충분
        item["prices"] = [h["price"] for h in item["history"]]
        item["stock"] = [h["in_stock"] for h in item["history"]]
        item["start"] = item["history"][0]["at"] if item["history"] else None
        del item["history"]

    alerts = [json.loads(ln) for ln in (m_out / "alerts.jsonl").read_text(encoding="utf-8").splitlines() if ln]

    data = {
        "scraper": {
            "summary": read_json(s_out / "run_summary.json"),
            "log": read_log(s_out / "run.log"),
            "books": [
                {k: b[k] for k in ("title", "category", "price_gbp", "rating", "stock", "upc")} for b in books
            ],
        },
        "monitor": {
            "summary": read_json(m_out / "run_summary.json"),
            "log": read_log(m_out / "run.log"),
            "products": history,
            "alerts": alerts,
        },
        "excel": {
            "summary": read_json(e_out / "run_summary.json"),
            "log": read_log(e_out / "run.log"),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"→ {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
