import { powerSaveBlocker } from "electron";

let powerSaveBlockerId: number | null = null;

export const preventPowerSave = {
  start: () => {
    if (!powerSaveBlocker.isStarted(powerSaveBlockerId ?? -1)) {
      powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
      console.log("preventDisplaySleepId:", powerSaveBlockerId);
    }
  },
  stop: () => {
    if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
      powerSaveBlocker.stop(powerSaveBlockerId);
      console.log("Power save blocker stopped.");
    }
  },
};
