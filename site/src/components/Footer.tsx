import { PROFILE } from "../config";

const COLUMNS = [
  { title: "Works", links: [["웹 데이터 수집기", "#scraper"], ["가격·재고 알림봇", "#monitor"], ["엑셀 자동화", "#excel"]] },
  { title: "Stack", links: [["Python 3.12", "#works"], ["pandas · openpyxl", "#excel"], ["SQLite · Telegram", "#monitor"]] },
  { title: "Info", links: [["의뢰 안내", "#commission"], ["GitHub 저장소", PROFILE.repo]] },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="mx-auto max-w-[1600px] px-5 pt-16 pb-10 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-4xl font-black tracking-tight">{PROFILE.mark}</p>
            <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-bone/50 uppercase">
              {PROFILE.brand} · {PROFILE.location}
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-bone/60">
              이 사이트의 모든 수치·로그·차트는 저장소의 데모를 실행해 나온 결과 파일에서 빌드 시점에 생성됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-display text-[11px] font-bold tracking-[0.3em] text-vermilion uppercase">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-bone/60 transition-colors duration-300 hover:text-bone" data-cursor="link">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none mt-16 overflow-hidden border-t border-bone/15 pt-8">
          <p className="w-full text-center font-display text-[clamp(3rem,12vw,11rem)] leading-none font-black tracking-tighter text-bone/10 select-none">
            AUTOMATE
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-bone/15 pt-6 sm:flex-row">
          <p className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">© 2026 {PROFILE.brand}</p>
          <p className="text-[11px] text-bone/40">수집 데모 대상: books.toscrape.com (스크래핑 연습용 공개 사이트)</p>
        </div>
      </div>
    </footer>
  );
}
