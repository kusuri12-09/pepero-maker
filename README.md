# 빼빼로 메이커

로컬 실행: `python -m http.server 4173` (프로젝트 루트에서 실행)

- `index.html`: 화면과 스타일
- `app.js`: 제작, 저장, 공유 기능
- `public/`: 아이콘, 폰트, 링크 미리보기 이미지

공유는 PNG 파일 전달을 우선 사용하며 미지원 또는 공유 오류 시 사이트 링크를 복사합니다. 사용자가 공유창을 취소하면 복사하지 않습니다.

메타 카드는 사이트 공통 대표 이미지입니다. 공개 주소가 정해지면 `og:image`, `twitter:image`를 해당 주소의 절대 HTTPS URL로 바꾸고 `og:url`을 추가해야 합니다. localhost에서는 외부 메신저가 카드를 가져갈 수 없습니다.

검증: `node --test tests/share.test.cjs`
