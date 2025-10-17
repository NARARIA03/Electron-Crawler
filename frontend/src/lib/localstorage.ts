export const getDownloadDirectory = () => {
  return window.localStorage.getItem("downloadDir");
};

export const setDownloadDirectory = (directory: string) => {
  return window.localStorage.setItem("downloadDir", directory);
};

export const getDebugMode = () => {
  const debug = window.localStorage.getItem("debug");
  return debug ? JSON.parse(debug) : false;
};

export const setDebugMode = (debug: boolean) => {
  return window.localStorage.setItem("debug", JSON.stringify(debug));
};
