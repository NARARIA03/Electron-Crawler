import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";

type TBaseParams = {
  region: string;
  schoolName: string;
  teacherName: string;
  date: string;
  time: string;
  grade: number;
  subject: string;
};

export default class XlsxService {
  private wb: ExcelJS.Workbook;
  private ws: ExcelJS.Worksheet | null;
  private filePath: string;
  private readonly baseSheet = "Default";

  /**
   * @description Workbook과 변수를 초기화하는 생성자
   */
  constructor(resultDir: string, excelName: string) {
    const resultExcelName = excelName.toLowerCase().replaceAll("query", "");

    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    this.filePath = path.join(resultDir, resultExcelName);
    this.wb = new ExcelJS.Workbook();
    this.ws = null;
  }

  /**
   * @description 초기 Worksheet를 생성해서 반환하는 메서드
   */
  private createWorksheet() {
    const ws = this.wb.addWorksheet(this.baseSheet, { pageSetup: { fitToPage: true } });
    ws.addRow(["지역", "학교명", "교사명", "날짜", "수업 시간", "학년", "과목"]);
    return ws;
  }

  /**
   * @description 싱글톤 형태로 Worksheet 반환을 보장하는 메서드
   */
  private async getWorksheet() {
    if (!this.ws) {
      if (fs.existsSync(this.filePath)) {
        await this.wb.xlsx.readFile(this.filePath);
        this.ws = this.wb.getWorksheet(this.baseSheet) ?? this.createWorksheet();
      } else {
        this.ws = this.createWorksheet();
      }
    }
    return this.ws;
  }

  /**
   * @description 정상 데이터 수집 후, 행을 추가하는 메서드
   * @note `Promise.all` 등으로 race condition을 유발하지 마세요.
   */
  public async addRow({ region, schoolName, teacherName, date, time, grade, subject }: TBaseParams) {
    const ws = await this.getWorksheet();
    ws.addRow([region, schoolName, teacherName, date, time, grade, subject]);
    await this.save();
  }

