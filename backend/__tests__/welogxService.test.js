const {
  calculateQuote,
  calculateDensityAndClass,
  densityToClass,
  getDistanceFactor,
  calculateDeficitOptimized,
  calculateAccessorials,
  estimateTransitDays,
} = require('../src/services/welogxService');

describe('welogxService', () => {
  describe('densityToClass', () => {
    it('returns Class 50 for high density (>= 50 pcf)', () => {
      expect(densityToClass(55)).toBe(50);
      expect(densityToClass(50)).toBe(50);
    });

    it('returns Class 65 for density 22.5-30', () => {
      expect(densityToClass(25)).toBe(65);
      expect(densityToClass(22.5)).toBe(65);
    });

    it('returns Class 500 for very low density (< 0.5 pcf)', () => {
      expect(densityToClass(0.3)).toBe(500);
    });

    it('returns correct boundary classes', () => {
      expect(densityToClass(35)).toBe(55);
      expect(densityToClass(15)).toBe(70);
      expect(densityToClass(9)).toBe(100);
    });
  });

  describe('calculateDensityAndClass', () => {
    it('calculates correctly for single item with total weight', () => {
      const result = calculateDensityAndClass([
        { weight: 6000, length: 40, width: 48, height: 72, pallets: 3 }
      ]);
      expect(result.totalWeight).toBe(6000);
      expect(result.totalCuFt).toBeCloseTo(240, 1);
      expect(result.density).toBeCloseTo(25, 1);
      expect(result.autoClass).toBe(65);
    });

    it('calculates correctly for multiple items', () => {
      const result = calculateDensityAndClass([
        { weight: 1000, length: 48, width: 40, height: 48, pallets: 1 },
        { weight: 500, length: 48, width: 40, height: 48, pallets: 1 },
      ]);
      expect(result.totalWeight).toBe(1500);
    });
  });

  describe('getDistanceFactor', () => {
    it('returns 0.90 for short haul (0-250 mi)', () => {
      expect(getDistanceFactor(100)).toBe(0.90);
      expect(getDistanceFactor(250)).toBe(0.90);
    });

    it('returns 1.00 for medium distance (501-1000 mi)', () => {
      expect(getDistanceFactor(750)).toBe(1.00);
    });

    it('returns 1.65 for coast-to-coast (3001+ mi)', () => {
      expect(getDistanceFactor(3500)).toBe(1.65);
    });
  });

  describe('calculateDeficitOptimized', () => {
    it('selects best tier for 6000 lbs Class 65', () => {
      const result = calculateDeficitOptimized(65, 6000, 1.08);
      expect(result.cost).toBeCloseTo(680.4, 1);
      expect(result.tierUsed).toBe(5);
      expect(result.billableCWT).toBe(60);
    });

    it('handles minimum weight tier bump', () => {
      const result = calculateDeficitOptimized(70, 100, 1.0);
      expect(result.billableCWT).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateAccessorials', () => {
    it('returns 0 when no services selected', () => {
      const result = calculateAccessorials([], [], 'commercial', 'commercial', 1000);
      expect(result.total).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it('adds residential delivery for residential destination', () => {
      const result = calculateAccessorials([], [], 'commercial', 'residential', 1000);
      expect(result.total).toBeGreaterThan(0);
      expect(result.details.some(d => d.name === 'residential_delivery')).toBe(true);
    });

    it('scales weight-based charges', () => {
      const light = calculateAccessorials([], ['lift_gate'], 'commercial', 'commercial', 500);
      const heavy = calculateAccessorials([], ['lift_gate'], 'commercial', 'commercial', 5000);
      expect(heavy.total).toBeGreaterThan(light.total);
    });
  });

  describe('estimateTransitDays', () => {
    it('returns 2 for short distances', () => {
      expect(estimateTransitDays(200)).toBe(2);
    });

    it('returns 10 for very long distances', () => {
      expect(estimateTransitDays(3000)).toBe(10);
    });
  });

  describe('calculateQuote (integration)', () => {
    it('matches calibration: 6000lbs Class65 1050mi ~ $882', () => {
      const result = calculateQuote({
        originZip: '08846',
        destinationZip: '32824',
        distanceMiles: 1050,
        items: [{ weight: 6000, length: 40, width: 48, height: 72, freightClass: '65', pallets: 3 }],
        pickupServices: [],
        deliveryServices: [],
        originType: 'commercial',
        destinationType: 'commercial',
      });

      expect(result.netCharge).toBeCloseTo(882.82, 0);
      expect(result.carrier).toBe('EW Logistics');
      expect(result.carrierCode).toBe('WELOGX');
      expect(result.freightClass).toBe(65);
      expect(result.totalWeight).toBe(6000);
      expect(result.transitDays).toBe(5);
    });

    it('matches calibration: 279lbs Class250 294mi ~ $179', () => {
      const result = calculateQuote({
        originZip: '07001',
        destinationZip: '11788',
        distanceMiles: 294,
        items: [{ weight: 279, length: 48, width: 40, height: 48, freightClass: '250', pallets: 1 }],
        pickupServices: [],
        deliveryServices: [],
        originType: 'commercial',
        destinationType: 'commercial',
      });

      expect(result.netCharge).toBeCloseTo(178.83, 0);
    });

    it('uses ZIP fallback when no distance provided', () => {
      const result = calculateQuote({
        originZip: '08846',
        destinationZip: '32824',
        distanceMiles: null,
        items: [{ weight: 1000, length: 48, width: 40, height: 48, freightClass: '70', pallets: 1 }],
        pickupServices: [],
        deliveryServices: [],
        originType: 'commercial',
        destinationType: 'commercial',
      });

      expect(result.netCharge).toBeGreaterThan(0);
      expect(result.distanceMiles).toBeGreaterThan(0);
    });

    it('throws for zero weight', () => {
      expect(() => calculateQuote({
        originZip: '10001',
        destinationZip: '90001',
        distanceMiles: 2500,
        items: [{ weight: 0, length: 48, width: 40, height: 48, pallets: 1 }],
        pickupServices: [],
        deliveryServices: [],
        originType: 'commercial',
        destinationType: 'commercial',
      })).toThrow('Total weight must be greater than 0');
    });

    it('includes accessorials in total', () => {
      const result = calculateQuote({
        originZip: '10001',
        destinationZip: '90001',
        distanceMiles: 2500,
        items: [{ weight: 1000, length: 48, width: 40, height: 48, freightClass: '70', pallets: 1 }],
        pickupServices: ['lift_gate'],
        deliveryServices: ['lift_gate'],
        originType: 'commercial',
        destinationType: 'residential',
      });

      expect(result.breakdown.accessorials).toBeGreaterThan(0);
      expect(result.breakdown.accessorialDetails.length).toBeGreaterThanOrEqual(2);
    });
  });
});
