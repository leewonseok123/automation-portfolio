"""
데모들의 실제 실행 결과(output/)와 테스트 결과를 쇼케이스 사이트가 읽는 JSON 으로 모읍니다.

    python scripts/export_showcase.py   →  site/src/data/showcase.json
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMOS = ROOT / "demos"
OUT = ROOT / "site" / "src" / "data" / "showcase.json"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_log(path: Path, limit: int = 40) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [ln.replace(str(ROOT) + "/", "./") for ln in lines[:limit]]


ORDER = ["test_scraper", "test_monitor", "test_excel", "test_dynamic"]


def run_tests() -> dict:
    """pytest 를 실제로 돌려 결과를 사이트에 싣습니다."""
    with tempfile.TemporaryDirectory() as tmp:
        report = Path(tmp) / "junit.xml"
        subprocess.run(
            [sys.executable, "-m", "pytest", f"--junitxml={report}", "-p", "no:cacheprovider"], cwd=ROOT, capture_output=True
        )
        suite = ET.parse(report).getroot()
        suite = suite.find("testsuite") if suite.tag == "testsuites" else suite
        files: dict[str, int] = {}
        for case in suite.iter("testcase"):
            mod = case.get("classname", "").split(".")[-1]
            files[mod] = files.get(mod, 0) + 1
        return {
            "tests": int(suite.get("tests", 0)),
            "failures": int(suite.get("failures", 0)) + int(suite.get("errors", 0)),
            "seconds": round(float(suite.get("time", 0)), 2),
            "by_file": dict(sorted(files.items(), key=lambda kv: ORDER.index(kv[0]) if kv[0] in ORDER else 99)),
            "python": sys.version.split()[0],
        }


def main() -> None:
    s_out = DEMOS / "01_web_scraper" / "output"
    m_out = DEMOS / "02_price_monitor" / "output"
    e_out = DEMOS / "03_excel_report" / "output"
    d_out = DEMOS / "04_dynamic_scraper" / "output"

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
            "books": [{k: b[k] for k in ("title", "category", "price_gbp", "rating", "stock", "upc")} for b in books],
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
        "dynamic": {
            "summary": read_json(d_out / "run_summary.json"),
            "log": read_log(d_out / "run.log"),
        },
        "quality": run_tests(),
    }
    shutil.copyfile(d_out / "rendered.png", ROOT / "site" / "public" / "demo04-rendered.png")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"→ {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
