# 크롤링을 통한 업무 자동화 프로그램 프로젝트

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![Selenium](https://img.shields.io/badge/-selenium-%43B02A?style=for-the-badge&logo=selenium&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)

빌드 흐름

1. `backend/` 폴더에서 아래 명령어를 사용하면, `frontend/resources` 폴더에 `script` 혹은 `script.exe`가 생성됩니다.

   ```shell
   cd backend
   pyinstaller \
     --onefile \
     --name script \
     --distpath ../frontend/resources \
     src/main.py
   cd ..
   ```

2. `frontend/` 폴더에서 Electron을 빌드합니다. (package.json에 resources/script 파일을 함께 빌드하도록 설정되어 있습니다)

   ```shell
   cd fronend
   npm run build
   cd dist
   ```

3. `frontend/dist` 폴더에 설치용 파일이 생성됩니다. 이를 실행하면 설치가 마무리됩니다.
