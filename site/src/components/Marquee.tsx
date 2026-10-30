const ITEMS = [
  "PYTHON",
  "데이터 수집",
  "REQUESTS · BS4",
  "PLAYWRIGHT",
  "동적 페이지 · 무한 스크롤",
  "텔레그램 알림",
  "SQLITE",
  "엑셀 자동화",
  "PANDAS · OPENPYXL",
  "24/7 서버 운영",
  "CRON · SYSTEMD",
  "PYTEST · CI",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-ink bg-vermilion py-4">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-lg font-bold tracking-[0.15em] text-bone uppercase">{item}</span>
            <span className="text-bone/70">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
