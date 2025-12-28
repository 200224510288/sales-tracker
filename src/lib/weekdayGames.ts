export const WEEKDAY_GAMES: Record<
  number,
  {
    NLB: string[];
    DLB: string[];
  }
> = {
  1: { // Monday
    NLB: ["MSM", "GSM", "MPM", "DNM", "HM", "NJM", "AM", "SDM"],
    DLB: ["LWM", "AKM", "SFM", "SBM", "KTM", "SPM", "VM", "SM"],
  },
  2: { // Tuesday
    NLB: ["MST", "GSA", "MPA", "DNA", "HA", "NJA", "AA", "SDA"],
    DLB: ["LWA", "AKA", "SFA", "SBA", "KTT", "SPA", "VA", "SA"],
  },
  3: { // Wednesday
    NLB: ["MSW", "GSW", "MPW", "DNW", "HW", "NJW", "AW", "SDW"],
    DLB: ["LWW", "AKW", "SFW", "SBW", "KTW", "SPW", "VW", "SW"],
  },
  4: { // Thursday
    NLB: ["MSB", "GSB", "MPB", "DNB", "HT", "NJB", "AB", "SDB"],
    DLB: ["LWB", "AKT", "SFT", "SBT", "KTB", "SPT", "VT", "ST"],
  },
  5: { // Friday
    NLB: ["MSF", "GSF", "MPF", "DNF", "HF", "NJF", "AF", "SDF"],
    DLB: ["LWF", "AKF", "SFF", "SBF", "KTF", "SPF", "VF", "SF"],
  },
  6: { // Saturday
    NLB: ["MS", "GSS", "MPS", "DNS", "HS", "NJS", "AS", "SDS"],
    DLB: ["LWS", "AKS", "SFS", "SBS", "KTS", "SPS", "VS", "SS"],
  },
  0: { // Sunday
    NLB: ["MSS", "GSI", "MPI", "DNI", "HI", "NJI", "AI", "SDI"],
    DLB: ["LWI", "AKI", "SFI", "SBI", "KTI", "SPI", "VI", "SI"],
  },
};
