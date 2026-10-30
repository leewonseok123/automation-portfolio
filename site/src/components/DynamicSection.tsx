import { useState } from "react";
import { demoUrl } from "../config";
import { data } from "../data";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import Terminal from "./Terminal";

const SOURCE_SNIPPET = `<div class="container">
  <!-- 데이터가 HTML 에 없습니다 -->
  <script>
    var data = [
      {"tags": ["change", ...],
       "author": {"name": "Albert Einstein"},
       "text": "“The world as we have ..."},
      ...
    ];
    for (var i in data) {
      document.write("<div class='quote'>" ...);
    }
  </script>
</div>`;

// dynamic_scraper.py 의 SELECTORS 와 동일
const FALLBACK = [
  { field: "항목", list: ["div.quote", "[itemtype*='CreativeWork']", "article.quote", "li.quote"] },
  { field: "본문", list: ["span.text", "[itemprop='text']", ".quote-text", "q"] },
  { field: "작성자", list: ["small.author", "[itemprop='author']", ".quote-author", ".author"] },
];

const STRATEGY_NOTE: Record<string, string> = {
  A: "HTML 만 받아옴 → 화면을 그리는 자바스크립트가 실행되지 않음",
  B: "헤드리스 크롬이 페이지를 그린 뒤 '다음' 버튼을 자동 클릭",
  C: "스크롤하며 새 항목을 기다림 + 그 사이 네트워크 요청 감청",
  D: "C 에서 찾은 JSON API 를 브라우저 없이 바로 호출",
};

