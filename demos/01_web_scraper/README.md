# 01 · 웹 데이터 수집기

목록 페이지 → 상세 페이지 2단계 수집기. 대상은 스크래핑 연습용 공개 사이트 [books.toscrape.com](https://books.toscrape.com).

```bash
python scraper.py --pages 3 --workers 6 --out output
```

| 기능 | 구현 |
|---|---|
| 수집 허용 확인 | `robots.txt` 를 먼저 읽고 금지 경로면 중단 |
| 차단 회피가 아닌 **예의 있는 수집** | 요청 간 0.3~0.9초 랜덤 딜레이, 동시 요청 수 제한 |
| 안정성 | 429/5xx 에 지수 백오프 재시도(최대 4회), 실패 URL 은 기록 후 계속 |
| 납품 형식 | `books.csv`(엑셀에서 한글 안 깨지는 UTF-8 BOM) · `books.xlsx`(헤더 스타일·필터·틀고정) · `books.json` |
| 실행 기록 | `run_summary.json`, `run.log` |

다른 사이트에 적용할 때는 `parse_list()` / `parse_detail()` 의 CSS 선택자만 바꾸면 됩니다.
