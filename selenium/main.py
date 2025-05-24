from services.openGoKr import crawlOpenGoKr
from mocks.openGoKr import OPENGOKR_MOCKS


if __name__ == "__main__":
    try:
        for mock in OPENGOKR_MOCKS:
            crawlOpenGoKr(**mock)

    except Exception as e:
        print("에러 발생:", e)
