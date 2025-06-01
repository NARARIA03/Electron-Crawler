export const getDownloadDirectory = () => {
  return window.localStorage.getItem("downloadDir");
};

export const setDownloadDirectory = (directory: string) => {
  return window.localStorage.setItem("downloadDir", directory);
};
