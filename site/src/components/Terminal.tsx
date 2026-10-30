import { useEffect, useRef, useState } from "react";

interface TerminalProps {
  title: string;
  command: string;
  lines: string[];
  speed?: number;
  className?: string;
}

function colorize(line: string) {
  const m = line.match(/^(\d{2}:\d{2}:\d{2})\s+(INFO|WARNING|ERROR)\s+(.*)$/);
  if (!m) return <span className="text-bone/70">{line}</span>;
  const [, time, level, rest] = m;
  const alert = rest.startsWith("ALERT");
  return (
    <>
      <span className="text-bone/30">{time} </span>
      <span className={level === "INFO" ? "text-bone/45" : "text-vermilion"}>{level.padEnd(7)} </span>
      <span className={alert ? "text-vermilion" : rest.startsWith("완료") ? "font-semibold text-bone" : "text-bone/80"}>
        {rest}
      </span>
    </>
  );
}

/** 실제 실행 로그를 화면에 들어왔을 때 한 줄씩 재생합니다. */
export default function Terminal({ title, command, lines, speed = 140, className = "" }: TerminalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRunning(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= lines.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [running, runId, lines.length, speed]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [count]);

  const done = count >= lines.length;

  return (
    <div ref={ref} className={`border border-bone/15 bg-[#0c0c0b] text-left ${className}`}>
      <div className="flex items-center justify-between border-b border-bone/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-vermilion" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
          <span className="ml-3 font-display text-[10px] tracking-[0.25em] text-bone/50 uppercase">{title}</span>
        </div>
        <button
          onClick={() => setRunId((n) => n + 1)}
          className="font-display text-[10px] tracking-[0.25em] text-bone/40 uppercase transition-colors hover:text-vermilion"
          data-cursor="link"
        >
          ↻ Replay
        </button>
      </div>
      <div ref={bodyRef} className="h-[300px] overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[1.75] sm:text-xs">
        <p className="text-bone">
          <span className="text-vermilion">$</span> {command}
        </p>
        {lines.slice(0, count).map((line, i) => (
          <p key={`${runId}-${i}`} className="whitespace-pre-wrap break-all">
            {colorize(line)}
          </p>
        ))}
        <p className="text-bone/60">
          {done && <span className="text-vermilion">$ </span>}
          <span className="caret" />
        </p>
      </div>
    </div>
  );
}
