import { useMemo, useState } from "react";
import { demoUrl } from "../config";
import { data } from "../data";
import Counter from "./Counter";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const STEPS = [
  { t: "robots.txt 확인", d: "허용된 경로만 수집. 운영 리스크를 먼저 제거합니다." },
  { t: "목록 페이지 순회", d: "페이지네이션을 따라 상세 링크를 모읍니다." },
  { t: "상세 페이지 병렬 수집", d: "동시 요청 수 제한 + UA 로테이션 + 랜덤 딜레이 + 지수 백오프 재시도." },
  { t: "정규화 · 저장", d: "가격·평점·재고를 숫자로 변환해 CSV(엑셀 호환) · XLSX · JSON 으로 저장." },
];

type SortKey = "title" | "price_gbp" | "rating" | "stock";

export default function ScraperSection() {
  const { summary, books } = data.scraper;
  const [cat, setCat] = useState("전체");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "price_gbp", dir: -1 });

  const cats = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((b) => counts.set(b.category, (counts.get(b.category) ?? 0) + 1));
    return ["전체", ...[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c)];
  }, [books]);

  const rows = useMemo(() => {
    const list = cat === "전체" ? books : books.filter((b) => b.category === cat);
    return [...list].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  }, [books, cat, sort]);

  const th = (key: SortKey, label: string, cls = "") => (
    <th className={`py-3 font-display text-[10px] font-semibold tracking-[0.2em] uppercase ${cls}`}>
      <button
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : -1 }))}
        className={`transition-colors hover:text-vermilion ${sort.key === key ? "text-vermilion" : "text-ash"}`}
        data-cursor="link"
      >
        {label} {sort.key === key ? (sort.dir === 1 ? "↑" : "↓") : ""}
      </button>
    </th>
  );

  const STATS = [
    { v: summary.items, l: "수집 건수", en: "Items" },
    { v: summary.requests, l: "HTTP 요청", en: "Requests" },
    { v: summary.elapsed_sec, l: "소요 시간(초)", en: "Seconds", d: 1 },
    { v: summary.failed, l: "실패", en: "Failed" },
  ];

  return (
    <section id="scraper" className="relative border-t border-ink/10 bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          no="02"
          label="Web Scraper"
          title="수집기"
          en="Two-stage Web Scraper"
          desc="스크래핑 연습용 공개 사이트(books.toscrape.com)에서 3페이지 · 60권을 수집한 실제 결과입니다. 표 머리글을 누르면 정렬됩니다."
        />

        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <ol className="divide-y divide-ink/15 border-y border-ink/15">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-5 py-5">
                  <span className="font-display text-sm font-black text-vermilion">0{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{s.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ash">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15">
              {STATS.map((s) => (
                <div key={s.en} className="bg-paper p-5">
                  <p className="font-display text-4xl font-black tracking-tight text-ink">
                    <Counter value={s.v} decimals={s.d ?? 0} />
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{s.l}</p>
                  <p className="font-display text-[10px] tracking-[0.25em] text-ash uppercase">{s.en}</p>
                </div>
              ))}
            </div>

            <a
              href={demoUrl("01_web_scraper")}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 flex w-fit items-center gap-3 bg-ink px-7 py-4 font-display text-xs font-bold tracking-[0.25em] text-bone uppercase transition-colors duration-300 hover:bg-vermilion"
              data-cursor="link"
            >
              코드 보기
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </a>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`border px-4 py-2 font-display text-[11px] tracking-[0.15em] uppercase transition-all duration-300 ${
                    cat === c ? "border-ink bg-ink text-bone" : "border-ink/25 text-ash hover:border-ink hover:text-ink"
                  }`}
                  data-cursor="link"
                >
                  {c}
                </button>
              ))}
              <span className="ml-auto self-center font-display text-[11px] tracking-[0.2em] text-ash uppercase">
                {rows.length} rows · books.csv
              </span>
            </div>

            <div className="max-h-[560px] overflow-auto border-y border-ink">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-paper">
                  <tr className="border-b border-ink/30">
                    {th("title", "Title", "pl-1")}
                    <th className="hidden py-3 font-display text-[10px] font-semibold tracking-[0.2em] text-ash uppercase sm:table-cell">
                      Category
                    </th>
                    {th("price_gbp", "Price", "text-right")}
                    {th("rating", "Rating", "pl-6")}
                    {th("stock", "Stock", "pr-1 text-right")}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.upc} className="group border-b border-ink/10 transition-colors hover:bg-bone">
                      <td className="max-w-[280px] truncate py-3 pl-1 font-medium text-ink group-hover:text-vermilion">{b.title}</td>
                      <td className="hidden py-3 text-ash sm:table-cell">{b.category}</td>
                      <td className="py-3 text-right font-mono text-ink">£{b.price_gbp.toFixed(2)}</td>
                      <td className="py-3 pl-6 tracking-[0.15em] text-vermilion">
                        {"★".repeat(b.rating)}
                        <span className="text-ink/15">{"★".repeat(5 - b.rating)}</span>
                      </td>
                      <td className="py-3 pr-1 text-right font-mono text-ash">{b.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
