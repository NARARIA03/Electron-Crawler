from classes.Selenium import Selenium
from selenium.webdriver.common.keys import Keys
from classes.Excel import ExcelHelper
from utils import utils
import time
import re
from typing import Optional
from constants.index import TIME
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
import traceback


def crawlOpenGoKr(
    downloadDir: str,
    excelName: str,
    debug: str,
    query: str,
    organization: str,
    location: str,
    startDate: str,
    endDate: str,
    include: Optional[str] = None,
    exclude: Optional[str] = None,
) -> None:
    try:
        browser = Selenium(
            "https://www.open.go.kr/com/main/mainView.do", downloadDir, debug
        )
        excel = ExcelHelper(downloadDir, excelName)
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
        utils.printWithLogging("시작 날짜 주입 시작")
        browser.typingInputElement("xpath", '//*[@id="startDate"]', startDate, True)
        utils.printWithLogging("종료 날짜 주입 시작")
        browser.typingInputElement("xpath", '//*[@id="endDate"]', endDate, True)
        # 검색어 포함/제한 존재하면 적용
        if include != "null":
            browser.typingInputElement(
                "xpath", '//*[@id="mustKeyword1"]', include, True
            )
        if exclude != "null":
            browser.typingInputElement(
                "xpath", '//*[@id="ignoreKeyword1"]', exclude, True
            )
        # 검색 버튼 클릭 (여기선 JS 클릭하면 안 됨)
        WebDriverWait(browser.driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "btn_srch"))
        ).click()
        # iframe에서 나가기
        browser.unfocusIframe()
        time.sleep(TIME)
        # 검색 결과가 하나라도 있으면, 더보기 버튼 클릭
        count = browser.getElement("xpath", '//*[@id="searchInfoListTotalPage"]').text
        if count == "0":
            utils.printWithLogging("검색 결과가 없습니다.")
            browser.close()
            return
        browser.clickElement("xpath", '//*[@id="infoList"]')
        curPageIdx = 1
        while True:
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
                # 단위업무 저장
                workUnit = browser.getElement("xpath", '//*[@id="unitJobNm"]/p').text
                # 생산일자 저장
                prodDate = browser.getElement("xpath", '//*[@id="prdnDtView"]/p').text
                # 다운로드 로직 실행
                (fileLinks, hasMissingDownloads) = browser.downloadOpenGoKr(
                    "xpath",
                    (
                        "//td[starts-with(@headers,'본문_') or starts-with(@headers,'붙임_')]"
                        "//a[contains(@class,'btn_type05') and contains(@class,'down')][1]"
                    ),
                )
                # 엑셀에 값 추가
                excel.setData(
                    [
                        query,
                        organization,
                        {"text": title, "url": detail_url},
                        workUnit,
                        prodDate,
                    ]
                )
                # 다운로드한 파일 linking
                excel.setHyperlink(
                    fileLinks, col=6, hasMissingDownloads=hasMissingDownloads
                )
                browser.driver.close()
                browser.goToDefaultWindow()
            # 여기서도 RNB 제거...
            browser.driver.execute_script(
                """
            const el = document.querySelector('.rnb');
            if (el) el.style.display = 'none';
            """
            )
            utils.printWithLogging("RNB 제거 완료")
            # 페이지네이션 순회
            buttons = browser.driver.find_elements(
                "xpath",
                "//div[@id='pagingInfo']//li[@class='on']/following-sibling::li[1]/a",
            )
            if not buttons:
                utils.printWithLogging("다음 페이지 없음, 순회 종료")
                break
            prevEl = browser.getAllChild("css selector", "#infoList dt span.top a")[0]
            curPageIdx += 1
            try:
                buttons[0].click()
                browser.waitStaleness(prevEl)
            except TimeoutException:
                utils.printWithLogging("페이지 전환 없음, 순회 종료")
                break
        browser.close()
        excel.pretterColumns()
        excel.save()
        time.sleep(TIME)

    except Exception as e:
        utils.printWithLogging(f"에러 발생: {e}")
        utils.printWithLogging(traceback.format_exc())
        utils.saveLog(f"{downloadDir}/logs")
        utils.printWithLogging(f"FAILDIRECTORY:{downloadDir}/logs")
        raise RuntimeError("크롤링 도중 오류 발생")
