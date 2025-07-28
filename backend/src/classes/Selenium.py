from selenium.webdriver.remote.webelement import WebElement
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    TimeoutException,
    NoAlertPresentException,
    ElementClickInterceptedException,
)
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from typing import List, Tuple
import os
import time
import glob
from constants.index import TIME, ByType
from utils import utils


class Selenium:
    def __init__(self, url: str, downloadDir: str, debug: str) -> None:
        filesDir = os.path.join(downloadDir, "files")
        os.makedirs(filesDir, exist_ok=True)

        prefs = {
            "download.default_directory": filesDir,  # 다운로드 경로
            "download.prompt_for_download": False,  # 대화상자 없이 바로 저장
            "download.directory_upgrade": True,  # 기존 설정 덮어쓰기
            "safebrowsing.enabled": True,  # 안전 브라우징 허용
        }

        options = Options()
        utils.printWithLogging(debug)
        if debug != '"true"':
            options.add_argument("--headless")
        options.add_experimental_option("prefs", prefs)
        self.driver = webdriver.Chrome(options=options)
        utils.printWithLogging("웹드라이버 초기 설정 성공")
        utils.printWithLogging(f"파일 다운 경로: {filesDir}")
        self.driver.get(url)
        self.wait = WebDriverWait(self.driver, 10)
        self.downloadPath = filesDir
        time.sleep(TIME)
        self.curWindowHandle = self.driver.current_window_handle
        utils.printWithLogging(f"현재 페이지: {self.driver.current_url}")

    def close(self) -> None:
        self.driver.quit()
        utils.printWithLogging("웹드라이버 종료 완료")

    def getElement(self, by: ByType, value: str) -> WebElement:
        return (
            WebDriverWait(self.driver, 10)
            .until(EC.presence_of_element_located((by, value)))
            .find_element(by, value)
        )

    def clickElement(self, by: ByType, value: str) -> None:
        self.driver.execute_script(
            """
                const el = document.querySelector('.rnb');
                if (el) el.style.display = 'none';
            """
        )
        utils.printWithLogging(".rnb 요소 숨김 완료")

        el = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        )
        self.driver.execute_script("arguments[0].click();", el)
        utils.printWithLogging("요소 클릭 완료")

    def typingInputElement(
        self, by: ByType, value: str, input: str, replace: bool = False
    ) -> None:
        element = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        )
        if replace:
            element.clear()
            element.send_keys(input)
            return utils.printWithLogging("대체 완료")
        element.send_keys(input)
        return utils.printWithLogging("입력 완료")

    def focusIframe(self, by: ByType, value: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.frame_to_be_available_and_switch_to_it((by, value))
        )
        utils.printWithLogging("iframe 전환 완료")

    def unfocusIframe(self) -> None:
        self.driver.switch_to.default_content()
        utils.printWithLogging("기본 컨텐츠로 전환 완료")

    def goToNewWindow(self, by: ByType, value: str) -> None:
        originalHandles = set(self.driver.window_handles)

        self.clickElement(by, value)
        WebDriverWait(self.driver, 10).until(
            lambda d: len(d.window_handles) > len(originalHandles)
        )

        curHandles = set(self.driver.window_handles)
        newHandle = curHandles - originalHandles
        if not newHandle:
            raise RuntimeError("새 창 전환 실패: 새로운 윈도우를 찾을 수 없습니다")

        self.driver.switch_to.window(newHandle.pop())
        utils.printWithLogging("새 윈도우로 전환 완료")

    def goToDefaultWindow(self) -> None:
        self.driver.switch_to.window(self.curWindowHandle)
        utils.printWithLogging("초기 윈도우로 이동 완료")

    def getAllChild(self, by: ByType, value: str) -> List[WebElement]:
        elements = WebDriverWait(self.driver, 10).until(
            EC.presence_of_all_elements_located((by, value))
        )
        return elements

    def waitStaleness(self, el: WebElement) -> None:
        self.wait.until(EC.staleness_of(el))

    def downloadOpenGoKr(
        self, by: ByType, value: str, timeout: int = 60
    ) -> Tuple[List, bool]:
        # element가 모두 로드될 때까지 대기
        utils.printWithLogging(f"현재 페이지: {self.driver.current_url}")
        try:
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_all_elements_located((by, value))
            )
        except TimeoutException:
            utils.printWithLogging("매칭되는 다운로드 버튼이 없습니다.")
            return ([], False)

        # RNB 제거!
        self.driver.execute_script(
            """
            const el = document.querySelector('.rnb');
            if (el) el.style.display = 'none';
        """
        )
        utils.printWithLogging("RNB 제거 완료")

        # 다운로드 버튼 elements 추출
        elements = self.driver.find_elements(by, value)
        if not elements:
            return ([], False)

        downloadedFiles = []
        hasMissingDownloads = False

        # 각 버튼들에 대해서 순회 시작
        for idx, el in enumerate(elements, start=1):
            # 버튼 클릭 전에 존재하는 파일 경로 집합 저장
            existFiles = set(glob.glob(os.path.join(self.downloadPath, "*")))
            # 파일 하나 다운 성공했는지를 체크하는 flag
            downloaded = False
            # 파일 하나 다운 재시도 횟수
            attempts = 0

            # 다운로드를 최대 10번 시도하는 반복문
            while attempts < 10 and not downloaded:
                try:
                    el.click()
                    utils.printWithLogging(
                        f"[{idx}/{len(elements)}] 다운로드 버튼 클릭 ({attempts}번째)"
                    )
                except ElementClickInterceptedException:
                    utils.printWithLogging(f"[{idx}/{len(elements)}] 클릭 차단됨")
                    pass
                # 버튼 하나 클릭 후 기다린 시간
                elapsed = 0
                while elapsed < timeout:
                    curFiles = set(glob.glob(os.path.join(self.downloadPath, "*")))
                    newFiles = [
                        f for f in curFiles - existFiles if isDownloadFinished(f)
                    ]
                    if len(newFiles) > 0:
                        newFiles.sort(key=os.path.getctime, reverse=True)
                        downloadedFiles.append(newFiles[0])
                        utils.printWithLogging(
                            f"[{idx}/{len(elements)}] 다운로드 완료: {newFiles[0]}"
                        )
                        downloaded = True
                        break
                    # 다운되지 않았다면, alert 창이 뜨지는 않았는지 체크
                    try:
                        alert = self.driver.switch_to.alert
                        alert.accept()
                        utils.printWithLogging(
                            f"[{idx}/{len(elements)}] 다운로드 실패 alert 확인, 재시도 예정",
                        )
                        break
                    except NoAlertPresentException:
                        pass

                    time.sleep(1)
                    elapsed += 1

                if not downloaded:
                    attempts += 1
                    time.sleep(1)
            if not downloaded:
                utils.printWithLogging(
                    f"[{idx}/{len(elements)}] 다운로드 실패: {attempts}회 재시도 후에도 완료되지 않음",
                )
                hasMissingDownloads = True

        return (downloadedFiles, hasMissingDownloads)


def isDownloadFinished(filePath: str) -> bool:
    unstableExts = [".tmp", ".crdownload", ".part"]
    return not any(filePath.endswith(ext) for ext in unstableExts)
