"""
예시 문서(PDF)와 정답지(ground_truth.json)를 만듭니다.

실제 업무 문서처럼 일부러 섞어 둔 것들
- 문서 종류 3가지(세금계산서·견적서·영수증) + 업무와 무관한 문서(회의록) 1건
- 같은 종류라도 레이아웃·라벨·날짜/금액 표기가 제각각 (공급가액/금액, 2026-09-03/2026년 9월 3일 …)
- 원본 문서 자체의 오류: 합계가 안 맞는 문서, 사업자등록번호 검증 숫자가 틀린 문서, 품목 합계와 공급가액이 다른 문서
- 글자 정보가 없는 스캔본 1건 (이미지로만 된 PDF → OCR 이 필요하다는 것을 알려야 함)

회사명·사업자번호는 전부 가상입니다. 사업자번호는 형식 검증을 통과하도록 무작위로 만든 값이며
실제 사업장과 무관합니다.

    python make_sample_docs.py        # input/*.pdf + input/ground_truth.json

한글 폰트가 필요합니다 (기본: WenQuanYi Zen Hei). 다른 폰트를 쓰려면 SAMPLE_FONT 환경변수에 경로 지정.
"""

from __future__ import annotations

import json
import os
import random
from datetime import date, timedelta
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = Path(__file__).parent
INPUT = HERE / "input"
FONT_CANDIDATES = [
    os.getenv("SAMPLE_FONT", ""),
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "C:/Windows/Fonts/malgun.ttf",
]

COMPANIES = [
    "(주)한결소프트",
    "다온푸드",
    "푸른길물류",
    "세움인테리어",
    "(주)누리디자인",
    "도담문구",
    "리본패키지(주)",
    "새벽농장",
    "(주)이음테크",
    "보람인쇄사",
]
BUYERS = ["(주)가온상사", "미래교육원", "햇살어린이집", "(주)대한메디", "청솔정비소", "(주)해오름"]
CAFES = ["별빛카페 성수점", "온기 베이커리", "로스터리 연남"]
ITEMS = {
    "tax_invoice": [
        ("웹사이트 유지보수", 300_000),
        ("서버 호스팅 (월)", 80_000),
        ("사무용 의자", 145_000),
        ("현수막 제작", 55_000),
        ("포장 박스 (대)", 1_200),
    ],
    "quotation": [
        ("인테리어 철거", 1_200_000),
        ("도배 (평당)", 38_000),
        ("LED 조명 교체", 24_000),
        ("블라인드 설치", 96_000),
        ("브로슈어 인쇄 (A4)", 450),
    ],
    "receipt": [("아메리카노", 4_500), ("카페라떼", 5_000), ("크루아상", 3_800), ("치즈케이크", 6_500), ("샌드위치", 7_200)],
}


def register_font() -> str:
    for path in FONT_CANDIDATES:
        if path and Path(path).exists():
            pdfmetrics.registerFont(TTFont("KR", path, subfontIndex=0) if path.endswith(".ttc") else TTFont("KR", path))
            return path
    raise SystemExit("한글 폰트를 찾지 못했습니다. SAMPLE_FONT 환경변수에 .ttf/.ttc 경로를 지정하세요.")


def biz_no(rng: random.Random, valid: bool = True) -> str:
    """사업자등록번호: 앞 9자리 + 검증 숫자 1자리. valid=False 면 검증 숫자를 일부러 틀리게 만듭니다."""
    d = [rng.randint(1, 9)] + [rng.randint(0, 9) for _ in range(8)]
    w = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    s = sum(a * b for a, b in zip(d, w, strict=True)) + (d[8] * 5) // 10
    check = (10 - s % 10) % 10
    if not valid:
        check = (check + rng.randint(1, 9)) % 10
    n = "".join(map(str, d)) + str(check)
    return f"{n[:3]}-{n[3:5]}-{n[5:]}"


def won(n: int, style: str) -> str:
    return {"plain": f"{n:,}", "won": f"{n:,}원", "sign": f"₩{n:,}"}[style]


def fdate(d: date, style: str) -> str:
    return {
        "iso": d.isoformat(),
        "dot": d.strftime("%Y.%m.%d"),
        "kr": f"{d.year}년 {d.month}월 {d.day}일",
        "short": d.strftime("%y-%m-%d"),
    }[style]


class Page:
    def __init__(self, path: Path):
        self.c = canvas.Canvas(str(path), pagesize=A4)
        self.y = 790

    def line(self, text: str, size: int = 11, x: int = 50, gap: int = 22):
        self.c.setFont("KR", size)
        self.c.drawString(x, self.y, text)
        self.y -= gap

    def row(self, cells: list[str], xs: list[int], size: int = 10, gap: int = 20):
        self.c.setFont("KR", size)
        for text, x in zip(cells, xs, strict=True):
            self.c.drawString(x, self.y, text)
        self.y -= gap

    def rule(self):
        self.c.line(50, self.y + 8, 545, self.y + 8)
        self.y -= 6

    def save(self):
        self.c.save()


