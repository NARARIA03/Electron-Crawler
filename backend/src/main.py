import argparse
import sys, json
import os
from services.openGoKr import crawlOpenGoKr
from utils import utils
import io

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

TYPE = ["open-go-kr", "nara-g2b-portal", "computime-alert"]

DIR_NAME = "excel_database"


def main():
    if len(sys.argv) < 2:
        utils.printWithLogging("사용법: '<JSON 배열 또는 객체>'")
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=TYPE, required=True)
    parser.add_argument("--downloadDir", required=True)
    parser.add_argument("--excelName", required=True)
    parser.add_argument("--data", type=str, required=True)
    parser.add_argument("--debug", type=str, required=True)
    args = parser.parse_args()

    try:
        configs = json.loads(args.data)
    except json.JSONDecodeError:
        utils.printWithLogging("--data 파라미터 이슈")
        sys.exit(1)
    if not isinstance(configs, list):
        utils.printWithLogging("--data 파라미터 이슈")
        sys.exit(1)

    if args.type == "open-go-kr":
        downloadDir = os.path.join(args.downloadDir, DIR_NAME)
        debug = args.debug
        excelName = args.excelName

        for cfg in configs:
            crawlOpenGoKr(downloadDir, excelName, debug, **cfg)
        utils.printWithLogging(f"DIRECTORY:{downloadDir}")

    elif args.type == "nara-g2b-portal":
        utils.printWithLogging(f"{configs} {args.type}")
        # TODO
    else:
        utils.printWithLogging(f"{configs} {args.type}")
        # TODO


if __name__ == "__main__":
    main()
