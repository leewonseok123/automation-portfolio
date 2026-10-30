import { useMemo, useRef, useState } from "react";
import { demoUrl } from "../config";
import { data, won, type AlertKind } from "../data";
import Counter from "./Counter";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import Terminal from "./Terminal";

const KIND_LABEL: Record<AlertKind, { ko: string; icon: string }> = {
  PRICE_DROP: { ko: "가격 하락", icon: "📉" },
  TARGET_HIT: { ko: "목표가 도달", icon: "🎯" },
  NEW_LOW: { ko: "역대 최저가", icon: "🏆" },
  RESTOCK: { ko: "재입고", icon: "🔔" },
};

const W = 1000;
const H = 360;
const PAD = { l: 78, r: 16, t: 20, b: 36 };
const HOUR = 3600_000;

function hourLabel(start: string, i: number) {
  const d = new Date(new Date(start).getTime() + i * HOUR);
  const kst = new Date(d.getTime() + 9 * HOUR);
  return `${kst.getUTCMonth() + 1}/${kst.getUTCDate()} ${String(kst.getUTCHours()).padStart(2, "0")}시`;
}

export default function MonitorSection() {
  const { products, summary, alerts, log } = data.monitor;
  const [sel, setSel] = useState(products[0].id);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const p = products.find((x) => x.id === sel)!;
  const n = p.prices.length;
  const start = p.start!;

  const chart = useMemo(() => {
    const vals = p.prices.filter((v): v is number => v !== null);
    const lo = Math.min(...vals, p.target_price ?? Infinity) * 0.97;
    const hi = Math.max(...vals) * 1.02;
    const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const points = p.prices.map((v, i) => (v === null ? null : [x(i), y(v)] as const));
    const ticks = Array.from({ length: 4 }, (_, k) => lo + ((hi - lo) * (k + 0.5)) / 4);
    const markers = p.alerts
      .filter((a, i, arr) => arr.findIndex((b) => b.at === a.at) === i)
      .map((a) => Math.round((new Date(a.at).getTime() - new Date(start).getTime()) / HOUR))
      .filter((i) => i >= 0 && i < n && p.prices[i] !== null);
    return { x, y, points, ticks, markers };
  }, [p, n, start]);

  const feed = alerts.filter((a) => a.target === sel);

  const onMove = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1));
    setHover(i >= 0 && i < n ? i : null);
  };

  const hv = hover !== null ? p.prices[hover] : null;

  return (
    <section id="monitor" className="relative overflow-hidden bg-ink py-24 text-bone sm:py-32">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <SectionHeader
          dark
          no="03"
          label="Price Monitor"
          title="알림봇"
          en="Price & Stock Monitor"
          desc={`가격이 변하는 테스트용 쇼핑몰을 띄워 ${summary.cycles}시간 분량을 시뮬레이션했습니다. 같은 시점에 겹친 이벤트는 메시지 1건으로 묶고, 같은 알림은 3시간 쿨다운으로 반복 발송을 막습니다.`}
        />

        {/* 상품 선택 */}
        <Reveal className="mb-8 flex flex-wrap gap-2">
          {products.map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setSel(x.id);
                setHover(null);
              }}
              className={`border px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                sel === x.id
                  ? "border-vermilion bg-vermilion text-bone"
                  : "border-bone/25 text-bone/60 hover:border-bone hover:text-bone"
              }`}
              data-cursor="link"
            >
              {x.name}
            </button>
          ))}
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12">
          {/* 차트 */}
          <Reveal className="lg:col-span-8">
            <div className="flex items-baseline justify-between border-b border-bone/20 pb-3">
              <div>
                <p className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">
                  {hover !== null ? hourLabel(start, hover) : "Price history · 72h"}
                </p>
                <p className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
                  {hv != null ? won(hv) : won(p.prices[n - 1] ?? 0)}
                  {hover !== null && !p.stock[hover] && <span className="ml-3 text-sm text-vermilion">일시품절</span>}
                </p>
              </div>
              <p className="text-right text-xs text-bone/50">
                목표가 <span className="font-mono text-vermilion">{won(p.target_price ?? 0)}</span>
              </p>
            </div>

            <div className="relative mt-4">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full touch-none"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
                onTouchMove={(e) => onMove(e.touches[0] as unknown as React.MouseEvent)}
              >
                {/* 품절 구간 */}
                {p.stock.map((ok, i) =>
                  ok ? null : (
                    <rect
                      key={i}
                      x={chart.x(Math.max(0, i - 0.5))}
                      y={PAD.t}
                      width={(W - PAD.l - PAD.r) / (n - 1)}
                      height={H - PAD.t - PAD.b}
                      fill="rgba(232,68,46,.12)"
                    />
                  ),
                )}
                {/* y 눈금 */}
                {chart.ticks.map((t) => (
                  <g key={t}>
                    <line x1={PAD.l} x2={W - PAD.r} y1={chart.y(t)} y2={chart.y(t)} stroke="rgba(242,239,233,.08)" />
                    <text x={PAD.l - 10} y={chart.y(t) + 4} textAnchor="end" fontSize="15" fill="rgba(242,239,233,.4)" fontFamily="JetBrains Mono">
                      {Math.round(t / 1000).toLocaleString()}k
                    </text>
                  </g>
                ))}
                {/* x 눈금 */}
                {Array.from({ length: Math.floor((n - 1) / 24) + 1 }, (_, k) => k * 24).map((i) => (
                  <text key={i} x={chart.x(i)} y={H - 10} textAnchor="middle" fontSize="15" fill="rgba(242,239,233,.4)" fontFamily="JetBrains Mono">
                    {hourLabel(start, i)}
                  </text>
                ))}
                {/* 목표가 */}
                {p.target_price && (
                  <line
                    x1={PAD.l}
                    x2={W - PAD.r}
                    y1={chart.y(p.target_price)}
                    y2={chart.y(p.target_price)}
                    stroke="var(--color-vermilion)"
                    strokeDasharray="6 6"
                    strokeWidth="1.5"
                  />
                )}
                {/* 가격선 */}
                <polyline
                  key={sel}
                  className="draw-line"
                  style={{ ["--len" as string]: 1 }}
                  pathLength={1}
                  points={chart.points.filter(Boolean).map((pt) => pt!.join(",")).join(" ")}
                  fill="none"
                  stroke="#f2efe9"
                  strokeWidth="2.25"
                  strokeLinejoin="round"
                />
                {/* 알림 지점 */}
                {chart.markers.map((i) => (
                  <g key={`${sel}-${i}`}>
                    <circle cx={chart.points[i]![0]} cy={chart.points[i]![1]} r="9" fill="rgba(232,68,46,.25)" />
                    <circle cx={chart.points[i]![0]} cy={chart.points[i]![1]} r="4.5" fill="var(--color-vermilion)" />
                  </g>
                ))}
                {/* 호버 */}
                {hover !== null && chart.points[hover] && (
                  <g>
                    <line x1={chart.points[hover]![0]} x2={chart.points[hover]![0]} y1={PAD.t} y2={H - PAD.b} stroke="rgba(242,239,233,.35)" />
                    <circle cx={chart.points[hover]![0]} cy={chart.points[hover]![1]} r="6" fill="#131311" stroke="#f2efe9" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-bone/50">
              <span className="flex items-center gap-2">
                <span className="h-[2px] w-5 bg-bone" /> 가격
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 border-t-[1.5px] border-dashed border-vermilion" /> 목표가
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-vermilion" /> 알림 발송
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-4 bg-vermilion/20" /> 품절 구간
              </span>
            </div>

            {/* 이벤트 통계 */}
            <div className="mt-10 grid grid-cols-2 gap-px border border-bone/15 bg-bone/15 sm:grid-cols-4">
              {(Object.keys(KIND_LABEL) as AlertKind[]).map((k) => (
                <div key={k} className="bg-ink p-5">
                  <p className="font-display text-4xl font-black tracking-tight">
                    <Counter value={summary.by_kind[k] ?? 0} />
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {KIND_LABEL[k].icon} {KIND_LABEL[k].ko}
                  </p>
                  <p className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase">{k.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* 텔레그램 피드 */}
          <Reveal delay={120} className="lg:col-span-4">
            <div className="flex h-full flex-col border border-bone/15 bg-[#17212b]">
              <div className="flex items-center gap-3 border-b border-black/30 bg-[#232e3c] px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vermilion font-display text-xs font-black">
                  PM
                </span>
                <div>
                  <p className="text-sm font-semibold">가격 알림봇</p>
                  <p className="text-[11px] text-[#6c7883]">bot · 알림 {feed.length}건</p>
                </div>
              </div>
              <div className="max-h-[560px] flex-1 space-y-2.5 overflow-y-auto p-4">
                {feed.length === 0 && <p className="text-sm text-bone/40">이 상품은 알림이 없었습니다.</p>}
                {feed.map((a, i) => (
                  <div key={i} className="w-fit max-w-[95%] rounded-xl rounded-tl-sm bg-[#182533] px-3.5 py-2.5 shadow-sm">
                    <div className="mb-1 flex flex-wrap gap-1">
                      {a.kinds.map((k) => (
                        <span key={k} className="rounded bg-vermilion/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff8a78]">
                          {KIND_LABEL[k].ko}
                        </span>
                      ))}
                    </div>
                    {a.text
                      .split("\n")
                      .slice(0, -1)
                      .map((ln, j) => (
                        <p key={j} className="text-[13px] leading-snug text-[#e6ecf0]">
                          {ln}
                        </p>
                      ))}
                    <p className="mt-1 text-right text-[10px] text-[#6c7883]">
                      {hourLabel(start, Math.round((new Date(a.at).getTime() - new Date(start).getTime()) / HOUR))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* 운영 */}
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Terminal title="02_price_monitor — demo run" command={`python monitor.py --demo --cycles ${summary.cycles}`} lines={log} speed={90} />
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <h3 className="mb-4 font-display text-xs font-bold tracking-[0.3em] uppercase">24시간 운영 방식</h3>
            <div className="border border-bone/15 bg-[#0c0c0b] p-5 font-mono text-[12px] leading-relaxed text-bone/80">
              <p className="text-bone/40"># 10분마다 1회 점검 (crontab -e)</p>
              <p>
                */10 * * * * cd ~/monitor &amp;&amp; <span className="text-vermilion">python monitor.py --once</span>
              </p>
              <p className="mt-4 text-bone/40"># 텔레그램 연결 — 환경변수 2개면 끝</p>
              <p>export TELEGRAM_BOT_TOKEN=…</p>
              <p>export TELEGRAM_CHAT_ID=…</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-bone/70">
              {[
                "감시 대상은 targets.json 에 URL · 선택자 · 목표가만 추가",
                "가격 이력은 SQLite 한 파일 — 백업·이전이 쉬움",
                "역대 최저가는 이력 12회 이상 + 1% 이상 하락일 때만 (몇백 원 차이 소음 제거)",
                "수집 실패는 로그만 남기고 다음 상품으로 계속 진행",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1 w-4 shrink-0 bg-vermilion" />
                  {t}
                </li>
              ))}
            </ul>
            <a
              href={demoUrl("02_price_monitor")}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 flex w-fit items-center gap-3 border border-bone/40 px-7 py-4 font-display text-xs font-bold tracking-[0.25em] uppercase transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
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
