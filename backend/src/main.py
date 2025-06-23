import argparse
import sys, json
import os
from services.openGoKr import crawlOpenGoKr
import io

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")  # type: ignore
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding="utf-8")  # type: ignore

TYPE = ["open-go-kr", "nara-g2b-portal", "computime-alert"]

DIR_NAME = "excel_database"


def main():
    if len(sys.argv) < 2:
        print("사용법: '<JSON 배열 또는 객체>'", flush=True)
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=TYPE, required=True)
    parser.add_argument("--downloadDir", required=True)
    parser.add_argument("--excelName", required=True)
    parser.add_argument("--data", type=str, required=True)
    args = parser.parse_args()

    try:
        configs = json.loads(args.data)
    except json.JSONDecodeError:
        print("--data 파라미터 이슈", flush=True)
        sys.exit(1)
    if not isinstance(configs, list):
        print("--data 파라미터 이슈", flush=True)
        sys.exit(1)

    if args.type == "open-go-kr":
        downloadDir = os.path.join(args.downloadDir, DIR_NAME)
        excelName = args.excelName
        for cfg in configs:
            crawlOpenGoKr(downloadDir, excelName, **cfg)
        print(f"DIRECTORY:{downloadDir}", flush=True)

    elif args.type == "nara-g2b-portal":
        print(configs, args.type, flush=True)
        # TODO
    else:
        print(configs, args.type, flush=True)
        # TODO


if __name__ == "__main__":
    main()
