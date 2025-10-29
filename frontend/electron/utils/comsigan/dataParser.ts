import type { Worksheet } from "exceljs";
import type { TBaseParams, TClassInfo } from "../../types/comsigan";

/**
 * @description 엑셀에 취합한 데이터를 배열로 변환해 반환하는 함수
 */
export const parseXlsxData = (ws: Worksheet) => {
  const rawData: TBaseParams[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const values = row.values as (string | number)[];
      rawData.push({
        region: String(values[1] || ""),
        schoolName: String(values[2] || ""),
        teacherName: String(values[3] || ""),
        date: String(values[4] || ""),
        time: String(values[5] || ""),
        grade: Number(values[6] || 0),
        subject: String(values[7] || ""),
      });
    }
  });

  return rawData;
};

/**
 * @description 수집된 데이터를 학교별 데이터 맵을 생성하는 함수
 */
export const createSchoolMap = (rawData: TBaseParams[]) => {
  const schoolMap = new Map<string, TBaseParams[]>();

  rawData.forEach((value) => {
    if (!schoolMap.has(value.schoolName)) schoolMap.set(value.schoolName, []);
    schoolMap.get(value.schoolName)?.push(value);
  });

  return schoolMap;
};

/**
 * @description 날짜별 데이터 맵을 생성하는 함수
 */
export const createDateMap = (rawData: TBaseParams[]) => {
  const dateMap = new Map<string, TBaseParams[]>();

  rawData.forEach((value) => {
    if (!dateMap.has(value.date)) dateMap.set(value.date, []);
    dateMap.get(value.date)?.push(value);
  });

  return dateMap;
};

/**
 * @description 학년|날짜|시간별 데이터 맵을 생성하는 함수
 */
export const createClassListMap = (rawData: TBaseParams[]) => {
  const classListMap = new Map<string, TClassInfo[]>();

  rawData.forEach((value) => {
    const key = `${value.grade}|${value.date}|${value.time}`;
    if (!classListMap.has(key)) classListMap.set(key, []);
    classListMap.get(key)?.push(value);
  });

  return classListMap;
};

/**
 * @description 해당 학년에서 같은 교시에 진행되는 수업 최대수를 계산하는 함수
 */
export const getMaxClassCountPerGrade = (grade: number, rawData: TBaseParams[]) => {
  const classListMap = createClassListMap(rawData);
  let max = 1;

  classListMap.forEach((value, key) => {
    if (key.startsWith(`${grade}|`)) {
      max = Math.max(max, value.length);
    }
  });

  return max;
};

/**
 * @description 학년별 시작 column 인덱스 맵을 생성하는 함수
 */
export const createGradeColumnIndexMap = (data: TBaseParams[]) => {
  const gradeColumnIndexMap = new Map<number, number>();
  let currentColumn = 3; // * 날짜, 교시 이후부터 시작이므로

  [1, 2, 3].forEach((grade) => {
    gradeColumnIndexMap.set(grade, currentColumn);
    currentColumn += getMaxClassCountPerGrade(grade, data);
  });

  return gradeColumnIndexMap;
};
