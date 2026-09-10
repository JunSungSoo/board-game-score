# board-game-score

React 기반 보드게임 점수 기록기. 스컬킹·티츄·기타 스코어를 지원합니다.

## 개발

Node.js 24와 pnpm 10.17.1을 사용합니다.

```sh
corepack enable
pnpm install --frozen-lockfile
# .env.example을 .env.local로 복사한 뒤 공개용 Supabase 설정 입력
pnpm dev
```

로그인: `/login`, 가입: `/signup`, 게임: `/`.
기존 `/login.html`, `/signup.html`, `/index.html` 주소도 React 라우트로 연결됩니다.
HTML 파일을 직접 열지 않고 Vite 개발 서버를 사용합니다.

```sh
pnpm check    # TypeScript + Vitest + production build
pnpm preview  # dist 빌드 결과 확인
```

## 구조

- `src/App.tsx`: SPA 라우트와 인증 보호
- `src/pages`: 로그인·회원가입·게임 페이지 root
- `src/features`: 게임 선택, 인원 설정, 점수 입력, 규칙, 결과, 계정 기능
- `src/shared/data`: 공통 타입과 `UPPER_SNAKE_CASE` 상수
- `src/shared/api`: 공통 Supabase client와 React Query query/mutation
- `src/shared/hooks`: 화면 리플 등 공통 hook
- `src/stores`: Zustand 게임 상태와 기존 저장 데이터 호환 계층

기존 DOM 기반 HTML/JavaScript 실행기는 제거했습니다. Cloudflare Pages의 SPA 새로고침은
`public/_redirects`가 `index.html`로 연결합니다.

## Supabase

`.env.local`과 Cloudflare 빌드 환경에 `.env.example`의 변수를 설정합니다.
`VITE_` 변수는 브라우저 번들에 공개되므로 publishable 키만 사용합니다.
secret/service_role 키와 비밀번호는 넣지 않습니다. 데이터 접근 권한은 RLS가 담당합니다.
서비스 주소와 내부 인증 도메인은 모두 `danbi-score.pages.dev`입니다.
`VITE_AUTH_DOMAIN`은 DB의 `handle_new_user` 검증식과 일치해야 합니다.
도메인 변경 SQL의 원격 적용 여부는 별도 확인이 필요합니다.
가상 이메일 방식은 이메일 확인 기능이 꺼져 있어야 합니다.
기존 도메인으로 생성된 계정이 있다면 별도의 계정 식별자 이전이 필요합니다.

## GitHub / 배포

원격: https://github.com/JunSungSoo/board-game-score.git

GitHub Actions에서 타입검사, 테스트, 빌드를 실행합니다.
Cloudflare Pages Git 연동 설정은 빌드 `pnpm build`, 출력 `dist`, Node `24`입니다.
빌드 환경에도 공개용 Supabase 변수를 설정해야 합니다.
Direct Upload로 만든 기존 Pages를 유지하려면 GitHub Actions + Wrangler로 배포할 수 있습니다.
Cloudflare 자체 Git 연동을 쓰려면 새 Pages 프로젝트를 만들고 검증 후 사용자 도메인을 연결합니다.
SQL·백업 ZIP·로컬 설정은 `dist` 배포 결과에 포함하지 않습니다.

원본 정적 버전은 Git 커밋 `88c3b27`에 보존되어 있습니다.
도메인이 바뀌면 브라우저 저장소는 자동으로 이전되지 않습니다.

2026-09-09 검증: 타입 검사, Vitest, 프로덕션 빌드 통과.
브라우저에서 React 게스트 진입, 게임 선택, 스컬킹 참가자 설정과 점수 입력 화면을 확인했습니다.
실제 회원가입, 원격 도메인 변경 SQL 실행, Cloudflare 배포는 별도 진행 항목입니다.
