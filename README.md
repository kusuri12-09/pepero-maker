# 빼빼로 메이커

프로젝트 루트에서 실행:

```sh
python -m pip install -r requirements.txt
python server.py
```

접속: http://localhost:4173/

- `index.html`: 화면과 스타일
- `app.js`: 제작, 이미지 저장, 메타 카드 생성과 공유 링크 복사
- `public/`: 아이콘, 폰트, 공통 메타 카드 이미지
- `server.py`: 카드 저장 API와 공유 주소의 Open Graph HTML 응답
- `.data/shares/`: 공유 카드 PNG. Git 제외. 삭제하면 기존 공유 링크도 사라집니다.

공유 버튼은 완성 사진이 들어간 1200×630 카드를 서버에 저장하고 `/share/고유번호` 링크를 복사합니다. 링크를 열면 만들기 화면으로 이동하며 메신저 크롤러에는 해당 카드가 메타 태그로 전달됩니다. 클립보드 실패 시 주소 입력칸을 표시합니다.

현재 서버는 로컬 개발용입니다. 외부 배포 시 `PUBLIC_URL`을 실제 HTTPS 주소로 설정하고 영구 저장소, 업로드 용량·빈도 제한, 보관 정책을 마련해야 합니다. 공통 카드의 `og:image`, `twitter:image`도 절대 HTTPS 주소로 바꾸어야 합니다. localhost 링크는 외부 기기와 메신저 크롤러가 접근할 수 없습니다.

검증:

```sh
node --test tests/share.test.cjs
python -m unittest discover -s tests -p "test_*.py"
```
