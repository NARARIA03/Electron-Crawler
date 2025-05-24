from classes.Browser import Browser
import time


def crawlOpenGoKr(
    query: str,
    organization: str,
    location: str,
    include: str,
    exclude: str,
    startDate: str,
    endDate: str,
) -> None:
    try:
        # 사이트 접속
        browser = Browser("https://www.open.go.kr/com/main/mainView.do")
        # 검색어 입력
        browser.typingInputElement("xpath", '//*[@id="m_input"]', query)
        # 검색 버튼 클릭
        browser.clickElement("xpath", '//*[@id="mainBackImg"]/div[2]/div[1]/div/button')
        # 상세 검색 클릭
        browser.clickElement("xpath", '//*[@id="srchBtnDiv"]/a')
        # iframe에 focus
        browser.focusIframe("id", "modalIfm")
        # 초중고등학교 포함 클릭
        browser.clickElement(
            "xpath",
            '//*[@id="popup_wrap"]/div[2]/div/div[1]/div/table/tbody/tr[1]/td/p/label',
        )
        # 기관찾기 클릭
        browser.goToNewWindow(
            "xpath",
            '//*[@id="popup_wrap"]/div[2]/div/div[1]/div/table/tbody/tr[3]/td/div/button',
        )
        # 기관명 입력
        browser.typingInputElement("xpath", '//*[@id="indvdlzInsttNm"]', organization)
        # 검색 클릭
        browser.clickElement(
            "xpath",
            '//*[@id="popup_wrap"]/div[2]/div[1]/table/tbody/tr/td/div/button[1]',
        )
        # 검색 결과에 organization과 location이 모두 포함된 요소 클릭
        browser.clickElement(
            "xpath",
            f"//ul[contains(@class,'jstree-no-dots')]/li/a"
            f"[contains(@title,'{location}') and "
            f"contains(@title,'{organization}')]",
        )
        # 확인 버튼 클릭 (새 창 자동으로 닫힘)
        browser.clickElement("xpath", '//*[@id="popup_wrap"]/div[2]/div[2]/div[5]/a[1]')
        # 초기 윈도우로 이동 (리셋)
        browser.goToDefaultWindow()
        # iframe에 focus
        browser.focusIframe("id", "modalIfm")
        # 시작 날짜 종료 날짜 지정
        browser.typingInputElement("xpath", '//*[@id="startDate"]', startDate, True)
        browser.typingInputElement("xpath", '//*[@id="endDate"]', endDate, True)
        # 검색 버튼 클릭
        browser.clickElement("xpath", '//*[@id="popup_wrap"]/div[2]/div/div[3]/a[2]')

        # 초기 윈도우로 이동 (리셋)
        browser.goToDefaultWindow()
        time.sleep(5)
        # 원문 정보 크롤링을 위해 더보기 클릭
        browser.clickElement("xpath", '//*[@id="info"]')
        # 원문 정보 리스트로 가는 a태그 개수 확인
        length = len(browser.getAllChild("css selector", "#infoList dt span.top a"))
        if length == 0:
            browser.close()
        # 리스트 순회
        for i in range(length):
            link = browser.getAllChild("css selector", "#infoList dt span.top a")[i]
            link.click()
            time.sleep(5)
            browser.driver.back()

        browser.close()
        time.sleep(5)

    except Exception as e:
        print("에러 발생:", e)
