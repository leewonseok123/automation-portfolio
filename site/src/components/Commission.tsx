import { PROFILE } from "../config";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

const PROCESS = [
  { t: "상담", en: "Brief", d: "대상 사이트·파일, 원하는 결과물 형태를 확인합니다. 법적·약관상 가능한 범위인지 먼저 검토합니다." },
  { t: "샘플 납품", en: "Sample", d: "본 작업 전에 데이터 일부를 먼저 보내드려 형식을 확정합니다." },
  { t: "본 작업", en: "Build", d: "코드 · 결과물 · 실행 방법 문서를 함께 납품합니다." },
  { t: "유지보수", en: "Care", d: "사이트 구조가 바뀌어 멈추면 수정합니다. 서버 운영 대행도 가능합니다." },
];

const PLANS = [
  { name: "데이터 수집", en: "Scraping", price: "50,000", unit: "원~", items: ["공개 웹페이지 수집", "CSV · 엑셀 · JSON 납품", "재실행용 코드 포함"] },
  {
    name: "알림봇 + 운영",
    en: "Monitoring",
    price: "100,000",
    unit: "원~",
    extra: "+ 월 10,000원 서버 운영",
    items: ["가격 · 재고 · 공지 감시", "텔레그램 알림", "24시간 서버 운영 대행"],
    featured: true,
  },
  { name: "엑셀 자동화", en: "Excel", price: "50,000", unit: "원~", items: ["여러 파일 통합 · 정제", "차트 포함 보고서 생성", "버튼 한 번 실행 구성"] },
];

export default function Commission() {
  return (
    <section id="commission" className="relative bg-bone py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          no="07"
          label="Commission"
          title="의뢰 안내"
          en="Work With Me"
          desc="위 작업과 비슷한 일이라면 대부분 1~3일 안에 납품 가능합니다. 로그인이 필요하거나 약관상 수집이 금지된 사이트는 진행하지 않습니다."
        />

        <Reveal as="section" className="grid gap-px border border-ink/15 bg-ink/15 md:grid-cols-4">
          {PROCESS.map((p, i) => (
            <div key={p.t} className="bg-bone p-6">
              <p className="font-display text-xs font-black tracking-[0.2em] text-vermilion">STEP 0{i + 1}</p>
              <p className="mt-3 text-xl font-bold text-ink">{p.t}</p>
              <p className="font-serif text-sm text-ash italic">{p.en}</p>
              <p className="mt-3 text-sm leading-relaxed text-ash">{p.d}</p>
            </div>
          ))}
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div
                className={`flex h-full flex-col border p-8 transition-transform duration-500 hover:-translate-y-1 ${
                  p.featured ? "border-ink bg-ink text-bone" : "border-ink/20 bg-paper text-ink"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold">{p.name}</p>
                  <p className={`font-display text-[10px] tracking-[0.25em] uppercase ${p.featured ? "text-vermilion" : "text-ash"}`}>
                    {p.featured ? "Most requested" : p.en}
                  </p>
                </div>
                <p className="mt-6 font-display text-5xl font-black tracking-tight">
                  {p.price}
                  <span className="ml-1 text-base font-bold">{p.unit}</span>
                </p>
                {p.extra && <p className="mt-1 text-sm text-vermilion">{p.extra}</p>}
                <ul className={`mt-6 flex-1 space-y-2.5 border-t pt-6 text-sm ${p.featured ? "border-bone/20 text-bone/75" : "border-ink/15 text-ash"}`}>
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span className="mt-2 h-1 w-3 shrink-0 bg-vermilion" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 flex flex-col items-start justify-between gap-10 border-t border-ink pt-12 lg:flex-row lg:items-end">
          <p className="text-4xl leading-tight font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
            반복 업무,
            <br />
            <span className="font-serif font-normal text-vermilion italic">이제 그만</span> 하셔도 됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            {PROFILE.contacts.map((c) => (
              <a
                key={c.en}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 border border-ink px-6 py-4 font-display text-xs font-bold tracking-[0.2em] text-ink uppercase transition-colors duration-300 hover:bg-ink hover:text-bone"
                data-cursor="link"
              >
                {c.label}
                <span className="text-ash transition-colors group-hover:text-vermilion">{c.en}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