def make_items(rng: random.Random, kind: str) -> list[dict]:
    chosen = rng.sample(ITEMS[kind], rng.randint(1, 4))
    items = []
    for name, price in chosen:
        if kind == "receipt":
            qty = rng.randint(1, 3)
        elif price < 5_000:  # 박스·인쇄물처럼 단가가 낮은 품목은 대량 거래
            qty = rng.choice([100, 200, 500])
        else:
            qty = rng.choice([1, 1, 2, 3, 5, 10])
        items.append({"name": name, "qty": qty, "unit_price": price, "amount": price * qty})
    return items


def draw_tax_invoice(p: Page, t: dict, v: int, rng: random.Random, fmt: tuple[str, str]):
    ds, ms = fmt
    p.line("전자세금계산서" if v == 0 else "세 금 계 산 서  (공급받는자 보관용)", 18, gap=34)
    p.line(f"{'작성일자' if v == 0 else '발행일'}: {fdate(date.fromisoformat(t['issue_date']), ds)}")
    parties = [("공급자", t["supplier"]), ("공급받는자", t["buyer"])]
    for label, party in parties if v == 0 else parties[::-1]:
        # 공급받는자의 사업자번호는 정답지에서 추적하지 않으므로 문서에만 임의로 인쇄합니다.
        p.line(f"[{label}] 상호: {party['name']}    사업자등록번호: {party.get('biz_no') or biz_no(rng)}")
    p.rule()
    head = ["품목", "수량", "단가", "공급가액"] if v == 0 else ["품명", "수량", "단가", "금액"]
    p.row(head, [50, 270, 340, 450])
    for it in t["items"]:
        p.row([it["name"], str(it["qty"]), won(it["unit_price"], ms), won(it["amount"], ms)], [50, 270, 340, 450])
    p.rule()
    labels = ("공급가액 합계", "세액", "합계금액") if v == 0 else ("공급가액", "부가세", "청구금액")
    for lab, val in zip(labels, (t["supply_amount"], t["vat"], t["total"]), strict=True):
        p.row([lab, won(val, ms)], [50, 200], size=12, gap=24)


def draw_quotation(p: Page, t: dict, v: int, rng: random.Random, fmt: tuple[str, str]):
    ds, ms = fmt
    p.line("견 적 서", 20, gap=36)
    p.line(f"견적일: {fdate(date.fromisoformat(t['issue_date']), ds)}")
    p.line(f"수신: {t['buyer']['name']} 귀하")
    p.line(f"공급자 상호: {t['supplier']['name']}")
    p.line(f"사업자번호 {t['supplier']['biz_no']}" if v == 0 else f"(사업자등록번호: {t['supplier']['biz_no']})")
    p.line("아래와 같이 견적합니다.", gap=28)
    p.row(["품명", "규격", "수량", "단가", "금액"], [50, 230, 290, 350, 450])
    for it in t["items"]:
        p.row([it["name"], "-", str(it["qty"]), won(it["unit_price"], ms), won(it["amount"], ms)], [50, 230, 290, 350, 450])
    p.rule()
    if v == 0:
        p.row(["소계", won(t["supply_amount"], ms)], [50, 200], size=12, gap=24)
        p.row(["부가가치세(10%)", won(t["vat"], ms)], [50, 200], size=12, gap=24)
        p.row(["총 견적금액", won(t["total"], ms)], [50, 200], size=12, gap=24)
    else:
        p.row(["공급가액", won(t["supply_amount"], ms), "VAT", won(t["vat"], ms)], [50, 140, 300, 350], size=12, gap=24)
        p.row(["합계(VAT 포함)", won(t["total"], ms)], [50, 200], size=12, gap=24)


def draw_receipt(p: Page, t: dict, v: int, rng: random.Random, fmt: tuple[str, str]):
    ds, ms = fmt
    p.line(t["supplier"]["name"], 16, gap=28)
    p.line(f"사업자번호 {t['supplier']['biz_no']}", 10, gap=18)
    d = date.fromisoformat(t["issue_date"])
    p.line(f"{fdate(d, ds)} {rng.randint(8, 21):02d}:{rng.randint(0, 59):02d}", 10, gap=24)
    for it in t["items"]:
        p.row([it["name"], f"x{it['qty']}", won(it["amount"], ms)], [50, 230, 330], size=11)
    p.rule()
    p.row(["합 계 금 액" if v == 0 else "받을금액", won(t["total"], ms)], [50, 330], size=13, gap=24)
    p.row(["부가세(포함)", won(t["vat"], ms)], [50, 330], size=10, gap=18)
    p.line("카드결제  승인완료", 10)


def draw_other(p: Page, rng: random.Random):
    p.line("9월 정기 운영회의 회의록", 16, gap=30)
    for ln in [
        "일시: 2026년 9월 12일 오후 3시",
        "참석: 운영팀 4명",
        "안건 1. 추석 연휴 근무표 조정",
        "안건 2. 재고 실사 일정 (다음 주 수요일)",
        "다음 회의: 10월 첫째 주",
    ]:
        p.line(ln)


