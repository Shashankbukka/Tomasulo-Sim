export const examples: Record<string, string> = {
  basic_math: `LD F2, 10
LD F4, 11
ADDD F6, F2, F4
MULD F8, F2, F4
SUBD F10, F6, F8`,
  data_hazards: `LD F6, 34
LD F2, 45
MULD F0, F2, F4
SUBD F8, F6, F2
DIVD F10, F0, F6
ADDD F6, F8, F2`,
  structural_hazards: `LD F2, 10
LD F4, 11
MULD F6, F2, F4
MULD F8, F2, F4
MULD F10, F2, F4
MULD F2, F6, F8`
};
