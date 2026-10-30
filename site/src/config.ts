// ─────────────────────────────────────────────────────────────
// 공개 전에 이 파일만 본인 정보로 바꾸면 됩니다.
// ─────────────────────────────────────────────────────────────
export const PROFILE = {
  brand: "AUTOMATION LAB",
  mark: "A/L",
  tagline: "Python Automation Studio",
  location: "Seoul",
  // 저장소 주소 — 각 데모의 "코드 보기" 링크에 사용
  repo: "https://github.com/leewonseok123/automation-portfolio",
  // 의뢰 창구 — 크몽 프로필 승인 후 href 를 본인 프로필 주소로 교체하세요.
  // (개인 이메일·전화번호는 공개 사이트에 올리지 않습니다. 크몽은 플랫폼 밖 직거래를 제한합니다.)
  contacts: [
    { label: "크몽", en: "Kmong", href: "https://kmong.com" },
    { label: "깃허브", en: "GitHub", href: "https://github.com/leewonseok123" },
  ],
};

export const demoUrl = (folder: string) => `${PROFILE.repo}/tree/main/demos/${folder}`;
