//symbol=AAPL&start=20250122&end=20250305&vol=y&height=400&lowerheight=150&sma1=50&rsi=14&col=18,12,15&thick=1&time=1741228441
import * as fs from "fs";
import yahooFinance from "yahoo-finance2";
import ta from "./TechnicalAnalysis"

import * as PImage from "pureimage";

type Historical = {
    adjClose?: number;
    close: number;
    date: Date;
    open: number;
    high: number;
    low: number;
    volume: number;
}

export async function processImage() {


    // writeArrayToFile("PYPL.json", data);



    console.log("-------------")

    let additionalDaysBack = 0;
    let smaDays = 14;

    additionalDaysBack = Math.round(smaDays * 1.7);

    const startDate = "2025-01-01'";
    const preDate = getXDaysBefore(startDate, additionalDaysBack);

    const query = 'PYPL';
    const queryOptions = { period1: preDate, /* ... */ };
    const data: Historical[] = await yahooFinance.historical(query, queryOptions);

    let count = data.length;
    let lower_plots = 0;
    let arr_plots = [];

    // amount of records before start date
    const offset = getCountBeforeStartDate(data, startDate);

    console.log(`${offset}`)

    // SMA
    let arr_sma1 = [];
    if (smaDays) {
        arr_sma1 = ta.sma(data, smaDays, "close", 2);
    }



    let col = 12; // space for each candle column
    let colCandle = 6; // space for each candle
    let colVolume = 10; // space for each candle

    let topMargin = 40;
    let leftMargin = 40; // offset for beginning of horz grid lines
    let leftMarginGraph = 30; // offset for beginning of cand 
    let rightMargin = 90; // vol text

    let draw_vol = true;

    if (!draw_vol)
        rightMargin = 5;

    let width = col * (count - offset); // dynamic width
    let height = 300;

    let lower_height = 100;

    let canvasWidth = width + col + leftMargin + leftMarginGraph + rightMargin;

    let space_between_upper_lower = 60;
    let bottom_height = lower_height;
    
    let half_bottom_height = Math.floor(bottom_height / 2); // for graphs with respect to centerline (macd divergence)


    // const a = ta.sma(data, 3, "close", 2)
    // const v = ta.sma(data, 5, "volume", 0)
    // console.dir(a, { depth: null })
    // console.dir(v, { depth: null })

    // Create an image

    const img = PImage.make(canvasWidth, (lower_plots * (space_between_upper_lower + bottom_height) + height + 75));
    const ctx = img.getContext("2d");

    // Fill with black
    ctx.fillStyle = Color.black;
    ctx.fillRect(0, 0, canvasWidth, (lower_plots * (space_between_upper_lower + bottom_height) + height + 75));

    // for tracking whether the low comes before high (for fib grid direction)
    let offset_low = 0;
    let offset_high = 0;

    let { min, max, minVol, maxVol, offset_min, offset_max } = findMinMax(data, offset);

    console.dir(findMinMax(data, offset), { depth: null})

    let fib_direction = "DOWN";
    if (offset_low < offset_high)
        fib_direction = "UP";

    // adjust min/max for the upper technicals
    const crop = false;
    if (!crop) {

        for (let i = offset; i < arr_sma1.length; i++) {
            if (arr_sma1[i] < min) {
                min = arr_sma1[i];
            }
            if (arr_sma1[i] > max) {
                max = arr_sma1[i];
            }
        }
    }

    let drawFib = true;
    const arr_grid = getFibGrid(drawFib, fib_direction, height);

    for (let i = 0; i < arr_grid.length; i++) {
        const line = arr_grid[i];
        const Yline = height - height * line;
    
        // Draw grid line using imageline
        imageline(
            ctx,
            36 + leftMargin,
            Yline + topMargin,
            width + col + leftMargin + leftMarginGraph,
            Yline + topMargin,
            Color.lightgrey // lightgrey color
        );
    
        // Format price
        let pr = '$' + ((max - (max - min) * (1 - line))).toFixed(2);
        const prLength = pr.length;
    
        // Add leading spaces
        for (let x = 0; x < (11 - prLength); x++) {
            pr = ' ' + pr;
        }
    
        // Draw price using imagestring
        imagestring(ctx, 14, 5, Yline + topMargin, pr, Color.white); // white equivalent
    
        // Draw volume if applicable
        if (draw_vol) {
            let vol = ' ' + Math.round(maxVol - (maxVol - minVol) * (1 - line)).toLocaleString();
            const YtopVol = Math.round((maxVol - minVol) * (1 - line)); // Adjust volume calculation
            imagestring(ctx, 14, width + col + leftMargin + leftMarginGraph, Yline + topMargin, vol, Color.white); // white equivalent
        }
    }
    


    return img;

}

