# 04 · 동적 페이지 수집

자바스크립트가 화면을 그리는 페이지, 무한 스크롤 페이지를 수집합니다.
대상은 스크래핑 연습용 공개 사이트 [quotes.toscrape.com](https://quotes.toscrape.com) 의 `/js/`, `/scroll`.

```bash
python -m playwright install chromium   # 최초 1회
python dynamic_scraper.py
```

**같은 데이터, 네 가지 방법**

| | 방법 | 결과 | 의미 |
|---|---|---|---|
| A | `requests` 로 HTML 요청 | **0건** | 데이터가 HTML 이 아니라 `<script>` 안에 있음 |
| B | 헤드리스 브라우저 + '다음' 클릭 | 100건 / 8.7s | 페이지네이션 자동 순회 |
| C | 헤드리스 브라우저 + 무한 스크롤 | 100건 / 6.5s | 새 항목이 3번 연속 안 나오면 종료, 그 사이 네트워크 요청 감청 |
| D | C 에서 찾은 JSON API 직접 호출 | 100건 / 3.3s | 브라우저 없이 가장 빠르고 서버 부담도 적음 |

B·C·D 결과가 같은지 교차 검증하고, `output/rendered.png` 에 브라우저가 실제로 본 화면을 남깁니다.

**사이트 구조가 바뀌어도**

- 항목·본문·작성자·태그마다 선택자 후보를 여러 개 두고 순서대로 시도합니다 (`SELECTORS`).
  클래스명이 바뀌어도 schema.org 마크업 같은 다른 단서로 계속 동작합니다.
- 결과가 최소 건수에 못 미치거나 필수 값이 비면 `StructureChanged` 예외로 멈춥니다.
  빈 파일을 조용히 납품하는 사고를 막기 위해서입니다.
- 두 경우 모두 `tests/test_dynamic.py` 에서 '개편된 HTML', '완전히 깨진 HTML' 로 검증합니다.
