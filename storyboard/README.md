# 우리뭐해 스토리보드

## 문서 범위

이 폴더는 `we-mohae-web` 서비스의 주요 화면, 사용자 플로우, 상태별 분기, 데이터 검증, 권한, 오류/빈/로딩 상태를 실제 코드 기준으로 정리한다.

주요 참고 소스:

- 라우트: `src/app/*/page.tsx`
- 공통 인증/레이아웃: `src/components/layout/AuthGate.tsx`, `src/components/layout/AppShell.tsx`
- 도메인 타입: `src/types/domain.ts`
- 서비스/훅: `src/features/**`, `src/hooks/**`
- 보안 규칙: `firestore.rules`

## 산출물

- [storyboard.md](./storyboard.md): 화면별 상세 스토리보드와 전이 조건
- [ux-ui-review.md](./ux-ui-review.md): 엔터프라이즈 SaaS 관점의 UX/UI 리뷰와 개선 권고안
- [qa-report.md](./qa-report.md): 스토리보드 기준 자동 QA 결과와 보류 항목

## 서비스 범위

서비스명은 `우리뭐해`이며, 커플 또는 예비부부가 일정과 결혼 준비 예산을 함께 관리하는 모바일 우선 PWA이다.

핵심 화면:

1. `/login`: 로그인, 회원가입, 비밀번호 재설정
2. `/onboarding`: 커플 모드 또는 예비부부 모드 선택
3. `/invite`: 파트너 초대코드 생성, 복사, 재생성, 입력
4. `/home`: 오늘 기준 요약, 다가오는 일정, 예비부부 예산/결제 요약
5. `/calendar`: 월간 캘린더와 일정 CRUD
6. `/budget`: 예비부부 모드 전용 예산 CRUD
7. `/settings`: 내 정보, 모드 변경, 파트너 연결, 비밀번호, 알림, 로그아웃

## 공통 전제

- 모든 보호 화면은 Firebase Auth 로그인과 `users/{uid}` 프로필 로드를 전제로 한다.
- 온보딩 완료 조건은 `profile.mode`와 `profile.coupleId`가 모두 존재하는 상태이다.
- 커플 공유 데이터는 `couples/{coupleId}` 하위 컬렉션에 저장한다.
- 커플 멤버는 최대 2명이다.
- 예산 기능은 커플 문서의 `mode == "wedding"`인 경우에만 접근 가능하다.
- 쓰기 작업 실패 시 대부분 토스트로 사용자 메시지를 표시한다.

## 문서 사용 방법

- QA는 `storyboard.md`의 "상태/전이/검증 체크포인트"를 기준으로 정상, 예외, 권한, 빈 상태를 테스트한다.
- 기획/디자인은 각 화면의 노출 조건과 모드별 차이를 기준으로 개선 범위를 판단한다.
- 개발은 "구현상 주의점"에 적힌 UI 검증 미흡 지점과 Firestore 규칙 의존 지점을 후속 개선 후보로 본다.
