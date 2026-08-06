# Lawi 법률 AI

Microsoft Copilot Studio Direct Line API와 연동된 Lawi 법률 AI 웹 애플리케이션입니다.

## 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- Microsoft Copilot Studio Direct Line API

## 실행 방법

1. 프로젝트 폴더로 이동
```bash
cd c:\Users\user\Desktop\Lawi
```
2. 의존성 설치
```bash
npm install
```
3. 개발 서버 실행
```bash
npm run dev
```
4. 브라우저에서 접속
```bash
http://localhost:3000
```

## 환경 변수

`.env.local`에 다음 값을 추가합니다.

```env
DIRECT_LINE_SECRET=<your_direct_line_secret_here>
```

기존에 `NEXT_PUBLIC_DIRECT_LINE_SECRET`로 설정한 환경 변수가 있으면 그대로 두어도 동작합니다.

환경 변수 값은 GitHub에 커밋하지 마세요.

## 배포 안내

Vercel에 배포하려면 GitHub에 코드를 업로드하고 Vercel에서 저장소를 연결하세요.
환경 변수 `NEXT_PUBLIC_DIRECT_LINE_SECRET`을 추가하면 됩니다.
