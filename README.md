# 우리뭐해

우리 둘의 일정과 결혼 준비를 함께 관리하는 캘린더입니다.

초기 버전은 Next.js 기반 웹/PWA로 만들고, 추후 Capacitor로 iOS/Android 패키징할 수 있도록 Firebase와 도메인 기능을 분리했습니다.

Android 앱의 런처 표시 이름은 `우리모해`이며, 배포된 `https://we-mohae.web.app`을 보안 설정된 WebView로 표시합니다.

## 기술 스택

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Firebase Auth, Firestore, Firebase Cloud Messaging, Cloud Functions
- Date: date-fns
- Test: Firebase Rules Unit Testing, Vitest

## 실행 방법

```bash
npm install
cp .env.example .env.local
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## Firebase 설정

`.env.local`에 Firebase Web App 값을 입력합니다.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

Firebase Console에서 아래 항목을 활성화해야 합니다.

- Authentication: Email/Password
- Firestore Database
- Cloud Messaging Web Push certificate
- Cloud Functions

Firebase Authentication 기본 비밀번호 복구는 숫자 인증번호가 아닌 이메일 재설정 링크 방식입니다. 로그인 화면에서 메일을 발송하면 Firebase가 한국어 재설정 메일을 보내고, 사용자는 메일 링크에서 새 비밀번호를 설정합니다.

## FCM 웹 푸시 설정

웹 FCM은 루트 경로의 `public/firebase-messaging-sw.js`가 필요합니다.

원본 파일에는 실제 Firebase config를 넣지 않기 위해 `REPLACE_WITH_*` placeholder가 들어 있습니다. `npm run build` 이후 `postbuild` 스크립트가 `.env.local` 또는 배포 환경변수의 Firebase config를 `out/firebase-messaging-sw.js`에 자동 주입합니다.

클라이언트 흐름:

1. 설정 화면에서 알림 권한 요청
2. `NEXT_PUBLIC_FIREBASE_VAPID_KEY` 기준 FCM token 발급
3. `couples/{coupleId}/fcmTokens/{token}`에 저장
4. Cloud Functions에서 coupleId 기준 token 조회 후 발송

## Android 앱

Android 프로젝트는 `android/`에 있으며 패키지 ID는 `com.woorimwohae.app`입니다.

빌드 도구는 현재 Android Studio 지원 범위에 맞춰 AGP `8.10.1`, Gradle `8.11.1`, JDK `17` 조합으로 고정했습니다.

구조:

- Firebase Android 앱 설정: `android/app/google-services.json`
- WebView 허용 원본: `https://we-mohae.web.app`만 앱 내부에서 로드
- 외부 링크: 기기 기본 브라우저로 이동
- Android FCM 토큰: 네이티브 Firebase Messaging SDK에서 발급
- 토큰 전달: 허용 원본이 제한된 `WebViewCompat.addWebMessageListener` 브리지 사용
- 토큰 저장: 웹 로그인 사용자 기준 `couples/{coupleId}/fcmTokens/{token}`에 `platform: "android"`로 저장
- 푸시 클릭: 일정은 캘린더, 예산은 예산관리 화면으로 이동

Android 빌드:

```bash
cd android
./gradlew testDebugUnitTest assembleDebug
```

디버그 APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Android 13 이상에서는 설정 화면의 `알림 권한 요청`을 눌러 네이티브 알림 권한을 허용해야 합니다.

## Firestore 구조

```text
users/{userId}
couples/{coupleId}
couples/{coupleId}/schedules/{scheduleId}
couples/{coupleId}/budgets/{budgetId}
couples/{coupleId}/fcmTokens/{tokenId}
couples/{coupleId}/sentNotifications/{notificationId}
inviteCodes/{inviteCode}
```

초대코드는 `couples` 전체를 조회하지 않도록 `inviteCodes/{inviteCode}` 인덱스 문서를 둡니다. 사용자는 초대코드 문서만 조회하고, 해당 `coupleId`의 `memberIds`에 본인을 추가한 뒤 멤버 권한으로 커플 데이터를 읽습니다.

## 주요 화면

- `/login`: 이메일 로그인, 회원가입, 비밀번호 재설정 메일 발송
- `/onboarding`: 커플 모드 / 예비부부 모드 선택
- `/invite`: 초대코드 생성, 복사, 입력, 연결 상태 확인
- `/home`: 가까운 일정, 파트너 상태, 예비부부 예산 요약
- `/calendar`: 월간 캘린더, 일정 CRUD
- `/budget`: 예비부부 모드 전용 예산 CRUD, 세부 카테고리, 계약금일·잔금일, 결제일/추가일 정렬
- `/settings`: 내 정보, 파트너 정보, 비밀번호 변경, 커플 연결 해제, 알림 권한, 로그아웃

