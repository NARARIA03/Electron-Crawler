from configs.Browser import Browser
import time

MOCK = {
    "query": "전자칠판",
    "organization": "서울서일초등학교",
    "location": "서울특별시교육청",
    "include": "null",
    "exclude": "null",
    "startDate": "2025-02-19",
    "endDate": "2025-05-22",
}

if __name__ == "__main__":
    try:
        # 사이트 접속
        browser = Browser("https://www.open.go.kr/com/main/mainView.do")
        # 검색어 입력
        browser.typingInputElement("xpath", '//*[@id="m_input"]', MOCK["query"])
        # 검색 버튼 클릭
        browser.clickElement("xpath", '//*[@id="mainBackImg"]/div[2]/div[1]/div/button')
        # 상세 검색 클릭해서 iframe 모달 열기
        browser.actionToNewIframe(
            "xpath",
            '//*[@id="srchBtnDiv"]/a',
            "id",
            "modalIfm",
            lambda b: (
                # 초중고등학교 포함 클릭
                b.clickElement(
                    "xpath",
                    '//*[@id="popup_wrap"]/div[2]/div/div[1]/div/table/tbody/tr[1]/td/p/label',
                ),
                # 기관찾기 클릭
                b.actionToNewWindow(
                    "xpath",
                    '//*[@id="popup_wrap"]/div[2]/div/div[1]/div/table/tbody/tr[3]/td/div/button',
                    lambda b: (
                        # 기관명 입력
                        b.typingInputElement(
                            "xpath", '//*[@id="indvdlzInsttNm"]', MOCK["organization"]
                        ),
                        # 검색 클릭
                        b.clickElement(
                            "xpath",
                            '//*[@id="popup_wrap"]/div[2]/div[1]/table/tbody/tr/td/div/button[1]',
                        ),
                        # 검색 결과에 organization과 location이 모두 포함된 요소 클릭
                        b.clickElement(
                            "xpath",
                            f"//ul[contains(@class,'jstree-no-dots')]/li/a"
                            f"[contains(@title,'{MOCK['location']}') and "
                            f"contains(@title,'{MOCK['organization']}')]",
                        ),
                        # 확인 버튼 클릭
                        b.clickElement(
                            "xpath", '//*[@id="popup_wrap"]/div[2]/div[2]/div[5]/a[1]'
                        ),
                    ),
                ),
            ),
        )
    except Exception as e:
        print("에러 발생:", e)
