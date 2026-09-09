# board-game-score

보드게임 점수 기록기. React 전환 1단계이며 스컬킹·티츄·기타 스코어를 지원합니다.

## 개발

Node.js 24와 Yarn 4.9.1을 사용합니다.

```sh
corepack enable
yarn install --immutable
# .env.example을 .env.local로 복사한 뒤 공개용 Supabase 설정 입력
yarn dev
```

로그인: `/login.html`, 가입: `/signup.html`, 게임: `/index.html`.
이제 HTML 파일을 직접 열거나 Python 정적 서버 대신 Vite 개발 서버를 사용합니다.

```sh
yarn check    # TypeScript + Vitest + production build
yarn preview  # dist 빌드 결과 확인
```

## 전환 상태

- React + TypeScript: 로그인, 회원가입, 화면 터치 효과.
- React Query: 인증 mutation과 사용자별 기록·랭킹 캐시. 게임 종료 시 캐시 무효화.
- Zustand: 게임 저장/복원. 기존 `board-game-score-v2` JSON 형식을 유지합니다.
- Day.js: 게임 기록 날짜 표시. 게임방 만료 판정은 기존 Supabase 서버 SQL이 담당합니다.
- Vitest: 점수 계산, 음수 보너스, 공유 트릭 제한, 저장 복원, 가입 중복확인 경합 테스트.
- Vite: 세 HTML 진입점을 모두 빌드하고 이미지·스크립트에 해시를 부여합니다.

`src/game-main.ts`가 기존 JS 게임 화면과 새 TypeScript 서비스를 연결합니다.
기존 `auth.js`와 `supabase-config.js`는 보존용이며 Vite 앱에서 로드하지 않습니다.
게임 본문·팀 설정·플로팅 패널·계정 모달은 아직 DOM 기반입니다.
후속 단계는 게임 계산을 순수 TS 함수로 분리하고 React 화면으로 차례대로 이식하는 것입니다.
SPA 라우터 전환은 게임 화면 이식 후 진행합니다. 기존 `.html` 주소는 현재 유지합니다.

## Supabase

`.env.local`과 Cloudflare 빌드 환경에 `.env.example`의 변수를 설정합니다.
`VITE_` 변수는 브라우저 번들에 공개되므로 publishable 키만 사용합니다.
secret/service_role 키와 비밀번호는 넣지 않습니다. 데이터 접근 권한은 RLS가 담당합니다.
인증 도메인은 `danbi.playground.com`이며 DB의 `handle_new_user` 검증식과 일치해야 합니다.
도메인 변경 SQL의 원격 적용 여부는 별도 확인이 필요합니다.
가상 이메일 방식은 이메일 확인 기능이 꺼져 있어야 하며, 실제 가입/로그인은 아직 검증 중입니다.
기존 도메인으로 생성된 계정이 있다면 별도의 계정 식별자 이전이 필요합니다.

## GitHub / 배포

원격: https://github.com/JunSungSoo/board-game-score.git

GitHub Actions에서 타입검사, 테스트, 빌드를 실행합니다.
Cloudflare Pages Git 연동 설정은 빌드 `yarn build`, 출력 `dist`, Node `24`입니다.
빌드 환경에도 공개용 Supabase 변수를 설정해야 합니다.
Direct Upload로 만든 기존 Pages를 유지하려면 GitHub Actions + Wrangler로 배포할 수 있습니다.
Cloudflare 자체 Git 연동을 쓰려면 새 Pages 프로젝트를 만들고 검증 후 사용자 도메인을 연결합니다.
SQL·백업 ZIP·로컬 설정은 `dist` 배포 결과에 포함하지 않습니다.

원본 정적 버전은 Git 커밋 `88c3b27`에 보존되어 있습니다.
도메인이 바뀌면 브라우저 저장소는 자동으로 이전되지 않습니다.

2026-09-09 검증: 타입 검사, Vitest 11개 테스트, 프로덕션 빌드 통과.
브라우저에서 게스트 진입, 스컬킹 음수 보너스 합산, 다음 라운드 진행,
이전 라운드 점수 수정과 누적 재계산을 확인했습니다.
실제 회원가입, 원격 도메인 변경 SQL 실행, Cloudflare 배포는 별도 진행 항목입니다.
