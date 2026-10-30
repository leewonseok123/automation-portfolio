"""
가격이 시간에 따라 변하는 로컬 테스트용 쇼핑몰.

실제 쇼핑몰을 반복 호출하지 않고도 모니터의 감지 로직(가격 하락, 목표가 도달,
재입고, 최저가 갱신)을 재현 가능하게 시연하기 위한 서버입니다.
"""

from __future__ import annotations

import random
import threading
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PAGE = """<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>{name} | MOCK SHOP</title></head>
<body>
  <main class="product" data-sku="{sku}">
    <h1 class="product-name">{name}</h1>
    <div class="price-box"><span class="label">판매가</span> <strong class="price">₩ {price:,}</strong></div>
    <p class="stock">{stock_text}</p>
  </main>
</body></html>"""


@dataclass
class Product:
    sku: str
    name: str
    base: int
    price: int = 0
    stock: int = 10
    sale_left: int = 0
    rng: random.Random = field(default_factory=random.Random, repr=False)

    def __post_init__(self) -> None:
        self.price = self.base


class MockShop:
    """tick() 을 호출할 때마다 가격·재고가 한 단계씩 움직입니다 (시드 고정 → 재현 가능)."""

    def __init__(self, seed: int = 7) -> None:
        catalog = [
            ("VC-X15", "무선 청소기 X15", 899_000),
            ("GM-S2", "휴대용 게임기 S2", 498_000),
            ("EP-P3", "노이즈캔슬링 이어폰 P3", 329_000),
            ("NB-G16", "16인치 경량 노트북 G16", 1_890_000),
            ("MS-MX4", "무선 마우스 MX4", 139_000),
        ]
        self.products = {
            sku: Product(sku, name, base, rng=random.Random(f"{seed}-{sku}")) for sku, name, base in catalog
        }
        self.tick_no = 0
        self._lock = threading.Lock()

    def tick(self) -> None:
        with self._lock:
            self.tick_no += 1
            for p in self.products.values():
                if p.sale_left > 0:  # 타임세일 진행 중
                    p.sale_left -= 1
                elif p.rng.random() < 0.04:  # 타임세일 시작 (3~8시간)
                    p.price = round(p.base * p.rng.uniform(0.72, 0.85), -2)
                    p.sale_left = p.rng.randint(3, 8)
                elif p.rng.random() < 0.35:  # 정가 기준 소폭 변동
                    p.price = round(p.base * p.rng.uniform(0.96, 1.03), -2)
                if p.stock == 0:
                    if p.rng.random() < 0.25:
                        p.stock = p.rng.randint(3, 20)
                elif p.rng.random() < 0.03:
                    p.stock = 0
                elif p.rng.random() < 0.3:
                    p.stock = max(1, p.stock - 1)
                p.price = int(p.price)

    def render(self, sku: str) -> str | None:
        with self._lock:
            p = self.products.get(sku)
            if p is None:
                return None
            stock_text = "일시품절" if p.stock == 0 else f"재고 {p.stock}개"
            return PAGE.format(sku=p.sku, name=p.name, price=p.price, stock_text=stock_text)


def serve(shop: MockShop, port: int = 8765) -> ThreadingHTTPServer:
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            sku = self.path.strip("/").removeprefix("product/")
            html = shop.render(sku)
            if html is None:
                self.send_error(404)
                return
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args) -> None:
            pass

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


if __name__ == "__main__":
    import time

    s = MockShop()
    serve(s)
    print("mock shop → http://127.0.0.1:8765/product/VC-X15  (30초마다 가격 변동)")
    while True:
        time.sleep(30)
        s.tick()
