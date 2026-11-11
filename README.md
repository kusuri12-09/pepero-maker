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

## Cloudflare Workers

배포 주소: https://pepero-maker.kusuri12.workers.dev/

```sh
npm ci
npx wrangler d1 migrations apply pepero-maker-shares --local
npm run dev
```

배포:

```sh
npx wrangler d1 migrations apply pepero-maker-shares --remote
npm run deploy
```

`worker.mjs`가 API와 공유 링크를 처리하고 `scripts/build.mjs`가 루트 소스와 public 에셋만 `dist`에 복사합니다. 소스·Git·로컬 저장 데이터는 업로드하지 않습니다. 공통 카드와 개별 공유 카드의 메타 이미지 주소는 요청의 공개 HTTPS 주소로 설정됩니다.

계정에서 R2가 활성화되지 않아 작은 카드 PNG는 D1 `pepero-maker-shares`에 BLOB으로 저장합니다. 카드당 1 MiB, IP당 분당 10회 업로드를 제한하며 PNG 구조·체크섬·해제된 픽셀 크기를 검증합니다. 공유 링크에는 무작위 ID를 사용합니다. 카드에는 자동 만료가 없으며 저장량이 늘면 R2 등 객체 저장소로 이전하거나 보관 정책을 추가해야 합니다. D1/Workers 계정의 저장량·사용량 한도가 적용됩니다.

Python 서버는 로컬 개발용으로 유지합니다. localhost 공유 링크는 외부 기기와 메신저 크롤러가 접근할 수 없습니다. 로컬 `.data/shares` 이미지는 원격 D1으로 자동 이전되지 않습니다.

검증:

```sh
npm test
python -m unittest discover -s tests -p "test_*.py"
```
