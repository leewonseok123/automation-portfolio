"""
지점별로 양식이 제각각인 '현실적인' 매출 파일을 생성합니다.

실무에서 흔히 받는 문제를 일부러 섞어 둡니다.
- 지점마다 다른 컬럼명 (일자/날짜/판매일, 금액/매출액 …)
- 날짜 형식 혼재 (2026-09-03, 2026.09.03, 20260903, 엑셀 날짜)
- "₩12,000", "12,000원" 같은 문자열 금액
- 중복 행, 빈 행, 수량 0 / 음수(반품), 상품명 앞뒤 공백
- 금액 오타(0 하나 더 입력), 날짜 칸에 '미정'
- CP949 로 저장된 CSV (구형 POS 내보내기)
"""

from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook

HERE = Path(__file__).parent
INPUT = HERE / "input"

PRODUCTS = {
    "아메리카노": 4500,
    "카페라떼": 5000,
    "바닐라라떼": 5500,
    "콜드브루": 5000,
    "얼그레이 티": 4800,
    "크루아상": 3800,
    "치즈케이크": 6500,
    "샌드위치": 7200,
}

BRANCHES = {
    "성수점": {"cols": ["일자", "상품명", "수량", "단가", "금액"], "date": "iso", "money": "int", "fmt": "xlsx"},
    "강남점": {"cols": ["날짜", "품목", "판매수량", "판매가", "매출액"], "date": "dot", "money": "won", "fmt": "xlsx"},
    "홍대점": {"cols": ["판매일", "메뉴", "qty", "price", "total"], "date": "compact", "money": "krw", "fmt": "xlsx"},
    "판교점": {"cols": ["거래일자", "상품", "수량", "단가", "합계"], "date": "excel", "money": "int", "fmt": "xlsx"},
    "부산점": {"cols": ["일자", "상품명", "수량", "단가", "금액"], "date": "iso", "money": "int", "fmt": "csv"},
}


def fmt_date(d: date, style: str):
    return {
        "iso": d.isoformat(),
        "dot": d.strftime("%Y.%m.%d"),
        "compact": d.strftime("%Y%m%d"),
        "excel": d,  # openpyxl 이 실제 날짜 셀로 저장
    }[style]


def fmt_money(v: int, style: str):
    return {"int": v, "won": f"{v:,}원", "krw": f"₩{v:,}"}[style]


def parse_back(v) -> int:
    return v if isinstance(v, int) else int("".join(ch for ch in v if ch.isdigit()))


def main(out_dir: Path = INPUT) -> None:
    rng = random.Random(42)
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.iterdir():
        f.unlink()

    start = date(2026, 7, 1)
    days = (date(2026, 9, 30) - start).days + 1

    for branch, spec in BRANCHES.items():
        weight = rng.uniform(0.7, 1.4)
        rows = []
        for i in range(days):
            d = start + timedelta(days=i)
            weekend = d.weekday() >= 5
            for name, price in PRODUCTS.items():
                if rng.random() < 0.15:
                    continue
                qty = max(0, int(rng.gauss(14 if weekend else 9, 4) * weight))
                if rng.random() < 0.01:
                    qty = -rng.randint(1, 3)  # 반품
                label = f"  {name} " if rng.random() < 0.03 else name
                rows.append(
                    [
                        fmt_date(d, spec["date"]),
                        label,
                        qty,
                        fmt_money(price, spec["money"]),
                        fmt_money(qty * price, spec["money"]),
                    ]
                )
        # 입력 실수: 금액 오타, 날짜 미기재
        for _ in range(rng.randint(1, 3)):
            r = rows[rng.randrange(len(rows))]
            r[4] = fmt_money(int(parse_back(r[4]) * 10), spec["money"])  # 0 하나 더 입력
        rows[rng.randrange(len(rows))][0] = "미정"
        # 중복·빈 행 섞기
        for _ in range(rng.randint(3, 8)):
            rows.insert(rng.randrange(len(rows)), list(rows[rng.randrange(len(rows))]))
        for _ in range(rng.randint(1, 4)):
            rows.insert(rng.randrange(len(rows)), [None] * 5)

        if spec["fmt"] == "csv":
            path = out_dir / f"{branch}_POS_export.csv"
            with path.open("w", newline="", encoding="cp949") as f:
                w = csv.writer(f)
                w.writerow(spec["cols"])
                w.writerows(["" if c is None else c for c in r] for r in rows)
        else:
            path = out_dir / f"{branch}_3분기_매출.xlsx"
            wb = Workbook()
            ws = wb.active
            ws.title = "매출"
            ws.append([f"{branch} 매출 내역 (2026 3분기)"])  # 표 위에 제목 행이 있는 흔한 양식
            ws.append([])
            ws.append(spec["cols"])
            for r in rows:
                ws.append(r)
            if spec["date"] == "excel":
                for row in ws.iter_rows(min_row=4, max_col=1):
                    row[0].number_format = "yyyy-mm-dd"
            wb.save(path)
        print(f"생성: {path.name} ({len(rows)}행)")


if __name__ == "__main__":
    main()