  /**
   * @description 저장 전 셀의 width를 맞추는 메서드
   */
  private async autoFitColumns() {
    const colWidths: number[] = [];
    const ws = await this.getWorksheet();

    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const cellValue = cell.value ? String(cell.value) : "";
        let cellWidth = 0;

        for (const char of cellValue) {
          cellWidth += /[\u3131-\uD79D]/.test(char) ? 2 : 1;
        }
        colWidths[colNumber - 1] = Math.max(colWidths[colNumber - 1] || 10, cellWidth + 2);
      });
    });

    ws.columns = colWidths.map((width) => ({ width }));
  }

  /**
   * @description xlsx 파일에 데이터를 저장하는 메서드
   */
  public async save() {
    await this.autoFitColumns();
    await this.wb.xlsx.writeFile(this.filePath);
  }

  /**
   * @description xlsx 파일 경로를 반환하는 메서드
   */
  public getFilePath(): string {
    return this.filePath;
  }

  /**
   * @description 데이터를 테이블 형태로 재구축하는 메서드
   */
  public async createTableView() {
    const ws = await this.getWorksheet();
    const rawData: Array<{
      region: string;
      school: string;
      teacher: string;
      date: string;
      time: string;
      grade: number;
      subject: string;
    }> = [];

    // 원본 데이터 읽기
    ws.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        const v = row.values as (string | number)[];
        rawData.push({
          region: String(v[1] || ""),
          school: String(v[2] || ""),
          teacher: String(v[3] || ""),
          date: String(v[4] || ""),
          time: String(v[5] || ""),
          grade: Number(v[6] || 0),
          subject: String(v[7] || ""),
        });
      }
    });

    // 학교별로 그룹핑
    const schoolGroups = new Map<string, typeof rawData>();
    rawData.forEach((data) => {
      if (!schoolGroups.has(data.school)) {
        schoolGroups.set(data.school, []);
      }
      schoolGroups.get(data.school)!.push(data);
    });

    // 각 학교별로 시트 생성
    for (const [schoolName, schoolData] of schoolGroups) {
      await this.createSchoolSheet(schoolName, schoolData);
    }
  }

  /**
   * @description 학교별 시트를 생성하는 메서드
   */
  private async createSchoolSheet(
    schoolName: string,
    data: Array<{
      region: string;
      school: string;
      teacher: string;
      date: string;
      time: string;
      grade: number;
      subject: string;
    }>
  ) {
    // 기존 시트 삭제 (있으면)
    const existingSheet = this.wb.getWorksheet(schoolName);
    if (existingSheet) {
      this.wb.removeWorksheet(existingSheet.id);
    }

    const sheet = this.wb.addWorksheet(schoolName, { pageSetup: { fitToPage: true } });

    // 날짜별로 그룹핑
    const dateGroups = new Map<string, typeof data>();
    data.forEach((d) => {
      if (!dateGroups.has(d.date)) {
        dateGroups.set(d.date, []);
      }
      dateGroups.get(d.date)!.push(d);
    });

    // 날짜 정렬 (월, 화, 수, 목, 금 순서)
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => {
      const dayOrder = ["월", "화", "수", "목", "금", "토", "일"];
      const dayA = a.match(/([월화수목금토일])/)?.[1] || "";
      const dayB = b.match(/([월화수목금토일])/)?.[1] || "";
      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
    });

    // 교시 목록 정의
    // Todo: 크롤링 과정에서 해당 학교의 전체 교시 정보를 크롤링해둬야 할 것으로 보인다.
    const allTimes = ["1(08:20)", "2(09:20)", "3(10:20)", "4(11:20)", "5(13:10)", "6(14:10)", "7(15:10)", "8(16:10)"];

    // 학년-날짜-시간별로 수업 데이터 그룹핑
    type ClassInfo = { teacher: string; subject: string };
    const scheduleMap = new Map<string, ClassInfo[]>();

    data.forEach((d) => {
      const key = `${d.grade}|${d.date}|${d.time}`;
      if (!scheduleMap.has(key)) {
        scheduleMap.set(key, []);
      }
      scheduleMap.get(key)!.push({ teacher: d.teacher, subject: d.subject });
    });

    // 각 학년별 최대 동시 수업 개수 계산
    const maxClassesPerGrade = new Map<number, number>();
    [1, 2, 3].forEach((grade) => {
      let max = 1;
      scheduleMap.forEach((classes, key) => {
        if (key.startsWith(`${grade}|`)) {
          max = Math.max(max, classes.length);
        }
      });
      maxClassesPerGrade.set(grade, max);
    });

    // 헤더 생성
    let currentCol = 1;
    const gradeColStart = new Map<number, number>();

    // 날짜, 교시 헤더
    sheet.getCell(1, currentCol++).value = "날짜";
    sheet.getCell(1, currentCol++).value = "교시";

    // 학년 헤더
    [1, 2, 3].forEach((grade) => {
      const maxClasses = maxClassesPerGrade.get(grade)!;
      gradeColStart.set(grade, currentCol);

      if (maxClasses === 1) {
        sheet.getCell(1, currentCol).value = `${grade}학년`;
        currentCol++;
      } else {
        // 여러 컬럼이 필요한 경우 병합
        const endCol = currentCol + maxClasses - 1;
        sheet.mergeCells(1, currentCol, 1, endCol);
        sheet.getCell(1, currentCol).value = `${grade}학년`;
        currentCol = endCol + 1;
      }
    });

    // 데이터 행 생성
    let currentRow = 2;
    sortedDates.forEach((date) => {
      const dateStartRow = currentRow;

      allTimes.forEach((time) => {
        // 날짜 컬럼 (첫 교시에만 쓰고 나중에 병합)
        if (time === allTimes[0]) {
          sheet.getCell(currentRow, 1).value = date;
        }

        // 교시 컬럼
        sheet.getCell(currentRow, 2).value = time;

        // 각 학년별 데이터 채우기
        [1, 2, 3].forEach((grade) => {
          const key = `${grade}|${date}|${time}`;
          const classes = scheduleMap.get(key) || [];
          const startCol = gradeColStart.get(grade)!;
          const maxClasses = maxClassesPerGrade.get(grade)!;

          // 모든 컬럼에 대해 처리 (병합 없이 개별 셀로 유지)
          for (let i = 0; i < maxClasses; i++) {
            const col = startCol + i;
            const cell = sheet.getCell(currentRow, col);

            if (i < classes.length) {
              // 수업 데이터 채우기
              const classInfo = classes[i];
              cell.value = `${classInfo.subject}\n${classInfo.teacher}`;
              cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
            } else {
              // 빈 셀 (수업 없음)
              cell.value = "";
              cell.alignment = { vertical: "middle", horizontal: "center" };
            }

            // 모든 셀에 border 적용
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        currentRow++;
      });

      // 날짜 셀 병합 (세로)
      if (allTimes.length > 1) {
        sheet.mergeCells(dateStartRow, 1, currentRow - 1, 1);
        sheet.getCell(dateStartRow, 1).alignment = { vertical: "middle", horizontal: "center" };
      }
    });

    // 스타일 적용
    this.applyTableStyle(sheet, currentRow - 1);
  }

  /**
   * @description 테이블 스타일을 적용하는 메서드
   */
  private applyTableStyle(sheet: ExcelJS.Worksheet, rowCount: number) {
    // 헤더 스타일
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    // 헤더 행에 border 적용
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 날짜/교시 컬럼에 border 적용
    for (let rowNum = 2; rowNum <= rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      row.height = 30; // 2줄 표시를 위한 높이

      // 날짜 컬럼 (1번)
      const dateCell = sheet.getCell(rowNum, 1);
      dateCell.alignment = { vertical: "middle", horizontal: "center" };
      dateCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // 교시 컬럼 (2번)
      const timeCell = sheet.getCell(rowNum, 2);
      timeCell.alignment = { vertical: "middle", horizontal: "center" };
      timeCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }

    // 컬럼 너비 자동 조정
    sheet.columns.forEach((column) => {
      column.width = 15;
    });
    // 날짜 컬럼은 좀 더 넓게
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 12;
  }
}
