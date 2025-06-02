from classes.Browser import Browser
from classes.Excel import ExcelHelper
import time
import re
from typing import Optional
from constants.index import TIME


def crawlOpenGoKr(
    query: str,
    organization: str,
    location: str,
    include: Optional[str],
    exclude: Optional[str],
    startDate: str,
    endDate: str,
) -> None:
    try:
        # 사이트 접속
        browser = Browser(
            "https://www.open.go.kr/com/main/mainView.do",
            "/Users/hyunseong/Desktop/crawling-proj/code/selenium",
        )
        # 엑셀 파일 로드 혹은 데이터 생성
        excel = ExcelHelper(
            "/Users/hyunseong/Desktop/crawling-proj/code/selenium",
            f"{query}_{organization}.xlsx",
        )
        excel.initializeOpenGoKr()

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
        # 검색어 포함/제한 존재하면 적용
        if include:
            browser.typingInputElement(
                "xpath", '//*[@id="mustKeyword1"]', include, True
            )
        if exclude:
            browser.typingInputElement(
                "xpath", '//*[@id="ignoreKeyword1"]', exclude, True
            )
        # 검색 버튼 클릭
        browser.clickElement("xpath", '//*[@id="popup_wrap"]/div[2]/div/div[3]/a[2]')
        # iframe에서 나가기
        browser.unfocusIframe()
        time.sleep(TIME)

        # 검색 결과가 하나라도 있으면, 더보기 버튼 클릭
        count = browser.getElement("xpath", '//*[@id="searchInfoListTotalPage"]').text
        if count == "0":
            print("검색 결과가 없습니다.")
            browser.close()
            return
        browser.clickElement("xpath", '//*[@id="infoList"]')

        # 페이지네이션이 쿼리파라미터로 안 되어있는건.. 무슨 심보냐 진짜
        # 새 탭 열기로 해결해보자
        curPageIdx = 1
        curRow = 2
        screenshotPaths = []
        while True:
            screenshotPath = browser.fullScreenShot(
                f"{query}_{organization}_{location}_{startDate}_{endDate}_{curPageIdx}"
            )
            screenshotPaths.append(screenshotPath)
            # 정보 목록 리스트로 가는 a태그 개수 확인
            length = len(browser.getAllChild("css selector", "#infoList dt span.top a"))
            # 리스트 순회
            for i in range(length):
                href = (
                    browser.getAllChild("css selector", "#infoList dt span.top a")[
                        i
                    ].get_attribute("href")
                    or ""
                )
                # JS 함수를 역 파싱해서 쿼리파라미터 획득
                m = re.search(r"goDetail\('([^']+)','([^']+)'", href)
                if not m:
                    continue
                detail_url = (
                    "https://www.open.go.kr/othicInfo/infoList/infoListDetl.do"
                    f"?prdnNstRgstNo={m.group(1)}"
                    f"&prdnDt={m.group(2)}"
                )
                browser.driver.switch_to.new_window("tab")
                browser.driver.get(detail_url)
                # 문서 제목 저장
                title = browser.getElement("xpath", '//*[@id="infoSj"]/p/strong').text
                # 다운로드 로직 실행
                fileLinks = browser.downloadOpenGoKr(
                    "xpath",
                    (
                        "//td[starts-with(@headers,'본문_') or starts-with(@headers,'붙임_')]"
                        "//a[contains(@class,'btn_type05') and contains(@class,'down')][1]"
                    ),
                )

                # 엑셀에 값 추가
                excel.setData(curRow, 1, query)
                excel.setData(curRow, 2, organization)
                excel.setData(curRow, 3, title)
                for i in range(0, len(fileLinks)):
                    excel.setHyperlink(curRow, 4 + i, fileLinks[i])
                curRow += 1
                browser.driver.close()
                browser.goToDefaultWindow()

            # 페이지네이션 순회
            buttons = browser.driver.find_elements(
                "xpath",
                "//div[@id='pagingInfo']//li[@class='on']/following-sibling::li[1]/a",
            )
            if not buttons:
                print("다음 페이지 없음, 순회 종료")
                break
            prevEl = browser.getAllChild("css selector", "#infoList dt span.top a")[0]
            curPageIdx += 1
            buttons[0].click()
            browser.waitStaleness(prevEl)
        browser.close()
        excel.insertImage(screenshotPaths)
        excel.save()
        time.sleep(TIME)

    except Exception as e:
        print("에러 발생:", e)
