import argparse
import sys, json

TYPE = ["open-go-kr", "nara-g2b-portal", "computime-alert"]


def main():
    if len(sys.argv) < 2:
        print("사용법: '<JSON 배열 또는 객체>'")
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=TYPE, required=True)
    parser.add_argument("--downloadDir", required=True)
    parser.add_argument("--data", type=str, required=True)
    args = parser.parse_args()

    try:
        configs = json.loads(args.data)
        downloadDir = args.downloadDir
    except json.JSONDecodeError:
        print("--data 파라미터 이슈")
        sys.exit(1)
    if not isinstance(configs, list):
        print("--data 파라미터 이슈")
        sys.exit(1)

    result = {"configs": configs, "type": args.type, "status": "success"}

    if args.type == "open-go-kr":
        print(configs, downloadDir, args.type)
        # TODO
    elif args.type == "nara-g2b-portal":
        print(configs, downloadDir, args.type)
        # TODO
    else:
        print(configs, downloadDir, args.type)
        # TODO


if __name__ == "__main__":
    main()
