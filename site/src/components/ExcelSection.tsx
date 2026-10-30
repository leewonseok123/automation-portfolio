import { useState } from "react";
import { demoUrl } from "../config";
import { data, fmt, won } from "../data";
import Counter from "./Counter";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import Terminal from "./Terminal";

// make_sample_data.py 가 만드는 지점별 원본 양식
const INPUTS = [
  { file: "성수점_3분기_매출.xlsx", cols: ["일자", "상품명", "수량", "단가", "금액"], quirk: "2026-09-03" },
  { file: "강남점_3분기_매출.xlsx", cols: ["날짜", "품목", "판매수량", "판매가", "매출액"], quirk: "2026.09.03 · 12,000원" },
  { file: "홍대점_3분기_매출.xlsx", cols: ["판매일", "메뉴", "qty", "price", "total"], quirk: "20260903 · ₩12,000" },
  { file: "판교점_3분기_매출.xlsx", cols: ["거래일자", "상품", "수량", "단가", "합계"], quirk: "엑셀 날짜 셀" },
  { file: "부산점_POS_export.csv", cols: ["일자", "상품명", "수량", "단가", "금액"], quirk: "CP949 인코딩" },
];

const SHEETS = ["요약", "상품 순위", "요일 패턴", "검증 로그"] as const;
type Sheet = (typeof SHEETS)[number];

function Bars({ items, highlight = 0 }: { items: { label: string; value: number; text: string }[]; highlight?: number }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <Reveal className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-[12px]">
          <span className="truncate text-ash">{it.label}</span>
          <span className="h-5 bg-ink/5">
            <span
              className="grow-x block h-full"
              style={{
                width: `${(it.value / max) * 100}%`,
                background: i < highlight ? "var(--color-vermilion)" : "var(--color-ink)",
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </span>
          <span className="w-28 text-right font-mono text-ink">{it.text}</span>
        </div>
      ))}
    </Reveal>
  );
}

