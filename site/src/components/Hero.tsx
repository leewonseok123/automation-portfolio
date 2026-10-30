import { data } from "../data";
import Terminal from "./Terminal";

export default function Hero() {
  const s = data.scraper.summary;
  return (
    <section id="top" className="bg-grid relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink pt-[130px] text-bone">
      {/* 배경 대형 숫자 */}
      <div className="pointer-events-none absolute -top-10 right-[-4vw] font-display text-[38vw] leading-none font-black text-bone/[0.03] select-none">
        03
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-16 sm:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <span className="font-display text-[11px] tracking-[0.3em] text-bone/60 uppercase">Portfolio 2026</span>
          <span className="h-[1px] w-16 bg-bone/30" />
          <span className="text-[11px] tracking-[0.2em] text-bone/60">수집 · 감시 · 보고서 자동화</span>
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1>
              <span className="block font-serif text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] italic">Automate</span>
              <span className="block font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] font-black tracking-tight">
                THE TEDIOUS
              </span>
            </h1>
            <p className="mt-8 max-w-xl font-kr text-[15px] leading-relaxed text-bone/75 md:text-base">
              <strong className="font-semibold text-bone">매일 손으로 하던 일을 코드로 바꿉니다.</strong> 웹 데이터 수집,
              가격·재고 알림봇, 엑셀 보고서 자동화. 이 페이지의 모든 숫자와 로그는{" "}
              <span className="font-serif text-vermilion italic">실제로 실행한 결과</span>입니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#works"
                className="group flex w-fit items-center gap-3 bg-bone px-7 py-4 font-display text-xs font-bold tracking-[0.25em] text-ink uppercase transition-colors duration-300 hover:bg-vermilion hover:text-bone"
                data-cursor="link"
              >
                작업 보기
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a
                href="#commission"
                className="font-display text-[11px] tracking-[0.25em] text-bone/60 uppercase underline decoration-bone/30 underline-offset-4 transition-colors hover:text-vermilion"
                data-cursor="link"
              >
                의뢰 안내
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Terminal
              title="01_web_scraper — live log"
              command={`python scraper.py --pages ${s.pages} --workers ${s.workers}`}
              lines={data.scraper.log}
              speed={260}
            />
            <p className="mt-3 font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">
              ↑ 실제 실행 로그 재생 · {s.items}건 / {s.elapsed_sec}s / 실패 {s.failed}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute right-6 bottom-8 z-10 hidden flex-col items-center gap-3 xl:flex">
        <span className="font-display text-[10px] tracking-[0.3em] text-bone/50 uppercase [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span className="h-16 w-[1px] bg-bone/25">
          <span className="animate-scroll-line block h-full w-full bg-vermilion" />
        </span>
      </div>
    </section>
  );
}
