/**
 * Off-chain registry of demo institutions and their geographic coordinates.
 * Coordinates never live on-chain (custody events carry only a `gpsHash`), so
 * this map is intentionally a frontend-only lookup — the kind of off-chain
 * complement each institution would maintain in production. `roleKey` matches
 * the `role` i18n namespace; `address` ties each site to its Anvil demo account.
 */
export interface Facility {
  roleKey: string;
  name: string;
  city: string;
  address: `0x${string}`;
  lat: number;
  lng: number;
}

export const FACILITIES: Facility[] = [
  {
    roleKey: "BANCO_SANGRE",
    name: "Banco Central de Sangre",
    city: "Ciudad Autónoma de Buenos Aires",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    lat: -34.6037,
    lng: -58.3816,
  },
  {
    roleKey: "LABORATORIO",
    name: "Laboratorio de Tamizaje Serológico",
    city: "La Plata",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    lat: -34.9215,
    lng: -57.9545,
  },
  {
    roleKey: "FRACCIONAMIENTO",
    name: "Centro de Fraccionamiento de Hemocomponentes",
    city: "Córdoba",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    lat: -31.4201,
    lng: -64.1888,
  },
  {
    roleKey: "MEDICINA_TRANSFUSIONAL",
    name: "Servicio de Medicina Transfusional",
    city: "Rosario",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    lat: -32.9442,
    lng: -60.6505,
  },
  {
    roleKey: "AUDITOR",
    name: "Hemovigilancia Regional",
    city: "Mendoza",
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    lat: -32.8895,
    lng: -68.8458,
  },
  {
    roleKey: "CERTIFICADOR",
    name: "Organismo de Acreditación (AAHITC)",
    city: "San Miguel de Tucumán",
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    lat: -26.8083,
    lng: -65.2176,
  },
];