export default function DynamicSection() {
  const { summary, log } = data.dynamic;
  const [view, setView] = useState<"render" | "source">("render");
  const maxSec = Math.max(...summary.strategies.map((s) => s.sec));
  const fastest = summary.strategies.filter((s) => s.items > 0).sort((a, b) => a.sec - b.sec)[0];

  return (
    <section id="dynamic" className="relative overflow-hidden bg-ink py-24 text-bone sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          dark
          no="05"
          label="Dynamic Pages"
          title="동적 페이지"
          en="JavaScript · Infinite Scroll · Hidden API"
          desc="요즘 사이트 대부분은 HTML 이 아니라 자바스크립트가 화면을 그립니다. 같은 데이터를 네 가지 방법으로 수집해, 왜 실패하는지와 어떻게 가장 빠르게 가져오는지를 비교했습니다."
        />

        <div className="grid gap-10 lg:grid-cols-12">
          {/* 브라우저 화면 vs 원본 HTML */}
          <Reveal className="lg:col-span-6">
            <div className="border border-bone/15 bg-[#0c0c0b]">
              <div className="flex items-center gap-3 border-b border-bone/10 px-4 py-2.5">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-vermilion" />
                  <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
                </div>
                <span className="flex-1 truncate rounded-sm bg-bone/5 px-3 py-1 font-mono text-[11px] text-bone/50">
                  {view === "source" ? "view-source:" : ""}quotes.toscrape.com/js/
                </span>
              </div>
              <div className="flex border-b border-bone/10">
                {(
                  [
                    ["render", "브라우저가 보는 화면", "div.quote × 10"],
                    ["source", "requests 가 받는 HTML", "div.quote × 0"],
                  ] as const
                ).map(([key, label, badge]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex flex-1 items-center justify-between gap-2 px-4 py-3 text-left text-[12px] transition-colors ${
                      view === key ? "bg-bone/10 text-bone" : "text-bone/40 hover:text-bone/70"
                    }`}
                    data-cursor="link"
                  >
                    {label}
                    <span className={`font-mono text-[10px] ${key === "source" ? "text-vermilion" : "text-bone/50"}`}>{badge}</span>
                  </button>
                ))}
              </div>
              <div className="relative h-[360px] overflow-hidden">
                {view === "render" ? (
                  <img
                    src="./demo04-rendered.png"
                    alt="헤드리스 브라우저로 렌더링한 페이지 캡처"
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <pre className="h-full overflow-auto p-5 font-mono text-[12px] leading-relaxed whitespace-pre text-bone/70">
                    {SOURCE_SNIPPET}
                  </pre>
                )}
              </div>
            </div>
            <p className="mt-3 font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">
              ↑ 실제 실행 중 헤드리스 크롬이 찍은 캡처 / 같은 주소의 원본 HTML
            </p>
          </Reveal>

          {/* 전략 비교 */}
          <Reveal delay={120} className="lg:col-span-6">
            <h3 className="mb-6 font-display text-xs font-bold tracking-[0.3em] uppercase">같은 데이터, 네 가지 방법</h3>
            <ol className="space-y-6">
              {summary.strategies.map((s) => {
                const failed = s.items === 0;
                const best = s.key === fastest.key;
                return (
                  <li key={s.key}>
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                      <p className="flex items-baseline gap-3">
                        <span className={`font-display text-sm font-black ${best ? "text-vermilion" : "text-bone/40"}`}>{s.key}</span>
                        <span className={`font-semibold ${failed ? "text-bone/40 line-through" : ""}`}>{s.name}</span>
                        {best && (
                          <span className="bg-vermilion px-1.5 py-0.5 font-display text-[9px] tracking-[0.2em] uppercase">Fastest</span>
                        )}
                      </p>
                      <p className="font-mono text-sm">
                        <span className={failed ? "text-vermilion" : ""}>{s.items}건</span>
                        <span className="text-bone/40"> · {s.sec.toFixed(2)}s</span>
                      </p>
                    </div>
                    <div className="h-2 bg-bone/10">
                      <span
                        className="grow-x block h-full"
                        style={{
                          width: `${(s.sec / maxSec) * 100}%`,
                          background: failed ? "rgba(232,68,46,.35)" : best ? "var(--color-vermilion)" : "rgba(242,239,233,.7)",
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-bone/50">{STRATEGY_NOTE[s.key]}</p>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 grid grid-cols-2 gap-px border border-bone/15 bg-bone/15">
              <div className="bg-ink p-5">
                <p className="font-display text-4xl font-black text-vermilion">{summary.speedup_api_vs_browser}×</p>
                <p className="mt-1 text-sm">API 직접 호출 속도</p>
                <p className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">vs browser scroll</p>
              </div>
              <div className="bg-ink p-5">
                <p className="font-display text-4xl font-black">{summary.consistent ? "B=C=D" : "불일치"}</p>
                <p className="mt-1 text-sm">세 방법의 결과 {summary.items}건 일치</p>
                <p className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">cross-checked</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 구조 변경 대응 */}
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h3 className="mb-2 font-display text-xs font-bold tracking-[0.3em] uppercase">사이트가 바뀌어도</h3>
            <p className="mb-6 text-sm leading-relaxed text-bone/60">
              외주 수집기가 망가지는 가장 흔한 이유는 사이트 개편입니다. 선택자 후보를 여러 개 두고 순서대로 시도하며, 결과가 기준
              미달이면 빈 파일을 납품하는 대신 <span className="text-vermilion">StructureChanged</span> 오류로 즉시 알립니다.
            </p>
            <div className="border border-bone/15">
              {FALLBACK.map((f) => (
                <div key={f.field} className="grid grid-cols-[64px_1fr] border-b border-bone/10 last:border-b-0">
                  <span className="border-r border-bone/10 px-3 py-3 text-xs text-bone/60">{f.field}</span>
                  <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
                    {f.list.map((sel, i) => (
                      <span
                        key={sel}
                        className={`px-1.5 py-0.5 font-mono text-[11px] ${i === 0 ? "bg-bone text-ink" : "border border-bone/20 text-bone/50"}`}
                      >
                        {i > 0 && <span className="mr-1 text-bone/30">{i + 1}.</span>}
                        {sel}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-bone/40">클래스명이 바뀐 HTML 로 대체 선택자가 동작하는지 테스트로 검증합니다.</p>
            <a
              href={demoUrl("04_dynamic_scraper")}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 flex w-fit items-center gap-3 border border-bone/40 px-7 py-4 font-display text-xs font-bold tracking-[0.25em] uppercase transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
              data-cursor="link"
            >
              코드 보기
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-7">
            <Terminal title="04_dynamic_scraper — run" command="python dynamic_scraper.py" lines={log} speed={380} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
