export const PRODUCT_CATEGORY_OPTIONS = [
  { label: "Laptops", value: "LAPTOPS" },
  { label: "Desktops", value: "DESKTOPS" },
  { label: "Monitors", value: "MONITORS" },
  { label: "Mobiles", value: "MOBILES" },
  { label: "Tablets", value: "TABLETS" },
  { label: "POS Devices", value: "POS_DEVICES" },
  { label: "Printers", value: "PRINTERS" },
  { label: "Scanners", value: "SCANNERS" },
  { label: "Routers / Switches", value: "ROUTERS_SWITCHES" },
  { label: "Networking Equipment", value: "NETWORKING_EQUIPMENT" },
  { label: "Peripherals", value: "PERIPHERALS" },
  { label: "Accessories", value: "ACCESSORIES" },
  { label: "Security Devices", value: "SECURITY_DEVICES" },
  { label: "Software Licenses", value: "SOFTWARE_LICENSES" },
  { label: "Biometric Devices", value: "BIOMETRIC_DEVICES" },
  { label: "Chargers / Adapters", value: "CHARGERS_ADAPTERS" },
  { label: "Headsets / Audio", value: "HEADSETS_AUDIO" },
  { label: "Storage Devices", value: "STORAGE_DEVICES" },
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORY_OPTIONS)[number]["value"];