# Logue Web

Flutter 앱 "Logue"의 웹 버전입니다. 사용자의 책장을 공유하고 다른 사람의 책장을 탐색할 수 있는 소셜 플랫폼입니다.

## 기능

- **프로필 페이지**: 사용자의 책장과 정보를 표시
- **책 리뷰 페이지**: 특정 책에 대한 리뷰와 정보 표시
- **공유 기능**: 프로필 링크 공유
- **반응형 디자인**: 모바일과 데스크톱 모두 지원
- **Flutter 앱과 동일한 디자인**: 모바일에서 앱과 동일한 UI/UX

## 기술 스택

- React 18
- React Router DOM
- Supabase (데이터베이스)
- Vite (빌드 도구)

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. **환경 변수 설정 (필수)**:
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Flutter 앱과 동일한 Supabase 프로젝트의 URL과 키를 사용해야 합니다.**

3. 개발 서버 실행:
```bash
npm run dev
```

4. 빌드:
```bash
npm run build
```

## 라우팅

- `/`: 홈페이지
- `/u/:username`: 사용자 프로필 페이지
- `/u/:username/book/:bookId`: 책 리뷰 페이지

## 디자인 특징

- **모바일 우선**: Flutter 앱과 동일한 모바일 디자인
- **데스크톱 중앙 정렬**: 768px 이상에서는 375px 너비로 중앙 정렬
- **동일한 색상**: Flutter 앱과 동일한 색상 팔레트 사용
- **동일한 레이아웃**: 프로필, 책장, 리뷰 페이지가 앱과 동일

## Supabase 설정

이 프로젝트는 Supabase를 사용하여 데이터를 관리합니다. 다음 테이블들이 필요합니다:

- `profiles`: 사용자 프로필 정보
- `books`: 책 정보
- `user_books`: 사용자가 추가한 책과 리뷰
- `follows`: 팔로우 관계

## 개발

프로젝트는 Flutter 앱과 동일한 Supabase 데이터베이스를 사용하므로, 앱에서 생성된 프로필 링크를 웹에서도 접근할 수 있습니다.

**중요**: 환경 변수가 설정되지 않으면 애플리케이션이 실행되지 않습니다. Flutter 앱의 Supabase 설정을 확인하여 동일한 값을 사용하세요.