def draw_scan(path: Path, t: dict, ttf: str):
    """글자 레이어가 없는 PDF — 문서 사진을 찍어 올린 경우를 흉내냅니다."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (1240, 1000), "white")
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(ttf, 34, index=0) if ttf.endswith(".ttc") else ImageFont.truetype(ttf, 34)
    lines = [
        "영 수 증",
        t["supplier"]["name"],
        f"사업자번호 {t['supplier']['biz_no']}",
        t["issue_date"],
        *[f"{it['name']}  x{it['qty']}   {it['amount']:,}" for it in t["items"]],
        f"합계금액  {t['total']:,}",
    ]
    for i, ln in enumerate(lines):
        d.text((80, 80 + i * 60), ln, fill="black", font=font)
    tmp = path.with_suffix(".png")
    img.save(tmp)
    c = canvas.Canvas(str(path), pagesize=A4)
    c.drawImage(str(tmp), 40, 400, width=515, height=415)
    c.save()
    tmp.unlink()


def build_truth(rng: random.Random, kind: str, idx: int) -> dict:
    items = make_items(rng, kind)
    base = sum(i["amount"] for i in items)
    if kind == "receipt":
        total = base
        vat = total // 11
        supply = total - vat
        buyer = None
    else:
        supply = base
        vat = round(supply * 0.1)
        total = supply + vat
        buyer = {"name": rng.choice(BUYERS)}
    supplier_name = rng.choice(CAFES) if kind == "receipt" else rng.choice(COMPANIES)
    return {
        "doc_type": kind,
        "issue_date": (date(2026, 7, 1) + timedelta(days=rng.randint(0, 90))).isoformat(),
        "supplier": {"name": supplier_name, "biz_no": biz_no(rng)},
        "buyer": buyer,
        "items": items,
        "supply_amount": supply,
        "vat": vat,
        "total": total,
    }


# 어떤 문서를 만들지: (종류, 레이아웃 변형, 날짜 표기, 금액 표기, 의도적 오류)
PLAN = [
    ("tax_invoice", 0, "iso", "plain", None),
    ("tax_invoice", 1, "kr", "won", None),
    ("tax_invoice", 0, "dot", "sign", "total_typo"),  # 합계금액을 잘못 적은 원본
    ("tax_invoice", 1, "short", "plain", "bad_bizno"),  # 사업자번호 검증 숫자가 틀린 원본
    ("tax_invoice", 0, "kr", "won", "supply_typo"),  # 공급가액이 품목 합계와 다른 원본
    ("quotation", 0, "dot", "won", None),
    ("quotation", 1, "iso", "plain", None),
    ("quotation", 0, "kr", "sign", None),
    ("quotation", 1, "dot", "won", None),
    ("receipt", 0, "iso", "plain", None),
    ("receipt", 1, "dot", "won", None),
    ("receipt", 0, "kr", "plain", None),
    ("other", 0, "kr", "plain", None),
    ("scan", 0, "iso", "plain", None),
]


def main(out_dir: Path = INPUT) -> None:
    ttf = register_font()
    rng = random.Random(2026)
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.iterdir():
        f.unlink()
    truth: dict[str, dict] = {}

    for i, (kind, variant, ds, ms, flaw) in enumerate(PLAN, start=1):
        name = f"doc{i:02d}_{kind}.pdf"
        path = out_dir / name
        if kind == "other":
            page = Page(path)
            draw_other(page, rng)
            page.save()
            truth[name] = {
                "doc_type": "other",
                "issue_date": None,
                "supplier": None,
                "buyer": None,
                "items": [],
                "supply_amount": None,
                "vat": None,
                "total": None,
                "planted_flaw": None,
            }
            continue
        t = build_truth(rng, "receipt" if kind == "scan" else kind, i)
        if flaw == "total_typo":
            t["total"] += 10_000
        elif flaw == "bad_bizno":
            t["supplier"]["biz_no"] = biz_no(rng, valid=False)
        elif flaw == "supply_typo":
            t["supply_amount"] += 30_000
            t["vat"] = round(t["supply_amount"] * 0.1)
            t["total"] = t["supply_amount"] + t["vat"]
        if kind == "scan":
            draw_scan(path, t, ttf)
        else:
            page = Page(path)
            {"tax_invoice": draw_tax_invoice, "quotation": draw_quotation, "receipt": draw_receipt}[kind](
                page, t, variant, rng, (ds, ms)
            )
            page.save()
        t["planted_flaw"] = flaw
        t["scanned"] = kind == "scan"
        truth[name] = t
        print(f"생성: {name}" + (f"  (의도적 오류: {flaw})" if flaw else "") + ("  (스캔본)" if kind == "scan" else ""))

    (out_dir / "ground_truth.json").write_text(json.dumps(truth, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"→ {len(truth)}개 문서 + ground_truth.json")


if __name__ == "__main__":
    main()