export default function ExcelSection() {
  const s = data.excel.summary;
  const [sheet, setSheet] = useState<Sheet>("요약");

  return (
    <section id="excel" className="relative bg-bone py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          no="04"
          label="Excel Automation"
          title="엑셀 자동화"
          en="Messy Files → One Report"
          desc="지점마다 컬럼명·날짜·금액 형식이 다른 매출 파일 5개를 받아 통합 보고서를 만듭니다. 중복·빈 행·오타·반품까지 처리하고, 무엇을 고쳤는지 원본 행 번호로 남깁니다."
        />

        <div className="grid items-start gap-10 lg:grid-cols-12">
          {/* BEFORE */}
          <Reveal className="lg:col-span-5">
            <p className="mb-4 font-display text-[11px] tracking-[0.35em] text-ash uppercase">Before — 받은 파일</p>
            <ul className="space-y-3">
              {INPUTS.map((f, i) => (
                <li key={f.file} className="border border-ink/15 bg-paper/60 p-4" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.4}deg)` }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      <span className="mr-2 font-display text-[10px] text-vermilion">{f.file.endsWith(".csv") ? "CSV" : "XLSX"}</span>
                      {f.file}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-ash">{f.quirk}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.cols.map((c) => (
                      <span key={c} className="border border-ink/15 bg-bone px-1.5 py-0.5 font-mono text-[11px] text-ink/70">
                        {c}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 sm:grid-cols-3">
              {Object.entries(s.issues_by_kind).map(([k, v]) => (
                <div key={k} className="bg-bone p-4">
                  <p className="font-display text-3xl font-black text-ink">
                    <Counter value={v} />
                  </p>
                  <p className="mt-1 text-xs text-ash">{k}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* 화살표 */}
          <div className="hidden items-center justify-center self-stretch lg:col-span-1 lg:flex">
            <div className="flex flex-col items-center gap-3">
              <span className="font-display text-[10px] tracking-[0.3em] text-ash uppercase [writing-mode:vertical-rl]">
                {s.elapsed_sec}s · python excel_report.py
              </span>
              <span className="text-3xl text-vermilion">→</span>
            </div>
          </div>

          {/* AFTER */}
          <Reveal delay={120} className="lg:col-span-6">
            <p className="mb-4 font-display text-[11px] tracking-[0.35em] text-vermilion uppercase">After — 매출_통합보고서.xlsx</p>
            <div className="border border-ink bg-white shadow-[12px_12px_0_0_var(--color-ink)]">
              <div className="flex items-center gap-2 border-b border-ink/15 bg-paper px-4 py-2">
                <span className="bg-[#1d6f42] px-1.5 py-0.5 font-display text-[10px] font-black text-white">X</span>
                <span className="text-xs text-ink">매출_통합보고서.xlsx</span>
              </div>

              <div className="min-h-[420px] p-6">
                {sheet === "요약" && (
                  <>
                    <p className="text-xl font-black text-ink">2026 3분기 매출 통합 보고서</p>
                    <p className="text-[11px] text-ash">원본 {s.files.length}개 파일 · 유효 {fmt(s.rows_clean)}행</p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        ["총 매출", won(s.total_revenue)],
                        ["판매 수량", `${fmt(s.total_qty)}개`],
                        ["최고 지점", s.branches[0].name],
                      ].map(([l, v], i) => (
                        <div key={l} className="bg-paper p-3">
                          <p className="text-[10px] text-ash">{l}</p>
                          <p className={`mt-1 text-sm font-black sm:text-base ${i === 0 ? "text-vermilion" : "text-ink"}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 mb-3 text-xs font-bold text-ink">지점별 매출</p>
                    <Bars items={s.branches.map((b) => ({ label: b.name, value: b.revenue, text: won(b.revenue) }))} highlight={1} />
                    <p className="mt-6 mb-3 text-xs font-bold text-ink">월별 추이</p>
                    <Bars items={s.monthly.map((m) => ({ label: m.month, value: m.revenue, text: won(m.revenue) }))} />
                  </>
                )}
                {sheet === "상품 순위" && (
                  <>
                    <p className="mb-4 text-xs font-bold text-ink">상품별 매출 순위</p>
                    <Bars items={s.products.map((p) => ({ label: p.name, value: p.revenue, text: won(p.revenue) }))} highlight={3} />
                  </>
                )}
                {sheet === "요일 패턴" && (
                  <>
                    <p className="mb-4 text-xs font-bold text-ink">요일별 일평균 매출</p>
                    <Bars
                      items={s.weekday.map((w) => ({ label: `${w.day}요일`, value: w.avg, text: won(w.avg) }))}
                      highlight={0}
                    />
                    <p className="mt-5 text-xs leading-relaxed text-ash">
                      주말 매출이 평일 대비 높게 나타납니다. 이런 패턴 분석도 같은 스크립트에서 자동으로 계산됩니다.
                    </p>
                  </>
                )}
                {sheet === "검증 로그" && (
                  <>
                    <p className="mb-4 text-xs font-bold text-ink">데이터 검증 로그 · 총 {s.issues}건 중 일부</p>
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="bg-ink text-bone">
                          <th className="px-2 py-1.5 font-semibold">파일</th>
                          <th className="px-2 py-1.5 font-semibold">행</th>
                          <th className="px-2 py-1.5 font-semibold">처리 내용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.sample_issues.map((it, i) => (
                          <tr key={i} className="border-b border-ink/10 odd:bg-paper/40">
                            <td className="px-2 py-1.5 text-ash">{it.file.split("_")[0]}</td>
                            <td className="px-2 py-1.5 font-mono">{it.row}</td>
                            <td className="px-2 py-1.5 text-ink">{it.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* 시트 탭 */}
              <div className="flex overflow-x-auto border-t border-ink/15 bg-paper">
                {SHEETS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSheet(name)}
                    className={`shrink-0 border-r border-ink/10 px-4 py-2 text-[12px] transition-colors ${
                      sheet === name ? "bg-white font-bold text-[#1d6f42] shadow-[inset_0_-2px_0_#1d6f42]" : "text-ash hover:text-ink"
                    }`}
                    data-cursor="link"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-6 text-xs text-ash">
              실제 파일에는 엑셀 네이티브 차트 3개, 조건부 서식 피벗, 필터가 걸린 정제 데이터 시트까지 포함됩니다.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Terminal title="03_excel_report — run" command="python excel_report.py" lines={data.excel.log} speed={320} />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-between lg:col-span-5">
            <ul className="divide-y divide-ink/15 border-y border-ink/15">
              {[
                ["헤더 자동 탐지", "표 위에 제목 행이 있어도 실제 헤더를 찾아냄"],
                ["컬럼 별칭 매핑", "일자 / 날짜 / 판매일 → 같은 컬럼으로 인식"],
                ["형식 정규화", "날짜 4종 · 금액 문자열 · CP949 CSV 자동 처리"],
                ["이상치 보정", "수량×단가 ≠ 금액이면 보정하고 기록"],
              ].map(([t, d]) => (
                <li key={t} className="flex items-baseline justify-between gap-6 py-4">
                  <span className="font-semibold text-ink">{t}</span>
                  <span className="text-right text-sm text-ash">{d}</span>
                </li>
              ))}
            </ul>
            <a
              href={demoUrl("03_excel_report")}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 flex w-fit items-center gap-3 bg-ink px-7 py-4 font-display text-xs font-bold tracking-[0.25em] text-bone uppercase transition-colors duration-300 hover:bg-vermilion"
              data-cursor="link"
            >
              코드 보기
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
