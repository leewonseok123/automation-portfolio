import { data, fmt } from "../data";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

function ScraperGlyph() {
  const books = data.scraper.books;
  return (
    <div className="grid h-full grid-cols-10 content-center gap-1.5 p-6">
      {books.map((b, i) => (
        <span
          key={b.upc}
          className="aspect-square transition-colors duration-500"
          style={{
            background: b.rating >= 4 ? "var(--color-vermilion)" : `rgba(242,239,233,${0.12 + b.rating * 0.12})`,
            transitionDelay: `${i * 8}ms`,
          }}
          title={b.title}
        />
      ))}
    </div>
  );
}

function MonitorGlyph() {
  const p = data.monitor.products[0];
  const prices = p.prices.filter((v): v is number => v !== null);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const W = 400;
  const H = 300;
  const pts = prices.map((v, i) => [(i / (prices.length - 1)) * W, H - 40 - ((v - min) / (max - min || 1)) * (H - 80)]);
  const lows = new Set<number>();
  prices.forEach((v, i) => i > 0 && v < prices[i - 1] * 0.9 && lows.add(i));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(242,239,233,.8)" strokeWidth="2" />
      {[...lows].map((i) => (
        <circle key={i} cx={pts[i][0]} cy={pts[i][1]} r="6" fill="var(--color-vermilion)" />
      ))}
    </svg>
  );
}

function ExcelGlyph() {
  const br = data.excel.summary.branches;
  const max = Math.max(...br.map((b) => b.revenue));
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-8">
      {br.map((b, i) => (
        <div key={b.name} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-[11px] text-bone/50">{b.name}</span>
          <span
            className="h-4"
            style={{ width: `${(b.revenue / max) * 100}%`, background: i === 0 ? "var(--color-vermilion)" : "rgba(242,239,233,.55)" }}
          />
        </div>
      ))}
    </div>
  );
}

function DynamicGlyph() {
  const st = data.dynamic.summary.strategies;
  const max = Math.max(...st.map((s) => s.sec));
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-8">
      {st.map((s) => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="w-4 font-display text-xs font-black text-bone/50">{s.key}</span>
          <span
            className="h-4"
            style={{
              width: `${Math.max(4, (s.sec / max) * 100)}%`,
              background: s.items === 0 ? "rgba(232,68,46,.35)" : s.key === "D" ? "var(--color-vermilion)" : "rgba(242,239,233,.55)",
            }}
          />
          <span className="font-mono text-[11px] text-bone/50">{s.items}</span>
        </div>
      ))}
    </div>
  );
}

export default function Works() {
  const { scraper, monitor, excel, dynamic } = data;
  const fastest = dynamic.summary.strategies.find((s) => s.key === "D");
  const WORKS = [
    {
      no: "01",
      href: "#scraper",
      glyph: <ScraperGlyph />,
      titleKo: "웹 데이터 수집기",
      titleEn: "Two-stage Web Scraper",
      tags: ["requests", "BeautifulSoup", "ThreadPool"],
      desc: "목록 → 상세 2단계 수집, 병렬 요청, 재시도·딜레이·robots.txt 준수. 결과는 CSV · 엑셀 · JSON 으로 바로 납품 가능한 형태.",
      metric: `${scraper.summary.items}건 · ${scraper.summary.elapsed_sec}s · 실패 ${scraper.summary.failed}`,
    },
    {
      no: "02",
      href: "#monitor",
      glyph: <MonitorGlyph />,
      titleKo: "가격·재고 알림봇",
      titleEn: "Price & Stock Monitor",
      tags: ["SQLite", "Telegram Bot API", "cron"],
      desc: "URL 과 CSS 선택자만 등록하면 어떤 상품이든 감시. 가격 하락 · 목표가 · 역대 최저가 · 재입고를 감지해 텔레그램으로 묶어서 알림.",
      metric: `${fmt(monitor.summary.checks)}회 점검 · 이벤트 ${monitor.summary.events} → 알림 ${monitor.summary.messages}`,
    },
    {
      no: "03",
      href: "#excel",
      glyph: <ExcelGlyph />,
      titleKo: "엑셀 보고서 자동화",
      titleEn: "Excel Report Pipeline",
      tags: ["pandas", "openpyxl", "데이터 검증"],
      desc: "양식이 제각각인 지점별 파일 5개를 정규화 · 검증 · 통합해 차트 포함 보고서를 1초대에 생성. 무엇을 고쳤는지 행 단위로 기록.",
      metric: `${fmt(excel.summary.rows_clean)}행 · 정제 ${excel.summary.issues}건 · ${excel.summary.elapsed_sec}s`,
    },
    {
      no: "04",
      href: "#dynamic",
      glyph: <DynamicGlyph />,
      titleKo: "동적 페이지 수집",
      titleEn: "JavaScript & Infinite Scroll",
      tags: ["Playwright", "네트워크 감청", "구조 변경 감지"],
      desc: "자바스크립트로 그려지는 페이지와 무한 스크롤을 헤드리스 브라우저로 수집하고, 숨은 JSON API 를 찾아내 브라우저 없이 더 빠르게 가져옵니다.",
      metric: `requests 0건 → 브라우저 ${dynamic.summary.items}건 · API ${fastest?.sec}s (${dynamic.summary.speedup_api_vs_browser}× 빠름)`,
    },
  ];

  return (
    <section id="works" className="relative bg-bone py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          no="01"
          label="Works"
          title="작업"
          en="Selected Works"
          desc="외주 시장에서 가장 많이 요청되는 네 가지 유형을 실제로 구현하고 돌려봤습니다. 각 항목을 누르면 실행 결과와 동작 방식을 볼 수 있습니다."
        />

        <ul className="divide-y divide-ink/15">
          {WORKS.map((w, i) => (
            <Reveal as="li" key={w.no} delay={i * 80}>
              <a
                href={w.href}
                className="group grid grid-cols-1 items-center gap-6 py-10 transition-colors duration-500 hover:bg-paper/60 md:grid-cols-12 md:gap-10 md:px-4"
                data-cursor="link"
              >
                <div className="font-display text-5xl font-black text-ink/15 transition-colors duration-500 group-hover:text-vermilion md:col-span-1 md:text-6xl">
                  {w.no}
                </div>
                <div className="md:col-span-4">
                  <div className="aspect-[4/3] overflow-hidden bg-ink transition-transform duration-[900ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.02]">
                    {w.glyph}
                  </div>
                </div>
                <div className="md:col-span-6 md:col-start-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {w.tags.map((t) => (
                      <span key={t} className="bg-ink px-2 py-1 font-display text-[10px] tracking-[0.15em] text-bone uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-ink transition-colors duration-300 group-hover:text-vermilion sm:text-4xl">
                    {w.titleKo}
                  </h3>
                  <p className="mt-1 font-serif text-lg text-ash italic">{w.titleEn}</p>
                  <p className="mt-3 font-kr text-sm leading-relaxed text-ash">{w.desc}</p>
                  <p className="mt-4 flex items-center gap-2 font-mono text-[13px] font-semibold text-ink">
                    <span className="h-1 w-6 bg-vermilion" />
                    {w.metric}
                  </p>
                </div>
                <div className="hidden md:col-span-1 md:block md:text-right">
                  <span className="inline-block text-2xl text-ink transition-all duration-300 group-hover:translate-x-2 group-hover:text-vermilion">
                    →
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
