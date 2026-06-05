import type { TaskColor } from "@/types";

export const taskColorClasses: Record<TaskColor, string> = {
  purple: "bg-[#EEEDFE] text-[#534AB7]",
  teal: "bg-[#E1F5EE] text-[#0F6E56]",
  coral: "bg-[#FAECE7] text-[#993C1D]",
  amber: "bg-[#FAEEDA] text-[#854F0B]"
};

export const taskColorDots: Record<TaskColor, string> = {
  purple: "bg-[#534AB7]",
  teal: "bg-[#0F6E56]",
  coral: "bg-[#993C1D]",
  amber: "bg-[#854F0B]"
};

export const taskColorHex: Record<TaskColor, string> = {
  purple: "#534AB7",
  teal: "#0F6E56",
  coral: "#993C1D",
  amber: "#854F0B"
};
