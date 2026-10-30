import raw from "./showcase.json";

export interface Book {
  title: string;
  category: string;
  price_gbp: number;
  rating: number;
  stock: number;
  upc: string;
}

export interface MonitorProduct {
  id: string;
  name: string;
  target_price: number | null;
  prices: (number | null)[];
  stock: boolean[];
  start: string | null;
  alerts: { at: string; kind: AlertKind; message: string }[];
}

export type AlertKind = "PRICE_DROP" | "TARGET_HIT" | "NEW_LOW" | "RESTOCK";

export interface Showcase {
  scraper: {
    summary: {
      source: string;
      pages: number;
      items: number;
      failed: number;
      requests: number;
      retries: number;
      workers: number;
      elapsed_sec: number;
      categories: number;
      avg_price_gbp: number;
    };
    log: string[];
    books: Book[];
  };
  monitor: {
    summary: {
      products: number;
      cycles: number;
      checks: number;
      messages: number;
      events: number;
      by_kind: Partial<Record<AlertKind, number>>;
      channel: string;
    };
    log: string[];
    products: MonitorProduct[];
    alerts: { at: string; target: string; kinds: AlertKind[]; text: string }[];
  };
  excel: {
    summary: {
      files: string[];
      rows_clean: number;
      issues: number;
      issues_by_kind: Record<string, number>;
      total_revenue: number;
      total_qty: number;
      branches: { name: string; revenue: number }[];
      monthly: { month: string; revenue: number }[];
      products: { name: string; revenue: number; qty: number }[];
      weekday: { day: string; avg: number }[];
      sample_issues: { file: string; row: number; reason: string }[];
      elapsed_sec: number;
    };
    log: string[];
  };
  dynamic: {
    summary: {
      source: string;
      strategies: { key: string; name: string; items: number; sec: number; pages?: number; scrolls?: number; requests?: number }[];
      endpoint: string;
      consistent: boolean;
      items: number;
      speedup_api_vs_browser: number;
      top_authors: [string, number][];
      top_tags: [string, number][];
    };
    log: string[];
  };
  quality: {
    tests: number;
    failures: number;
    seconds: number;
    by_file: Record<string, number>;
    python: string;
  };
}

export const data = raw as unknown as Showcase;

export const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
export const fmt = (n: number) => n.toLocaleString("ko-KR");
