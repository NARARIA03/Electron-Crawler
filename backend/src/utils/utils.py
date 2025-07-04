import os
from datetime import datetime

log = ""


def printWithLogging(text: str):
    global log
    print(text, flush=True)
    log += text + "\n"


def saveLog(dir: str):
    global log
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_error.txt"
    os.makedirs(dir, exist_ok=True)
    path = os.path.join(dir, filename)

    with open(path, "a", encoding="utf-8") as f:
        f.write(log)
    log = ""
    print(f"로그 저장됨: {path}", flush=True)
