# 02 · 가격·재고 알림봇

URL 과 CSS 선택자만 등록하면 어떤 상품 페이지든 감시하고, 변동을 텔레그램으로 알립니다.

```bash
python monitor.py --demo --cycles 72   # 목업 쇼핑몰로 72시간 시뮬레이션 (외부 호출 없음)
python monitor.py --once               # targets.json 1회 점검 — cron 용
python monitor.py --interval 600       # 10분 간격 상주 — systemd 용
```

**감지 이벤트**

| 이벤트 | 조건 |
|---|---|
| 📉 PRICE_DROP | 직전 대비 `drop_pct`% 이상 하락 |
| 🎯 TARGET_HIT | 목표가 이하로 **처음** 내려왔을 때 |
| 🏆 NEW_LOW | 이력 12회 이상 + 기존 최저가보다 1% 이상 낮을 때 |
| 🔔 RESTOCK | 품절 → 재고 있음 |

- 같은 시점의 이벤트는 메시지 1건으로 묶어서 발송
- 같은 종류 알림은 3시간 쿨다운
- 가격 이력은 SQLite(`output/prices.db`) 한 파일

**텔레그램 연결**

```bash
export TELEGRAM_BOT_TOKEN=123456:ABC...   # @BotFather 에서 발급
export TELEGRAM_CHAT_ID=123456789
```

토큰이 없으면 콘솔과 `output/alerts.jsonl` 로 대신 출력합니다.

**targets.json 예시**

```json
{ "id": "VC-X15", "name": "무선 청소기 X15", "url": "https://…",
  "price_selector": "strong.price", "stock_selector": "p.stock",
  "out_of_stock_text": "품절", "target_price": 720000, "drop_pct": 5 }
```

> 실제 사이트를 감시할 때는 해당 사이트 약관과 robots.txt 를 확인하고, 점검 간격을 충분히 두세요.
