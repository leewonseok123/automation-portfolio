import { PROFILE } from "../config";
import { data } from "../data";
import Counter from "./Counter";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const FILE_LABEL: Record<string, string> = {
  test_scraper: "01 수집기 — 파싱 · 재시도 · CSV 인코딩",
  test_monitor: "02 알림봇 — 이벤트 판정 · 쿨다운 · 목업 쇼핑몰 E2E",
  test_excel: "03 엑셀 — 날짜·금액 형식 · 오류 검출 · 보고서 구조",
  test_dynamic: "04 동적 수집 — 대체 선택자 · 구조 변경 감지",
};

const PRINCIPLES = [
  {
    t: "허락된 곳만 수집합니다",
    d: "데모는 스크래핑 연습용으로 공개된 사이트와 직접 띄운 목업 쇼핑몰만 사용했습니다. 실제 의뢰도 robots.txt · 약관 확인 후 진행하고, 로그인이 필요하거나 금지된 사이트는 받지 않습니다.",
  },
  {
    t: "조용히 실패하지 않습니다",
    d: "결과가 기준보다 적거나 필수 값이 비면 빈 파일을 납품하지 않고 오류로 멈춥니다. 무엇을 고치고 버렸는지는 로그로 남깁니다.",
  },
  {
    t: "고칠 수 있게 넘깁니다",
    d: "코드 · 실행 방법 문서 · 테스트를 함께 드립니다. 사이트가 바뀌면 어디를 고쳐야 하는지 테스트가 먼저 알려줍니다.",
  },
];

export default function Quality() {
  const q = data.quality;
  const max = Math.max(...Object.values(q.by_file));
  return (
    <section id="quality" className="relative border-t border-ink/10 bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          no="06"
          label="Quality"
          title="품질"
          en="Tested, Linted, Reproducible"
          desc="데모가 '한 번 돌아간 코드'가 아니라는 증거입니다. 아래 숫자는 사이트를 빌드할 때 테스트를 실제로 실행해서 기록한 값입니다."
        />

        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="font-display text-[clamp(5rem,12vw,10rem)] leading-none font-black tracking-tighter text-ink">
              <Counter value={q.tests} />
            </p>
            <p className="mt-2 text-lg font-bold text-ink">
              테스트 통과 <span className="text-vermilion">· 실패 {q.failures}</span>
            </p>
            <p className="font-display text-[11px] tracking-[0.25em] text-ash uppercase">
              pytest · {q.seconds}s · Python {q.python}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["pytest", "ruff lint", "ruff format", "npm build"].map((t) => (
                <span key={t} className="flex items-center gap-2 border border-ink/20 bg-bone px-3 py-1.5 font-mono text-[11px] text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f9e5b]" />
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ash">
              push 할 때마다 GitHub Actions 가 Python 3.11 · 3.12 · 3.13 에서 같은 검사를 다시 실행합니다.
            </p>
            <a
              href={`${PROFILE.repo}/actions`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block font-display text-[11px] tracking-[0.25em] text-ash uppercase underline decoration-ink/30 underline-offset-4 hover:text-vermilion"
              data-cursor="link"
            >
              CI 기록 보기 ↗
            </a>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-8">
            <ul className="divide-y divide-ink/15 border-y border-ink/15">
              {Object.entries(q.by_file).map(([file, n]) => (
                <li key={file} className="grid grid-cols-[1fr_auto] items-center gap-6 py-5 sm:grid-cols-[1fr_200px_48px]">
                  <div>
                    <p className="font-semibold text-ink">{FILE_LABEL[file] ?? file}</p>
                    <p className="font-mono text-[11px] text-ash">tests/{file}.py</p>
                  </div>
                  <span className="hidden h-2 bg-ink/10 sm:block">
                    <span className="grow-x block h-full bg-ink" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-display text-2xl font-black text-ink">{n}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px border border-ink/15 bg-ink/15 md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.t} delay={i * 80} className="bg-paper p-7">
              <p className="font-display text-xs font-black tracking-[0.2em] text-vermilion">0{i + 1}</p>
              <p className="mt-3 text-xl font-bold text-ink">{p.t}</p>
              <p className="mt-3 text-sm leading-relaxed text-ash">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
