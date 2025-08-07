import argparse
import sys, json
import os
from services.openGoKr import crawlOpenGoKr
import io

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

DIR_NAME = "excel_database"


def main():
    if len(sys.argv) < 2:
        print("사용법: '<JSON 배열 또는 객체>'", flush=True)
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--baseDir", required=True)
    parser.add_argument("--excelName", required=True)
    parser.add_argument("--data", type=str, required=True)
    parser.add_argument("--debug", type=str, required=True)
    args = parser.parse_args()

    try:
        configs = json.loads(args.data)
    except json.JSONDecodeError:
        print("--data 파라미터 이슈", flush=True)
        sys.exit(1)
    if not isinstance(configs, list):
        print("--data 파라미터 이슈", flush=True)
        sys.exit(1)

    debug = args.debug
    excelName = args.excelName
    downloadDir = os.path.join(args.baseDir, DIR_NAME, excelName.split(".")[0])

    crawlOpenGoKr(downloadDir, excelName, debug, configs)
    print(f"DIRECTORY:{downloadDir}", flush=True)


if __name__ == "__main__":
    main()
