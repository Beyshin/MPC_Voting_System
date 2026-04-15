export const navigationItems = [
  { id: "dashboard", label: "Pulpit", isActive: true, path: "/" },
  { id: "verification", label: "Weryfikacja", isActive: false },
  { id: "results", label: "Wyniki", isActive: false },
];

export const elections = [
  {
    id: "krajowe-2137",
    level: "Krajowe",
    dateRange: "12.03 - 15.04.2025",
    title: "Wybory Krajowe 2025",
    description: "Wybory do Sejmu RP, które odbędą się w kwietniu 2025 roku. ",
    status: "Aktywne",
    candidates: [
      {
        id: 1,
        firstName: "Adam",
        lastName: "Pierwszy"
      },
      {
        id: 2,
        firstName: "Paweł",
        lastName: "Drugi"
      }
    ],
    p_val: [5,7]
  },
  {
    id: "lokalne-glosowanie-420",
    level: "Lokalne",
    dateRange: "14.03 - 15.04.2025",
    title: "Referendum Spółdzielcze Częstochowa",
    description: "",
    status: "Aktywne",
    candidates: [
      {
        id: 1,
        firstName: "Adam",
        lastName: "Pierwszy"
      },
      {
        id: 2,
        firstName: "Paweł",
        lastName: "Drugi"
      },
      {
        id: 3,
        firstName: "Mariusz",
        lastName: "Trzeci"
      }
    ],
    p_val: [5,7, 11]
  },
];

export const systemHealth = {
  nodes: [
    { id: "alpha", name: "Wezel 1", state: "ERROR" },
    { id: "beta", name: "Wezel 2", state: "ERROR" },
    { id: "gamma", name: "Wezel 3", state: "ERROR" },
  ],
};