커플 모드에서는 예산관리 탭이 렌더링되지 않으며, `/budget` 직접 접근 시 홈으로 이동합니다.

## Cloud Functions

구현된 함수:

- `onScheduleCreated`: 파트너가 추가한 일정 알림
- `onScheduleUpdated`: 파트너가 수정한 일정 알림
- `scheduledReminderWorker`: 알림이 켜진 일정에 대해 하루 전 오전 9시와 당일 오전 9시 알림
- `scheduledBudgetPaymentReminderWorker`: 예비부부 모드 계약금일·잔금일 하루 전 오전 9시 알림

중복 발송 방지는 `sentNotifications`에 idempotent notificationId를 기록하는 방식입니다.

## 보안 규칙

`firestore.rules` 원칙:

- 비로그인 사용자는 접근 불가
- `users/{userId}`는 본인 또는 같은 커플의 파트너만 읽을 수 있고, 쓰기는 본인만 가능
- `couples/{coupleId}`와 하위 컬렉션은 멤버만 접근
- `budgets`는 `mode == "wedding"`인 커플만 접근
- 커플 멤버는 최대 2명
- `sentNotifications`는 클라이언트 쓰기 금지

Rules 테스트:

```bash
npm run rules:test
```

## 배포

```bash
npm run build
npm run deploy:firebase
```

`next build`는 정적 배포물을 `out/`에 생성하고 Firebase Hosting은 해당 폴더를 배포합니다.

배포 후 기본 주소:

```text
https://we-mohae.web.app
https://we-mohae.firebaseapp.com
```

Cloud Functions는 별도로 배포합니다.

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

예약 실행되는 오전 9시 푸시 Functions는 Firebase Blaze 요금제가 필요합니다. Spark 요금제에서는 `cloudfunctions.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com` 활성화 단계에서 배포가 차단됩니다.

## 설계 결정

- 저장 시간은 Firestore Timestamp로 저장하고, 화면에서는 사용자의 로컬 타임존 기준으로 표시합니다.
- Firestore 요청은 `coupleId` 하위 컬렉션 중심으로 제한했습니다.
- 사용 모드는 `couples/{coupleId}.mode`를 공유 기준값으로 사용합니다. 모드를 변경해도 기존 결혼 준비 일정과 예산 데이터는 삭제하지 않고 화면 노출만 전환합니다.
- 예비부부 모드의 캘린더는 일정의 `type` 값으로 커플 일정과 결혼 준비 일정을 분리합니다.
- 캘린더는 월 단위 쿼리로 조회합니다.
- 예산 금액은 number로 저장하고 화면에서 원화 포맷으로 변환합니다.
- 예산은 대분류와 자유 입력 가능한 세부 카테고리를 함께 저장합니다. 계약금 결제일과 잔금 결제일을 분리하며, 기존 알림 worker 호환을 위해 `paymentDate`에는 잔금 결제일을 함께 저장합니다.
- 커플 연결 해제 시 해제를 실행한 사용자는 새 개인 커플 공간으로 이동합니다. 기존 공유 일정과 예산은 상대방의 기존 공간에 보존됩니다.
- 삭제는 실제 삭제로 구현했지만, 타입과 컬렉션 구조상 `deletedAt` 기반 soft delete 확장이 가능합니다.
- 현재는 React hooks 중심이며, 전역 상태가 커질 경우 Zustand 도입 여지를 남겼습니다.

## 리스크 및 TODO

- FCM 서비스워커 config는 보안상 placeholder입니다. 실서비스에서는 배포 환경별 생성 스크립트가 필요합니다.
- Cloud Functions의 예약 worker는 모든 couple을 순회합니다. 사용량 증가 시 `notificationJobs` 컬렉션이나 BigQuery/Cloud Tasks 기반으로 확장하는 것이 좋습니다.
- 초대코드 인덱스 문서는 코드 충돌 재시도 로직이 아직 없습니다. 충돌 가능성은 낮지만 생성 시 재시도 함수를 추가할 수 있습니다.
- iOS 패키징 전에는 APNs 연결과 iOS FCM 토큰 저장·권한 흐름을 별도 구현해야 합니다.
- Android 앱은 현재 WebView 기반입니다. Play Store 출시 전 릴리스 서명, 개인정보처리방침, 앱 아이콘 교체가 필요합니다.
- Firebase Android 앱의 Console 관리용 표시 이름은 현재 `우리뭐해 Android`입니다. 실제 설치 앱 이름은 `우리모해`이며, Console 표시 이름은 Firebase Console 프로젝트 설정에서 수동 변경할 수 있습니다.
- 예약 푸시 Functions 실제 배포를 위해 Firebase 프로젝트를 Blaze 요금제로 전환해야 합니다.

## 커밋 메시지

```text
feat: 우리뭐해 PWA 초기 구현
```
