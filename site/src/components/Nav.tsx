import { useEffect, useState } from "react";
import { PROFILE } from "../config";

const LINKS = [
  { ko: "작업", en: "Works", href: "#works" },
  { ko: "수집기", en: "Scraper", href: "#scraper" },
  { ko: "알림봇", en: "Monitor", href: "#monitor" },
  { ko: "엑셀", en: "Excel", href: "#excel" },
  { ko: "의뢰", en: "Commission", href: "#commission" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Seoul",
        }),
      );
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const light = scrolled || menuOpen;

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full border-b border-bone/10 bg-ink text-bone">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-2 font-display text-[11px] tracking-[0.2em] uppercase sm:px-8">
          <span className="hidden sm:inline">{PROFILE.tagline} · 기술 시연 포트폴리오</span>
          <span className="sm:hidden">Tech Showcase</span>
          <span className="flex items-center gap-3 whitespace-nowrap">
            <span>
              {PROFILE.location} {time} KST
            </span>
            <span className="animate-blink text-vermilion">●</span>
            <span className="hidden sm:inline">Available</span>
          </span>
        </div>
      </div>

      <header
        className={`fixed top-[33px] left-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "bg-bone/85 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <nav
          className={`mx-auto flex max-w-[1600px] items-center justify-between border-b px-5 py-4 sm:px-8 ${
            scrolled ? "border-ink/10" : "border-bone/10"
          }`}
        >
          <a href="#top" className="group flex items-baseline gap-2" data-cursor="link">
            <span
              className={`font-display text-2xl font-black tracking-tight transition-colors duration-300 group-hover:text-vermilion ${
                scrolled ? "text-ink" : "text-bone"
              }`}
            >
              {PROFILE.mark}
            </span>
            <span className={`text-[11px] font-medium tracking-[0.3em] uppercase ${scrolled ? "text-ash" : "text-bone/50"}`}>
              {PROFILE.brand}
            </span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => (
              <li key={link.en}>
                <a href={link.href} className="group relative flex flex-col items-center" data-cursor="link">
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 group-hover:text-vermilion ${
                      scrolled ? "text-ink" : "text-bone"
                    }`}
                  >
                    {link.ko}
                  </span>
                  <span
                    className={`font-display text-[10px] tracking-[0.25em] uppercase ${scrolled ? "text-ash" : "text-bone/40"}`}
                  >
                    {link.en}
                  </span>
                  <span className="absolute -bottom-1.5 left-0 h-[1.5px] w-0 bg-vermilion transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <a
              href={PROFILE.repo}
              target="_blank"
              rel="noreferrer"
              className={`hidden border px-4 py-2 font-display text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 sm:block ${
                scrolled
                  ? "border-ink text-ink hover:bg-ink hover:text-bone"
                  : "border-bone/60 text-bone hover:bg-bone hover:text-ink"
              }`}
              data-cursor="link"
            >
              GitHub ↗
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
              aria-label="메뉴"
              data-cursor="link"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-[1.5px] w-6 transition-all duration-300 ${
                    menuOpen ? "bg-bone" : light ? "bg-ink" : "bg-bone"
                  } ${
                    menuOpen
                      ? i === 0
                        ? "translate-y-[6.5px] rotate-45"
                        : i === 1
                          ? "opacity-0"
                          : "-translate-y-[6.5px] -rotate-45"
                      : ""
                  }`}
                />
              ))}
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-ink px-8 transition-all duration-500 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="space-y-6">
          {LINKS.map((link, i) => (
            <li key={link.en}>
              <a href={link.href} onClick={() => setMenuOpen(false)} className="flex items-baseline gap-4">
                <span className="font-display text-xs text-vermilion">0{i + 1}</span>
                <span className="text-3xl font-bold text-bone">{link.ko}</span>
                <span className="font-display text-[10px] tracking-[0.25em] text-bone/50 uppercase">{link.en}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
