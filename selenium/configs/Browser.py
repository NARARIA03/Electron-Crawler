from selenium.webdriver.remote.webelement import WebElement
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from typing import Literal, Callable, Any
import time

ByType = Literal[
    "id",
    "name",
    "xpath",
    "css selector",
    "link text",
    "partial link text",
    "tag name",
    "class name",
]


class Browser:
    def __init__(self, url: str) -> None:
        options = Options()
        # options.add_argument("--headless")
        self.driver = webdriver.Chrome(options=options)
        print("웹드라이버 초기 설정 성공")
        self.driver.get(url)
        time.sleep(2)
        print("현재 페이지: ", self.driver.current_url)

    def close(self) -> None:
        self.driver.quit()
        print("웹드라이버 종료 완료")

    def getElement(self, by: ByType, value: str) -> WebElement:
        return self.driver.find_element(by, value)

    def clickElement(self, by: ByType, value: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        ).click()
        print("요소 클릭 완료")

    def typingInputElement(self, by: ByType, value: str, input: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((by, value))
        ).send_keys(input)
        print("입력 완료")

    def actionToNewIframe(
        self,
        by: ByType,
        value: str,
        iframeBy: ByType,
        iframeValue: str,
        callbackFn: Callable[["Browser"], Any],
    ) -> None:
        self.clickElement(by, value)
        WebDriverWait(self.driver, 10).until(
            EC.frame_to_be_available_and_switch_to_it((iframeBy, iframeValue))
        )
        print("iframe 전환 완료")
        try:
            callbackFn(self)
        except Exception as e:
            print("에러 발생:", e)
        finally:
            self.driver.switch_to.default_content()
            print("iframe 복귀 완료")

    def actionToNewWindow(
        self,
        by: ByType,
        value: str,
        callbackFn: Callable[["Browser"], Any],
    ) -> None:
        originalWindow = self.driver.current_window_handle
        originalHandles = set(self.driver.window_handles)

        self.clickElement(by, value)
        WebDriverWait(self.driver, 10).until(
            lambda d: len(d.window_handles) > len(originalHandles)
        )
        curHandles = set(self.driver.window_handles)
        newHandle = curHandles - originalHandles
        if not newHandle:
            raise RuntimeError("새 창 전환 실패: 새로운 윈도우를 찾을 수 없습니다")
        newWindow = newHandle.pop()
        self.driver.switch_to.window(newWindow)
        print(f"새 창 포커스 전환 완료: {newWindow}")

        try:
            callbackFn(self)
        except Exception as e:
            print("에러 발생:", e)
        finally:
            self.driver.close()
            self.driver.switch_to.window(originalWindow)
            print("원래 창 복귀 완료")
