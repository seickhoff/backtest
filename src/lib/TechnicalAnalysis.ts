/**
 * A utility class for technical analysis calculations.
 */
class TechnicalAnalysis {
    /**
     * Calculates the average of an array of numbers.
     * 
     * @param {number[]} array - The array of numbers to average.
     * @returns {number} The calculated average.
     */
    static average(array: number[]): number {
        return array.reduce((sum, val) => sum + val, 0) / array.length;
    }

    /**
     * Calculates the Simple Moving Average (SMA) for a given field in the dataset.
     * 
     * @param {Array<{ [key: string]: any }>} data - The input data as an array of objects.
     * @param {number} days - The number of periods to calculate the SMA.
     * @param {string} field - The property name to use for SMA calculation (e.g., 'close').
     * @param {number} decimalPlaces - The number of decimal places for formatting.
     * @returns {string[]} The SMA values formatted to the given decimal places.
     */
    static sma(
        data: Array<{ [key: string]: any }>,
        days: number,
        field: string,
        decimalPlaces: number
    ): string[] {
        const width: number[] = [];
        const running: string[] = [];
        let maCount = 0;

        for (const entry of data) {
            const value = parseFloat(entry[field]); // Extract the field value dynamically

            if (isNaN(value)) {
                throw new Error(`Invalid number for field "${field}" in data: ${JSON.stringify(entry)}`);
            }

            if (width.length < days) {
                width.push(value);
                if (width.length === days) {
                    maCount = this.average(width);
                }
            } else {
                width.shift();
                width.push(value);
                maCount = this.average(width);
            }

            running.push(maCount.toFixed(decimalPlaces));
        }

        return running;
    }


    /**
  * Calculates the Exponential Moving Average (EMA).
  * 
  * @param {Array<{ [key: string]: any }>} data - The input data as an array of objects.
  * @param {string} key - The key of the value in the object to use for EMA calculation.
  * @param {number} days - The number of periods to calculate the EMA.
  * @param {number} decimalPlaces - The number of decimal places for formatting.
  * @returns {string[]} The EMA values formatted to the given decimal places.
  */
    static ema(
        data: Array<{ [key: string]: any }>,
        key: string,
        days: number,
        decimalPlaces: number
    ): string[] {
        if (!data.length || !key) return [];

        const values: number[] = data.map(row => parseFloat(row[key]));
        const emaValues: string[] = [];
        let previousEma = 0;
        let maCount = 0;
        const k = 2.0 / (days + 1);

        const format = (value: number): string => value.toFixed(decimalPlaces);

        // Fill first (days - 1) elements with zero
        for (let i = 0; i < days - 1; i++) {
            emaValues.push(format(0));
        }

        // Calculate initial SMA for the first `days` values
        maCount = values.slice(0, days).reduce((sum, val) => sum + val, 0) / days;
        previousEma = maCount;
        emaValues.push(format(previousEma));

        // Calculate EMA for the rest of the data
        for (let i = days; i < values.length; i++) {
            maCount = ((values[i] - previousEma) * k) + previousEma;
            previousEma = maCount;
            emaValues.push(format(maCount));
        }

        console.dir(emaValues, { depth: null });

        return emaValues;
    }



}


export default TechnicalAnalysis;