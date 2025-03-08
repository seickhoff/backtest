import TechnicalAnalysis from './TechnicalAnalysis';
import mockStockData from './mock/data'; // Ensure you have the correct import path

describe('TechnicalAnalysis', () => {
    describe('average()', () => {
        it('should calculate the average of an array of numbers', () => {
            const result = TechnicalAnalysis.average([1, 2, 3, 4, 5]);
            expect(result).toBe(3);
        });

        it('should return NaN for an empty array', () => {
            const result = TechnicalAnalysis.average([]);
            expect(result).toBeNaN();
        });
    });

    describe('sma()', () => {

        let data: Array<{ date: Date; high: number; volume: number; open: number; low: number; close: number; adjClose: number }>;

        beforeEach(() => {
            data = mockStockData;
        });

        it('should calculate the Simple Moving Average correctly', () => {

            const result = TechnicalAnalysis.sma(mockStockData, 5, "volume", 0);

            expect(result).toEqual([
                '0', '0',
                '0', '0',
                '11071820', '11545560',
                '13418760', '14657820',
                '15126200', '14812120',
                '15388200', '15294760',
                '15129780'
            ]);
        });

        it('should format to the correct number of decimal places', () => {

            const result = TechnicalAnalysis.sma(mockStockData, 3, "close", 2);
            expect(result).toEqual([
                '0.00', '0.00',
                '78.32', '78.20',
                '76.98', '75.94',
                '74.76', '73.79',
                '72.28', '71.28',
                '70.51', '69.43',
                '68.91'
            ]);
        });
    });

    describe('ema()', () => {
        it('should calculate the Exopential Moving Average correctly', () => {

            const result = TechnicalAnalysis.ema(mockStockData, "close", 3, 2);

            expect(result).toEqual(    [
                '0.00',  '0.00',
                '78.32', '77.97',
                '76.46', '75.86',
                '74.96', '73.51',
                '72.12', '71.58',
                '70.67', '69.07',
                '69.29'
              ]);
        });

        it('should format to the correct number of decimal places', () => {

            const result = TechnicalAnalysis.ema(mockStockData, "close", 5, 2);
            expect(result).toEqual([
                '0.00',  '0.00',
                '0.00',  '0.00',
                '77.51', '76.75',
                '75.86', '74.59',
                '73.30', '72.55',
                '71.62', '70.24',
                '69.99'
              ]);
        });
    });

});
