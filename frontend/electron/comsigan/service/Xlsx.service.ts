import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { autoFitColumns } from "../../shared/utils/autoFitColumns";
import {
  createClassListMap,
  createDateMap,
  createGradeColumnIndexMap,
  createSchoolMap,
  getMaxClassCountPerGrade,
  parseXlsxData,
} from "../utils/dataParser";
import type { TBaseParams } from "../types";

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
   * @description xlsx 파일에 데이터를 저장하는 메서드
   */
  public async save() {
    const ws = await this.getWorksheet();
    autoFitColumns(ws);
    await this.wb.xlsx.writeFile(this.filePath);
  }

  /**
   * @description xlsx 파일 경로를 반환하는 메서드
   */
  public getFilePath(): string {
    return this.filePath;
  }

  /**
   * @description 데이터를 학교별 테이블 형태로 재구축하는 메서드
   */
  public async createTableView(schoolTimesMap: Map<string, string[]>) {
    const ws = await this.getWorksheet();
    const rawData = parseXlsxData(ws);
    const schoolGroupMap = createSchoolMap(rawData);

    for (const [schoolName, schoolData] of schoolGroupMap) {
      const schoolTimes = schoolTimesMap.get(schoolName);
      if (!schoolTimes) throw new Error(`${schoolName} 교시 정보를 가져오지 못했습니다`);
      await this.createSchoolSheet(schoolName, schoolData, schoolTimes);
    }
  }

  /**
   * @description 학교별 시트를 생성하는 메서드
   */
  private async createSchoolSheet(schoolName: string, data: TBaseParams[], schoolTimes: string[]) {
    const existingSheet = this.wb.getWorksheet(schoolName);
    if (existingSheet) {
      this.wb.removeWorksheet(existingSheet.id);
    }

    const sheet = this.wb.addWorksheet(schoolName, { pageSetup: { fitToPage: true } });
    const dateGroupMap = createDateMap(data);
    const classListMap = createClassListMap(data);
    const gradeColumnIndexMap = createGradeColumnIndexMap(data);

    // 헤더 세팅
    sheet.getCell(1, 1).value = "날짜";
    sheet.getCell(1, 2).value = "교시";
    [1, 2, 3].forEach((grade) => {
      const maxClassCount = getMaxClassCountPerGrade(grade, data);
      const startIndex = gradeColumnIndexMap.get(grade);

      if (startIndex) {
        if (maxClassCount === 1) {
          sheet.getCell(1, startIndex).value = `${grade}학년`;
        } else {
          const endIndex = startIndex + maxClassCount - 1;
          sheet.mergeCells(1, startIndex, 1, endIndex);
          sheet.getCell(1, startIndex).value = `${grade}학년`;
        }
      }
    });

    // 데이터 행 생성
    let currentRow = 2;
    [...dateGroupMap.keys()].forEach((date) => {
      const dateStartRow = currentRow;

      schoolTimes.forEach((time, timeIndex) => {
        if (timeIndex === 0) {
          sheet.getCell(currentRow, 1).value = date; // 날짜 col
        }
        sheet.getCell(currentRow, 2).value = time; // 교시 col

        // 특정 교시부터 각 학년별 데이터 채우기
        [1, 2, 3].forEach((grade) => {
          const key = `${grade}|${date}|${time}`;
          const classList = classListMap.get(key) || []; // 특정 교시 특정 학년의 수업 데이터 리스트
          const startIndex = gradeColumnIndexMap.get(grade);
          const maxClassCount = getMaxClassCountPerGrade(grade, data); // 특정 교시 특정 학년 별 최대 수업 수

          if (startIndex) {
            // 특정 교시의 특정 학년 수업 데이터 삽입
            for (let i = 0; i < maxClassCount; i++) {
              const col = startIndex + i;
              const cell = sheet.getCell(currentRow, col);
              const hasClass = i < classList.length; // 현재 순회하는 index가 수업 수를 넘었는지 (즉, 수업이 없는지) 체크

              if (hasClass) {
                const { subject, teacherName } = classList[i];
                cell.value = `${subject}\n${teacherName}`;
                cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
              } else {
                cell.value = "";
                cell.alignment = { vertical: "middle", horizontal: "center" };
              }
            }
          }
        });
        currentRow++;
      });

      // 월(27일)과 같은 날짜 셀 병합 (143 line 참고)
      if (schoolTimes.length > 1) {
        sheet.mergeCells(dateStartRow, 1, currentRow - 1, 1);
        sheet.getCell(dateStartRow, 1).alignment = { vertical: "middle", horizontal: "center" };
      }
    });

    // 테이블 스타일링
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

    // 수업 정보 영역에 border 추가
    for (let rowNum = 2; rowNum <= rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
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
