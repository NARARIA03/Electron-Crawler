# 빌드 방법

```shell
pyinstaller \
  --onefile \
  --name script \
  --distpath ../frontend/resources \
  src/main.py
```

# 실행 테스트

```shell
/dist/mycrawler --type open-go-kr --data '[{"query":"전자칠판","organization":"서울서일초등학교","location":"서울특별시교육청","startDate":"2025-02-19","endDate":"2025-05-22"}]'
```