export function process(data: Historical[]) {

    const a = ta.sma(data, 3, "close", 2)

    const v = ta.sma(data, 5, "volume", 0)

    console.log("-------------")

    console.dir(a, { depth: null })
    console.dir(v, { depth: null })

}

/**
 * Draws a line on an HTML5 Canvas, mimicking PHP GD's imageline().
 * 
 * @param {PImage.Bitmap} img - The image to draw on.
 * @param {number} x1 - The starting x-coordinate.
 * @param {number} y1 - The starting y-coordinate.
 * @param {number} x2 - The ending x-coordinate.
 * @param {number} y2 - The ending y-coordinate.
 * @param {string} color - The color of the line in CSS format (e.g., "#FFFFFF" or "rgb(255,255,255)").
 */
export function imageline(ctx: PImage.Context, x1: number, y1: number, x2: number, y2: number, color: string) {
    if (!(ctx instanceof PImage.Context)) {
        throw new Error("Invalid context.");
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

/**
 * Draws a filled rectangle on an HTML5 Canvas, mimicking PHP's imagefilledrectangle().
 * 
 * @param {PImage.Context} ctx - The canvas 2D context.
 * @param {number} x1 - The x-coordinate of the top-left corner.
 * @param {number} y1 - The y-coordinate of the top-left corner.
 * @param {number} x2 - The x-coordinate of the bottom-right corner.
 * @param {number} y2 - The y-coordinate of the bottom-right corner.
 * @param {string} color - The fill color in CSS format (e.g., "#FF0000" or "rgb(255,0,0)").
 */
export function imagefilledrectangle(
    ctx: PImage.Context,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
) {
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Draws a string of text on an HTML5 Canvas, mimicking PHP's imagestring().
 * 
 * @param {PImage.Context} ctx - The canvas 2D context.
 * @param {number} fontSize - The font size in pixels.
 * @param {number} x - The x-coordinate for the text position.
 * @param {number} y - The y-coordinate for the text position.
 * @param {string} text - The text to be drawn.
 * @param {string} color - The fill color in CSS format (e.g., "#000000" or "rgb(255,255,255)").
 * @param {string} [font="Arial"] - The font family (default is Arial).
 */
export function imagestring(
    ctx: PImage.Context,
    fontSize: number,
    x: number,
    y: number,
    text: string,
    color: string,
    font: string = "Arial"
) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillText(text, x, y);
}

/**
 * Writes an array of objects to a file as JSON.
 *
 * @param {string} filePath - The path of the file.
 * @param {Array<object>} data - The array of objects to write.
 */
export function writeArrayToFile(filePath: string, data: Array<object>): void {
    const jsonData = JSON.stringify(data, null, 2); // Pretty-print JSON
    fs.writeFileSync(filePath, jsonData, "utf-8");
}


function getXDaysBefore(dateString: string, x: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() - x); // Subtract x days

    return date.toISOString().split('T')[0]; // Return the date in 'YYYY-MM-DD' format
}

function getCountBeforeStartDate(data: Historical[], startDate: string): number {
    let countBeforeStartDate = 0;

    // Iterate over the data and count entries before the startDate
    for (const entry of data) {
        const entryDate = new Date(entry.date);

        // If entry date is greater than or equal to startDate, break early
        if (entryDate >= new Date(startDate)) {
            break;
        }

        countBeforeStartDate++;
    }

    return countBeforeStartDate;
}


enum Color {
    black = 'rgba(0, 0, 0, 1)',
    blue = 'rgba(0, 0, 255, 1)',
    darkgrey = 'rgba(50, 50, 50, 1)',
    darkpurple = 'rgba(100, 50, 127, 1)',
    green = 'rgba(0, 255, 0, 1)',
    grey = 'rgba(70, 70, 70, 1)',
    honeydew3 = 'rgba(193, 205, 193, 1)',
    indianred = 'rgba(176, 23, 31, 1)',
    lightblue = 'rgba(200, 255, 255, 1)',
    lightgreen = 'rgba(200, 255, 200, 1)',
    lightgrey = 'rgba(100, 100, 100, 1)',
    lightpink = 'rgba(255, 182, 193, 1)',
    orange = 'rgba(255, 200, 0, 1)',
    palecanary = 'rgba(255, 255, 200, 1)',
    pink = 'rgba(255, 200, 255, 1)',
    purple = 'rgba(200, 100, 255, 1)',
    red = 'rgba(255, 0, 0, 1)',
    sapgreen = 'rgba(48, 128, 20, 1)',
    white = 'rgba(255, 255, 255, 1)',
    white2 = 'rgba(120, 120, 120, 1)',
    yellow = 'rgba(255, 255, 0, 1)',
}

export default Color;

interface MinMaxValues {
    min: number;
    max: number;
    minVol: number;
    maxVol: number;
    offset_min: number;
    offset_max: number;
}

function findMinMax(data: Historical[], offset: number): MinMaxValues {
    let min: number = Infinity;
    let max: number = -Infinity;
    let minVol: number = Infinity;
    let maxVol: number = -Infinity;
    let offset_min: number = -1;
    let offset_max: number = -1;
    let cnt = 0;

    for (let i = offset; i < data.length; i++) {
        const { low, high, volume } = data[i];
        cnt++;

        if (cnt === 1) {
            min = low;
            max = high;
            minVol = volume;
            maxVol = volume;
            offset_min = i;
            offset_max = i;
        } else {
            if (low < min) {
                min = low;
                offset_min = i;
            }
            if (high > max) {
                max = high;
                offset_max = i;
            }
            if (volume < minVol) minVol = volume;
            if (volume > maxVol) maxVol = volume;
        }
    }

    return { min, max, minVol, maxVol, offset_min, offset_max };
}

function getFibGrid(drawFib: boolean, fibDirection: string, height: number): number[] {
    let arrGrid: number[] = [];

    if (drawFib) {
        if (fibDirection === "UP") {
            arrGrid = [1, 0.923, 0.846, 0.764, 0.67, 0.618, 0.5, 0.382, 0.33, 0.236, 0.154, 0.077, 0];
        } else {
            arrGrid = [0, 0.077, 0.154, 0.236, 0.33, 0.382, 0.5, 0.618, 0.67, 0.764, 0.846, 0.923, 1];
        }
    } else if (height >= 800) {
        arrGrid = [
            1, 0.975, 0.95, 0.925, 0.9, 0.875, 0.85, 0.825, 0.8, 0.775, 0.75, 0.725, 0.7, 0.675, 0.65,
            0.625, 0.6, 0.575, 0.55, 0.525, 0.5, 0.475, 0.45, 0.425, 0.4, 0.375, 0.35, 0.325, 0.3, 0.275,
            0.25, 0.225, 0.2, 0.175, 0.15, 0.125, 0.1, 0.075, 0.05, 0.025, 0
        ];
    } else if (height >= 400) {
        arrGrid = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05, 0];
    } else if (height >= 300) {
        arrGrid = [
            1, 0.933333333, 0.866666667, 0.8, 0.733333333, 0.666666667, 0.6, 0.533333333,
            0.466666667, 0.4, 0.333333333, 0.266666667, 0.2, 0.133333333, 0.066666667, 0
        ];
    } else if (height >= 200) {
        arrGrid = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0];
    } else {
        arrGrid = [1, 0.88, 0.75, 0.62, 0.5, 0.25, 0.38, 0.12, 0];
    }

    return arrGrid;
}