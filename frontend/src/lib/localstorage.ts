export const getDownloadDirectory = () => {
  return window.localStorage.getItem("downloadDir");
};

export const setDownloadDirectory = (directory: string) => {
  return window.localStorage.setItem("downloadDir", directory);
};

export const getExcelName = () => {
  return window.localStorage.getItem("excelFileName");
};

export const setExcelName = (excelName: string) => {
  return window.localStorage.setItem("excelFileName", excelName);
};
