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
        self.curWindowHandle = self.driver.current_window_handle
        print("현재 페이지: ", self.driver.current_url)

    def close(self) -> None:
        self.driver.quit()
        print("웹드라이버 종료 완료")

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

    def focusIframe(self, by: ByType, value: str) -> None:
        WebDriverWait(self.driver, 10).until(
            EC.frame_to_be_available_and_switch_to_it((by, value))
        )
        print("iframe 전환 완료")

    def unfocusIframe(self) -> None:
        self.driver.switch_to.default_content()
        print("기본 컨텐츠로 전환 완료")

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
        print("새 윈도우로 전환 완료")

    def goToDefaultWindow(self) -> None:
        self.driver.switch_to.window(self.curWindowHandle)
        print("초기 윈도우로 이동 완료")
