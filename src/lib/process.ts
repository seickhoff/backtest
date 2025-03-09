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
    let smaDays = 20;

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



    let col = 16; // space for each candle column
    let colCandle = 10; // space for each candle
    let colVolume = 12; // space for each candle

    let topMargin = 40;
    let leftMargin = 40; // offset for beginning of horz grid lines
    let leftMarginGraph = 30; // offset for beginning of cand 
    let rightMargin = 90; // vol text

    let draw_vol = true;

    if (!draw_vol)
        rightMargin = 5;

    let width = col * (count - offset); // dynamic width
    let height = 400;

    let lower_height = 100;

    let canvasWidth = width + col + leftMargin + leftMarginGraph + rightMargin;

    let space_between_upper_lower = 60;
    let bottom_height = lower_height;

    let half_bottom_height = Math.floor(bottom_height / 2); // for graphs with respect to centerline (macd divergence)

    // Create an image

    // Register font globally (only once)
    // const fontPath = "src/fonts/SourceSansPro-Regular.ttf";
    // const fnt = PImage.registerFont(fontPath, "Source Sans Pro");
    const fontPath = "src/fonts/arial.ttf";
    const fnt = PImage.registerFont(fontPath, "Arial");
    fnt.loadSync(); // Load font once at startup

    let imageHeight = lower_plots * (space_between_upper_lower + bottom_height) + height + 75;

    const img = PImage.make(canvasWidth, (lower_plots * (space_between_upper_lower + bottom_height) + height + 75));
    const ctx = img.getContext("2d");

    // Fill with black
    ctx.fillStyle = Color.black;
    ctx.fillRect(0, 0, canvasWidth, (lower_plots * (space_between_upper_lower + bottom_height) + height + 75));

    // for tracking whether the low comes before high (for fib grid direction)
    let offset_low = 0;
    let offset_high = 0;

    let { min, max, minVol, maxVol, offset_min, offset_max } = findMinMax(data, offset);

    console.dir(findMinMax(data, offset), { depth: null })

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
        imagestring(ctx, 14, 4, Yline + topMargin + 3, pr, Color.white); // white equivalent

        // Draw volume if applicable
        if (draw_vol) {
            let vol = ' ' + Math.round(maxVol - (maxVol - minVol) * (1 - line)).toLocaleString();
            const YtopVol = Math.round((maxVol - minVol) * (1 - line)); // Adjust volume calculation
            imagestring(ctx, 14, width + col + leftMargin + leftMarginGraph + 3, Yline + topMargin + 3, vol, Color.white); // white equivalent
        }
    }

    // plots
    let cnt = 0;
    let dif = max - min;
    let fac = dif !== 0 ? height / dif : 0;

    let difVol = maxVol - minVol;
    let facVol = difVol !== 0 ? height / difVol : 0;

    // let difM = maxM - minM;
    // let facM = difM !== 0 ? bottom_height / difM : 0;

    // let difR = maxR - minR;
    // let facR = difR !== 0 ? bottom_height / difR : 0;

    // let difMFI = maxMFI - minMFI;
    // let facMFI = difMFI !== 0 ? bottom_height / difMFI : 0;

    // let difA = maxA - minA;
    // let facA = difA !== 0 ? bottom_height / difA : 0;

    // let difADL = ADL_max - ADL_min;
    // let facADL = difADL !== 0 ? bottom_height / difADL : 0;

    let prev_mon: string | null = null;
    let prev_year: string | null = null;
    let top_margin: number | null = null;

    const test_point = data.length - 5;

    const candle_box: Record<number, { x1: number; y1: number; x2: number; y2: number }> = {};

    const maxTop = max * 1.01; // defines area to stop drawing upper graph technical lines (sma/ema/bol)
    const minBottom = min * 0.99;


    for (let i = offset; i < data.length; i++) {
        // const line = arr_data[I];
        //const [s, d, vStr, hStr, lStr, oStr, cStr] = line.split(",");
        let { date: d, volume: v, high: h, open: o, low: l, close: c } = data[i]

        cnt++;
        const xCent = cnt * col;

        if (o < l) l = o;
        if (c < l) l = c;
        if (o > h) h = o;
        if (c > h) h = c;

        const unix = new Date(d);
        const mon = unix.toLocaleString("en", { month: "short" });
        const day = unix.getDate().toString();
        const woy = getWeekNumber(unix);
        const year = unix.getFullYear().toString();

        // Used later to suppress first-month label
        const unixNextDay = new Date(unix);
        unixNextDay.setDate(unix.getDate() + 1);
        const monNextDay = unixNextDay.toLocaleString("en", { month: "short" });
        const yearNextDay = unixNextDay.getFullYear().toString();

        // Volume
        if (draw_vol) {
            const Y_topVol = Math.round((maxVol - v) * facVol);
            imagefilledrectangle(
                ctx,
                xCent - colVolume / 2 + leftMargin + leftMarginGraph,
                Y_topVol + topMargin!,
                xCent + colVolume / 2 + leftMargin + leftMarginGraph,
                height + topMargin!,
                Color.darkgrey
            );
        }

        if (cnt === 1) {
            const prevUnix = new Date(unix);
            prevUnix.setDate(unix.getDate() - 1);
            var prev_woy = getWeekNumber(prevUnix);
        }

        // Vertical bars for first trading day of the week
        if (woy !== prev_woy) {
            imageline(
                ctx,
                xCent + leftMargin + leftMarginGraph,
                topMargin!,
                xCent + leftMargin + leftMarginGraph,
                height + topMargin!,
                Color.lightgrey
            );

            // For the lower graphs
            // for (const plot of arr_plots) {
            //     imageline(
            //         ctx,
            //         xCent + leftMargin + leftMarginGraph,
            //         space_between_upper_lower + height + topMargin! + (plot - 1) * (space_between_upper_lower + bottom_height),
            //         xCent + leftMargin + leftMarginGraph,
            //         space_between_upper_lower + height + topMargin! + bottom_height + (plot - 1) * (space_between_upper_lower + bottom_height),
            //         Color.lightgrey
            //     );
            // }
        }

        let top = c;
        let bot = o;
        let color = Color.green;

        if (o > c) {
            top = o;
            bot = c;
            color = Color.red;
        }

        const Y_top = Math.round((max - top) * fac);
        let Y_bot = Math.round((max - bot) * fac);

        // Rectangle requires height of at least 2 pixels
        if (Y_top === Y_bot) Y_bot++;

        // daily candlesticks
        imagefilledrectangle(
            ctx,
            xCent - Math.round(colCandle / 2) + leftMargin + leftMarginGraph,
            Y_top + topMargin!,
            xCent + Math.round(colCandle / 2) + leftMargin + leftMarginGraph,
            Y_bot + topMargin!,
            color
        );

        const Y_upp = Math.round((max - h) * fac);
        const Y_low = Math.round((max - l) * fac);

        if (Y_upp !== Y_top) {
            imageline(
                ctx,
                xCent + leftMargin + leftMarginGraph,
                Y_upp + topMargin!,
                xCent + leftMargin + leftMarginGraph,
                Y_top + topMargin!,
                Color.white
            );
        }
        
        if (Y_bot !== Y_low) {
            imageline(
                ctx,
                xCent + leftMargin + leftMarginGraph,
                1 + Y_bot + topMargin!,
                xCent + leftMargin + leftMarginGraph,
                1 + Y_low + topMargin!,
                Color.white
            );
        }
        

        candle_box[i] = {
            x1: -3 + xCent - Math.round(colCandle / 2) + leftMargin + leftMarginGraph,
            y1: -3 + Y_upp + topMargin!,
            x2: 2 + xCent + Math.round(colCandle / 2) + leftMargin + leftMarginGraph,
            y2: 3 + Y_low + topMargin!,
        };



        // Simple Moving Average (SMA) line drawing
        if (smaDays && cnt >= 2) {
            const Y_2 = Math.round((max - arr_sma1[i - 1]) * fac);
            const Y_1 = Math.round((max - arr_sma1[i]) * fac);

            if (
                (arr_sma1[i] <= maxTop && arr_sma1[i] >= minBottom) ||
                (arr_sma1[i - 1] <= maxTop && arr_sma1[i - 1] >= minBottom)
            ) {
                imageline(
                    ctx,
                    xCent + leftMargin + leftMarginGraph, Y_1 + topMargin,
                    xCent - col + leftMargin + leftMarginGraph, Y_2 + topMargin,
                    Color.lightblue,
                    2
                );
            }
        }

        // Day, month, year labels
        // Offsets keep labels centered on vertical lines
        const offset1 = 4 * (day.length);
        const offset2 = ((mon.length + 1) / 2) * 3;
        const offset3 = ((year.length + 1) / 2) * 3;

        const textX = xCent + leftMargin + leftMarginGraph;
        const baseY = 20 + topMargin + height;

        //console.log(`${offset1}, ${offset2}, ${offset3} - x: ${textX}, y: ${baseY}, imageHeight: ${imageHeight}`); 
        console.log(`col: ${col}, woy: ${woy}, prev_woy: ${prev_woy},  mon: ${mon}, monNextDay: ${monNextDay}, ${d}`); 

        if (col >= 12 || woy !== prev_woy) {
            // drawText(ctx, day, textX - offset1, baseY + 26, "white"); // day
            console.log(`----------------${textX - offset1}------${baseY + 36}---}`)
            // imagestring(ctx, 14, textX - offset1, baseY + 26, day, Color.white)
            imagestring(ctx, 12 , textX - offset1, baseY, day, Color.white)
        }

        if (!(cnt === 1 && monNextDay !== mon)) {
            if (mon !== prev_mon) {
                // drawText(ctx, mon, textX - offset2, baseY + 36, "white"); // month
                imagestring(ctx, 12, textX - offset2, baseY + 36, mon, Color.white)
            }
        }

        if (!(cnt === 1 && yearNextDay !== year)) {
            if (year !== prev_year) {
                // drawText(ctx, year, textX - offset3, baseY + 46, "white"); // year
                imagestring(ctx, 12, textX - offset3, baseY + 46, year, Color.white)
            }
        }

        // Loop for multiple plots
        for (let q = 1; q <= arr_plots.length; q++) {
            const plotOffset = q * (bottom_height + space_between_upper_lower);

            if (col >= 12 || woy !== prev_woy) {
                // drawText(ctx, day, textX - offset1, baseY + plotOffset + 26, "white"); // day
                imagestring(ctx, 12, textX - offset1, baseY + plotOffset + 26, day, Color.white)
            }

            if (!(cnt === 1 && monNextDay !== mon)) {
                if (mon !== prev_mon) {
                    // drawText(ctx, mon, textX - offset2, baseY + plotOffset + 36, "white"); // month
                    imagestring(ctx, 12, textX - offset2, baseY + plotOffset + 36, mon, Color.white)
                }
            }

            if (!(cnt === 1 && yearNextDay !== year)) {
                if (year !== prev_year) {
                    // drawText(ctx, year, textX - offset3, baseY + plotOffset + 46, "white"); // year
                    imagestring(ctx, 12, textX - offset3, baseY + plotOffset + 46, year, Color.white)
                }
            }
        }

        // Update previous values
        prev_mon = mon;
        prev_year = year;
        prev_woy = woy;

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
 * Helper function to get the ISO week number of a date.
 */
function getWeekNumber(d: Date): number {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const millisInDay = 86400000;
    return Math.ceil(((d.getTime() - oneJan.getTime()) / millisInDay + oneJan.getDay() + 1) / 7);
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
export function imageline(ctx: PImage.Context, x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1) {
    if (!(ctx instanceof PImage.Context)) {
        throw new Error("Invalid context.");
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

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
    lightgrey = 'rgba(100, 100, 100, .5)',
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