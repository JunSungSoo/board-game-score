# board-game-score

React 기반 보드게임 점수 기록기. 스컬킹·티츄·기타 스코어를 지원합니다.

## 개발

Node.js 24와 pnpm 10.17.1을 사용합니다.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

기본 진입 화면은 `/game/select`이며 `/`와 `/index.html`도 게임 선택으로 연결됩니다.
HTML 파일을 직접 열지 않고 Vite 개발 서버를 사용합니다.

```sh
pnpm check    # TypeScript + Vitest + production build
pnpm preview  # dist 빌드 결과 확인
```

## 구조

- `src/App.tsx`: 게임과 보드게임 설명서 SPA 라우트
- `src/pages`: 게임·보드게임 설명서 페이지 root
- `src/features`: 게임 선택, 고정 인원·게스트 설정, 점수 입력, 규칙, 결과
- `src/shared/data`: 공통 타입, `UPPER_SNAKE_CASE` 상수, 정적 보드게임 설명서
- `src/shared/hooks`: 화면 리플 등 공통 hook
- `src/stores`: Zustand 게임 상태와 기존 저장 데이터 호환 계층

기존 DOM 기반 HTML/JavaScript 실행기는 제거했습니다. Cloudflare Pages의 SPA 새로고침은
`public/_redirects`가 `index.html`로 연결합니다.

## 데이터 저장

점수 기록은 브라우저의 로컬 저장소에만 저장되고 보드게임 설명서는 빌드에 포함된 정적 데이터입니다.
별도 API, 데이터베이스 또는 서버 환경변수가 필요하지 않습니다.

## GitHub / 배포

원격: https://github.com/JunSungSoo/board-game-score.git

GitHub Actions에서 타입검사, 테스트, 빌드를 실행합니다.
Cloudflare Pages Git 연동 설정은 빌드 `pnpm build`, 출력 `dist`, Node `24`입니다.
Direct Upload로 만든 기존 Pages를 유지하려면 GitHub Actions + Wrangler로 배포할 수 있습니다.
Cloudflare 자체 Git 연동을 쓰려면 새 Pages 프로젝트를 만들고 검증 후 사용자 도메인을 연결합니다.
SQL·백업 ZIP·로컬 설정은 `dist` 배포 결과에 포함하지 않습니다.

원본 정적 버전은 Git 커밋 `88c3b27`에 보존되어 있습니다.
도메인이 바뀌면 브라우저의 로컬 게임 점수 저장소는 자동으로 이전되지 않습니다.
