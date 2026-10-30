import Reveal from "./Reveal";

interface SectionHeaderProps {
  no: string;
  label: string;
  title: string;
  en: string;
  desc: string;
  dark?: boolean;
}

export default function SectionHeader({ no, label, title, en, desc, dark = false }: SectionHeaderProps) {
  return (
    <Reveal
      className={`mb-14 flex flex-col gap-6 border-b pb-8 md:flex-row md:items-end md:justify-between ${
        dark ? "border-bone/20" : "border-ink/15"
      }`}
    >
      <div>
        <p className="mb-3 font-display text-[11px] tracking-[0.35em] text-vermilion uppercase">
          {no} — {label}
        </p>
        <h2
          className={`text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl ${
            dark ? "text-bone" : "text-ink"
          }`}
        >
          {title}
        </h2>
        <p className={`mt-2 font-serif text-2xl italic sm:text-3xl ${dark ? "text-bone/50" : "text-ash"}`}>{en}</p>
      </div>
      <p className={`max-w-md font-kr text-sm leading-relaxed ${dark ? "text-bone/60" : "text-ash"}`}>{desc}</p>
    </Reveal>
  );
}
