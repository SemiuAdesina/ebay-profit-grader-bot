const { calculateGrade, calculateEBayFees, calculateNetProfit } = require('../src/utils/grader');

describe('Grader Utility Tests', () => {
    describe('calculateGrade', () => {
        test('should return grade F when no market data is available', () => {
            const result = calculateGrade(100, null);
            expect(result.grade).toBe('F');
            expect(result.score).toBe(0);
            expect(result.reasoning).toContain('No market data available');
        });

        test('should return grade F when total listings is 0', () => {
            const marketData = {
                totalListings: 0,
                averagePrice: 0,
                medianPrice: 0,
                minPrice: 0,
                maxPrice: 0,
                priceRange: 0
            };
            const result = calculateGrade(100, marketData);
            expect(result.grade).toBe('F');
            expect(result.score).toBe(0);
        });

        test('should return grade A for excellent profit potential', () => {
            const marketData = {
                totalListings: 100,
                averagePrice: 200,
                medianPrice: 200,
                minPrice: 150,
                maxPrice: 250,
                priceRange: 100
            };
            const result = calculateGrade(100, marketData); // 100% profit margin
            expect(result.grade).toBe('A');
            expect(result.profitMargin).toBe(100);
            expect(result.riskLevel).toBe('Low');
        });

        test('should return grade C for moderate profit potential', () => {
            const marketData = {
                totalListings: 25,
                averagePrice: 120,
                medianPrice: 120,
                minPrice: 100,
                maxPrice: 140,
                priceRange: 40
            };
            const result = calculateGrade(100, marketData); // 20% profit margin
            expect(result.grade).toBe('C');
            expect(result.profitMargin).toBe(20);
            expect(result.riskLevel).toBe('Medium');
        });

        test('should return grade F for negative profit potential', () => {
            const marketData = {
                totalListings: 10,
                averagePrice: 80,
                medianPrice: 80,
                minPrice: 70,
                maxPrice: 90,
                priceRange: 20
            };
            const result = calculateGrade(100, marketData); // -20% profit margin
            expect(result.grade).toBe('F');
            expect(result.profitMargin).toBe(-20);
            expect(result.riskLevel).toBe('High');
        });
    });

    describe('calculateEBayFees', () => {
        test('should calculate correct fees for $100 selling price', () => {
            const result = calculateEBayFees(100);
            expect(result.finalValueFee).toBe(10); // 10% of $100
            expect(result.paypalFee).toBe(3.2); // 2.9% + $0.30
            expect(result.insertionFee).toBe(0);
            expect(result.totalFees).toBe(13.2);
        });

        test('should calculate correct fees for $50 selling price', () => {
            const result = calculateEBayFees(50);
            expect(result.finalValueFee).toBe(5); // 10% of $50
            expect(result.paypalFee).toBe(1.75); // 2.9% + $0.30
            expect(result.totalFees).toBe(6.75);
        });

        test('should handle zero selling price', () => {
            const result = calculateEBayFees(0);
            expect(result.finalValueFee).toBe(0);
            expect(result.paypalFee).toBe(0.3); // Still $0.30 minimum
            expect(result.totalFees).toBe(0.3);
        });
    });

    describe('calculateNetProfit', () => {
        test('should calculate net profit correctly', () => {
            const result = calculateNetProfit(100, 150, 5); // $100 bid, $150 sell, $5 shipping
            expect(result.grossProfit).toBe(50);
            expect(result.netProfit).toBe(31.8); // 50 - 13.2 - 5
            expect(result.netProfitMargin).toBe(31.8);
            expect(result.shippingCost).toBe(5);
        });

        test('should handle zero shipping cost', () => {
            const result = calculateNetProfit(100, 150, 0);
            expect(result.grossProfit).toBe(50);
            expect(result.netProfit).toBe(36.8); // 50 - 13.2
            expect(result.shippingCost).toBe(0);
        });

        test('should handle negative profit', () => {
            const result = calculateNetProfit(100, 80, 0);
            expect(result.grossProfit).toBe(-20);
            expect(result.netProfit).toBe(-33.2); // -20 - 13.2
            expect(result.netProfitMargin).toBe(-33.2);
        });

        test('should handle zero bid price', () => {
            const result = calculateNetProfit(0, 100, 0);
            expect(result.grossProfit).toBe(100);
            expect(result.netProfit).toBe(86.8); // 100 - 13.2
            expect(result.netProfitMargin).toBe(Infinity); // Division by zero
        });
    });

    describe('Edge cases', () => {
        test('should handle very small numbers', () => {
            const result = calculateEBayFees(0.01);
            expect(result.totalFees).toBe(0.3); // Minimum PayPal fee
        });

        test('should handle very large numbers', () => {
            const result = calculateEBayFees(10000);
            expect(result.finalValueFee).toBe(1000);
            expect(result.paypalFee).toBe(290.3);
            expect(result.totalFees).toBe(1290.3);
        });

        test('should handle market data with extreme values', () => {
            const marketData = {
                totalListings: 1,
                averagePrice: 1000,
                medianPrice: 1000,
                minPrice: 1,
                maxPrice: 9999,
                priceRange: 9998
            };
            const result = calculateGrade(500, marketData);
            expect(result.grade).toBeDefined();
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });
    });
}); 