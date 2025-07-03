from selenium.webdriver.remote.webelement import WebElement
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoAlertPresentException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from typing import List, Tuple
import os
import time
import glob
from constants.index import TIME, ByType


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
        print(debug, flush=True)
        if debug != '"true"':
            options.add_argument("--headless")
        options.add_argument("--start-maximized")
        options.add_experimental_option("prefs", prefs)
        self.driver = webdriver.Chrome(options=options)
        print("웹드라이버 초기 설정 성공", flush=True)
        print(f"파일 다운 경로: {filesDir}", flush=True)
        self.driver.get(url)
        self.wait = WebDriverWait(self.driver, 10)
        self.downloadPath = filesDir
        time.sleep(TIME)
        self.curWindowHandle = self.driver.current_window_handle
        print("현재 페이지: ", self.driver.current_url, flush=True)

    def close(self) -> None:
        self.driver.quit()
        print("웹드라이버 종료 완료", flush=True)

    def getElement(self, by: ByType, value: str) -> WebElement:
        return (
            WebDriverWait(self.driver, 10)
            .until(EC.element_to_be_clickable((by, value)))
            .find_element(by, value)
        )

    def clickElement(self, by: ByType, value: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        ).click()
        print("요소 클릭 완료", flush=True)

    def typingInputElement(
        self, by: ByType, value: str, input: str, replace: bool = False
    ) -> None:
        element = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        )
        if replace:
            element.clear()
            element.send_keys(input)
            return print("대체 완료", flush=True)
        element.send_keys(input)
        return print("입력 완료", flush=True)

    def focusIframe(self, by: ByType, value: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.frame_to_be_available_and_switch_to_it((by, value))
        )
        print("iframe 전환 완료", flush=True)

    def unfocusIframe(self) -> None:
        self.driver.switch_to.default_content()
        print("기본 컨텐츠로 전환 완료", flush=True)

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
        print("새 윈도우로 전환 완료", flush=True)

    def goToDefaultWindow(self) -> None:
        self.driver.switch_to.window(self.curWindowHandle)
        print("초기 윈도우로 이동 완료", flush=True)

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
        try:
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_all_elements_located((by, value))
            )
        except TimeoutException:
            print("매칭되는 다운로드 버튼이 없습니다.", flush=True)
            return ([], False)

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
                el.click()
                print(
                    f"[{idx}/{len(elements)}] 다운로드 버튼 클릭 ({attempts}번째)",
                    flush=True,
                )
                # 버튼 하나 클릭 후 기다린 시간
                elapsed = 0
                while elapsed < timeout:
                    curFiles = set(glob.glob(os.path.join(self.downloadPath, "*")))
                    newFiles = [
                        f
                        for f in curFiles - existFiles
                        if not f.endswith(".crdownload")
                    ]
                    if len(newFiles) > 0:
                        newFiles.sort(key=os.path.getctime, reverse=True)
                        downloadedFiles.append(newFiles[0])
                        print(
                            f"[{idx}/{len(elements)}] 다운로드 완료: {newFiles[0]}",
                            flush=True,
                        )
                        downloaded = True
                        break
                    # 다운되지 않았다면, alert 창이 뜨지는 않았는지 체크
                    try:
                        alert = self.driver.switch_to.alert
                        alert.accept()
                        print(
                            f"[{idx}/{len(elements)}] 다운로드 실패 alert 확인, 재시도 예정",
                            flush=True,
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
                print(
                    f"[{idx}/{len(elements)}] 다운로드 실패: {attempts}회 재시도 후에도 완료되지 않음",
                    flush=True,
                )
                hasMissingDownloads = True

        return (downloadedFiles, hasMissingDownloads)
