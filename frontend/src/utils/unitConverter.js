// src/utils/unitConverter.js

export const DEFAULT_CONVERSION_RATES = {
  packetsPerCarton: 24, // 1 Carton = 24 Packets
  packetsPerBox: 12,    // 1 Box = 12 Packets
  kgPerPacket: 0.5,     // 1 Packet = 0.5 kg (500g)
  numbersPerPacket: 1   // 1 Packet = 1 Unit / Number
};

/**
 * Standardize unit key string
 */
export function normalizeUnitKey(unitStr = 'Cartons') {
  const str = String(unitStr).toLowerCase();
  if (str.includes('carton')) return 'cartons';
  if (str.includes('box')) return 'boxes';
  if (str.includes('packet') || str.includes('pkt')) return 'packets';
  if (str.includes('kilo') || str.includes('kg')) return 'kg';
  if (str.includes('number') || str.includes('unit') || str.includes('pc')) return 'numbers';
  return 'cartons';
}

/**
 * Format number nicely with max 2 decimals or whole number with locale string
 */
export function formatVal(val) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (Number.isInteger(val)) {
    return val.toLocaleString('en-IN');
  }
  return Number(val.toFixed(2)).toLocaleString('en-IN');
}

/**
 * Convert quantity from input unit into all 5 measurement units
 */
export function convertAllUnits(quantity = 0, inputUnit = 'Cartons', customRates = {}) {
  const numQty = Math.max(0, Number(quantity) || 0);
  const rates = { ...DEFAULT_CONVERSION_RATES, ...customRates };
  const normalizedKey = normalizeUnitKey(inputUnit);

  // Calculate base totalPackets
  let totalPackets = 0;
  switch (normalizedKey) {
    case 'cartons':
      totalPackets = numQty * rates.packetsPerCarton;
      break;
    case 'boxes':
      totalPackets = numQty * rates.packetsPerBox;
      break;
    case 'packets':
      totalPackets = numQty;
      break;
    case 'numbers':
      totalPackets = numQty / rates.numbersPerPacket;
      break;
    case 'kg':
      totalPackets = numQty / rates.kgPerPacket;
      break;
    default:
      totalPackets = numQty * rates.packetsPerCarton;
  }

  // Calculate all 5 units
  const cartons = totalPackets / rates.packetsPerCarton;
  const boxes = totalPackets / rates.packetsPerBox;
  const packets = totalPackets;
  const numbers = totalPackets * rates.numbersPerPacket;
  const kg = totalPackets * rates.kgPerPacket;

  return {
    inputQuantity: numQty,
    inputUnit,
    basePackets: totalPackets,
    conversions: {
      cartons: Number(cartons.toFixed(2)),
      numbers: Number(numbers.toFixed(2)),
      packets: Number(packets.toFixed(2)),
      boxes: Number(boxes.toFixed(2)),
      kg: Number(kg.toFixed(2))
    },
    formatted: {
      cartons: `${formatVal(cartons)} Cartons`,
      numbers: `${formatVal(numbers)} Units`,
      packets: `${formatVal(packets)} Pkts`,
      boxes: `${formatVal(boxes)} Boxes`,
      kg: `${formatVal(kg)} kg`
    },
    summaryPill: `= ${formatVal(cartons)} Cartons | ${formatVal(numbers)} Units | ${formatVal(packets)} Pkts | ${formatVal(boxes)} Boxes | ${formatVal(kg)} kg`
  };
}
