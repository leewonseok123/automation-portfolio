import Commission from "./components/Commission";
import Counter from "./components/Counter";
import Cursor from "./components/Cursor";
import ExcelSection from "./components/ExcelSection";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import MonitorSection from "./components/MonitorSection";
import Nav from "./components/Nav";
import Reveal from "./components/Reveal";
import ScraperSection from "./components/ScraperSection";
import Works from "./components/Works";
import { data } from "./data";

export default function App() {
  const { scraper, monitor, excel } = data;
  const STATS = [
    { value: scraper.summary.items, label: "수집한 상품 데이터", en: "Items Scraped" },
    { value: monitor.summary.checks, label: "가격 점검 횟수", en: "Price Checks" },
    { value: excel.summary.rows_clean, label: "정제한 엑셀 행", en: "Rows Cleaned" },
    { value: excel.summary.issues + monitor.summary.events, label: "자동 처리한 이벤트", en: "Auto-handled Events" },
  ];

  return (
    <div className="min-h-screen bg-bone">
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Marquee />

        <section className="border-b border-ink/10 bg-bone py-20 sm:py-28">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
            <Reveal className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-2">
                <p className="font-display text-[11px] tracking-[0.35em] text-vermilion uppercase">00 — About</p>
              </div>
              <div className="lg:col-span-7">
                <p className="font-kr text-2xl leading-snug font-medium text-ink sm:text-3xl lg:text-4xl">
                  좋은 자동화는{" "}
                  <span className="font-serif text-vermilion italic">멈추지 않고, 조용하며,</span> 무엇을 했는지 기록을
                  남깁니다. 재시도 · 쿨다운 · 검증 로그까지 운영을 전제로 만듭니다.
                </p>
              </div>
              <div className="flex flex-col justify-end lg:col-span-3">
                <p className="font-kr text-sm leading-relaxed text-ash">
                  아래 숫자는 저장소의 데모 세 개를 실제로 실행해서 나온 값입니다. 코드는 모두 GitHub 에 공개되어 있습니다.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150} className="mt-16 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.en} className="bg-bone p-6 sm:p-8">
                  <p className="font-display text-3xl font-black tracking-tight text-ink sm:text-5xl">
                    <Counter value={stat.value} />
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{stat.label}</p>
                  <p className="mt-1 font-display text-[10px] tracking-[0.25em] text-ash uppercase">{stat.en}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <Works />
        <ScraperSection />
        <MonitorSection />
        <ExcelSection />
        <Commission />
      </main>
      <Footer />
    </div>
  );
}
