import express from 'express';
import yahooFinance from 'yahoo-finance2';
import * as PImage from "pureimage";

// php code that draws chart
// https://github.com/seickhoff/eickhoff-stock-charts/blob/master/eickhoff.stock.charts.php

// php technical analysis
// https://github.com/seickhoff/php-include/blob/master/incl.ta.eickhoff.php

// https://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html

const app = express();
const port = 3000;


// Register font globally (only once)
const fontPath = "src/fonts/SourceSansPro-Regular.ttf";
const fnt = PImage.registerFont(fontPath, "Source Sans Pro");
fnt.loadSync(); // Load font once at startup

app.get('/', async (req, res) => {


    const query = 'PYPL';
    const queryOptions = { period1: '2025-01-01', /* ... */ };
    const result = await yahooFinance.historical(query, queryOptions);

    console.dir(result, { depth: null })

    res.send(result);
});

app.get("/image", async (req, res) => {
    try {
        // Create an image
        const img = PImage.make(100, 100);
        const ctx = img.getContext("2d");

        // Fill with red
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 100, 100);

        // Set response headers
        res.setHeader("Content-Type", "image/png");

        // Stream image to response
        await PImage.encodePNGToStream(img, res);
    } catch (error) {
        res.status(500).send("Error generating image");
        console.error("Error:", error);
    }
});

app.get("/flag", async (req, res) => {
    try {

        // Create an image
        const img = PImage.make(120, 90);
        const context = img.getContext("2d");

        // Now do the real drawings:
        context.fillStyle = '#008C45';    // set the color to blue
        context.fillRect(0, 0, 40, 90); // draw a blue rectangle on the left
        context.fillStyle = '#F4F9FF';    // set the color to white
        context.fillRect(40, 0, 40, 90); // draw a white rectangle in the middle
        context.fillStyle = '#CD212A';    // set the color to red
        context.fillRect(80, 0, 40, 90); // draw a red rectangle on the right    

        // Save the current state
        context.save();

        // Text settings
        context.fillStyle = "black";
        context.font = "24px 'Source Sans Pro'";
        context.textBaseline = "middle"; // Align text to bottom

        // Move origin to bottom-left where text should start
        context.translate(10, 80); // Adjust (10, 80) based on where you want it
        context.rotate(-Math.PI / 4); // Rotate 45 degrees counterclockwise

        // Draw text
        context.fillText("Eickhoff", 0, 0); // The text now starts at (0,0) after transform

        // Restore to previous state (undo translation & rotation)
        context.restore();

        // Set response headers
        res.setHeader("Content-Type", "image/png");

        // Stream image to response
        await PImage.encodePNGToStream(img, res);
    } catch (error) {
        res.status(500).send("Error generating image");
        console.error("Error:", error);
    }
});



app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
