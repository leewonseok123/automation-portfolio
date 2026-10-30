// ─────────────────────────────────────────────────────────────
// 공개 전에 이 파일만 본인 정보로 바꾸면 됩니다.
// ─────────────────────────────────────────────────────────────
export const PROFILE = {
  brand: "AUTOMATION LAB",
  mark: "A/L",
  tagline: "Python Automation Studio",
  location: "Seoul",
  // 저장소 주소 — 각 데모의 "코드 보기" 링크에 사용
  repo: "https://github.com/YOUR_ID/automation-portfolio",
  // 의뢰 창구 (크몽 · 숨고 · 이메일 중 있는 것만 남기세요)
  contacts: [
    { label: "크몽", en: "Kmong", href: "https://kmong.com" },
    { label: "숨고", en: "Soomgo", href: "https://soomgo.com" },
    { label: "이메일", en: "Email", href: "mailto:you@example.com" },
  ],
};

export const demoUrl = (folder: string) => `${PROFILE.repo}/tree/main/demos/${folder}`;
