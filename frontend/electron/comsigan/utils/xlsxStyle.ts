import type { Cell } from "exceljs";

type TConfig = {
  align?: "left" | "center" | "right";
};

export const applyCellBorder = (cell: Cell, config?: TConfig) => {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  if (config?.align === "center") {
    cell.alignment = { vertical: "middle", horizontal: "center" };
  }
};
