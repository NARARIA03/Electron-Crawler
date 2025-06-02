import os
from math import ceil
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as OpenpyxlImage
from openpyxl.worksheet.worksheet import Worksheet
import datetime


class ExcelHelper:
    ws: Worksheet
    wb: Workbook

    def __init__(self, downloadDir: str, fileName: str, sheetName: str = "Sheet1"):
        today = datetime.date.today()
        dateDir = f"{today.year}_{today.month:02d}_{today.day:02d}"
        self.path = os.path.join(downloadDir, dateDir, fileName)
        self.wb = Workbook()
        activeWs = self.wb.active
        assert isinstance(activeWs, Worksheet)
        self.ws = activeWs
        self.ws.title = sheetName
        print(f"Excel 데이터 생성 완료, {self.path}", flush=True)

    def setData(self, row: int, col: int, data: str):
        """
        row, col 모두 1-based index임에 주의
        """
        self.ws.cell(row=row, column=col, value=data)
        print(f"{row}_{col}에 {data} 삽입 완료", flush=True)

    def setHyperlink(
        self, row: int, col: int, filePath: str, displayText: str = "바로가기"
    ):
        if not os.path.exists(filePath):
            raise FileNotFoundError(f"링크 대상 파일을 찾을 수 없습니다: {filePath}")

        path = f"file:///{os.path.abspath(filePath)}"
        cell = self.ws.cell(row=row, column=col)
        cell.value = displayText
        cell.hyperlink = path  # type: ignore
        cell.style = "Hyperlink"
        print(f"Excel에 {os.path.abspath(filePath)} 파일 연결 완료", flush=True)

    def save(self):
        directory = os.path.dirname(self.path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
        self.wb.save(self.path)
        print(f"{directory}에 Excel 저장 완료")

    def initializeOpenGoKr(self):
        self.setData(row=1, col=1, data="검색어")
        self.setData(row=1, col=2, data="기관명")
        self.setData(row=1, col=3, data="정보 제목")
        self.setData(row=1, col=4, data="파일 링크")

    def insertImage(self, paths: list):
        imageSheet = self.wb.create_sheet("Images")
        curRow = 1
        perRow = 20
        for path in paths:
            if not os.path.exists(path):
                continue
            img = OpenpyxlImage(path)
            cell = f"{get_column_letter(1)}{curRow}"
            img.anchor = cell
            imageSheet.add_image(img)
            curRow += ceil(img.height / perRow)
