import { Universe } from "bitaggy";
import { memory } from "bitaggy/bitaggy_bg";


// Cell display settings.
const CELL_SIZE = 12;    // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, get its width and height.
const universe = Universe.new(42, 42, false);
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.width = (CELL_SIZE + 1) * width + 1;
canvas.height = (CELL_SIZE + 1) * height + 1;
const ctx = canvas.getContext('2d');

function getIndex(row, col) {
    return row * width + col;
}

function bitIsSet(arr, idx) {
    const byte = Math.floor(idx / 8);
    const mask = 1 << (idx % 8);
    return (arr[byte] & mask) === mask;
}

// Draws the cells.
function drawCells() {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            ctx.fillStyle = bitIsSet(cells, idx)
                ? ALIVE_COLOR
                : DEAD_COLOR;
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
}

// Draws the drid between cells.
function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
}


// Start/pause button control.
const playButton = document.getElementById("play-pause-btn");
const buttonStartText = "▶️ Start";
const buttonPauseText = "⏸ Pause";
playButton.textContent = buttonStartText;

let animationId = null;
let paused = true;

function play() {
    playButton.textContent = buttonPauseText;
    paused = false;
    renderLoop();
}

function pause() {
    playButton.textContent = buttonStartText;
    paused = true;
    if (animationId != null) {
        cancelAnimationFrame(animationId);
    }
}

playButton.addEventListener("click", event => {
    if (paused) {
        play();
    } else {
        pause();
    }
});


// Reset button control.
const resetButton = document.getElementById("reset-btn");
resetButton.textContent = "🔄 Reset";

function reset(rand_init) {
    universe.reset(rand_init);
    // drawGrid();
    drawCells();
}

resetButton.addEventListener("click", event => {
    pause();
    reset(false);
});


// Randomization button control.
const randomButton = document.getElementById("random-btn");
randomButton.textContent = "🔀 Random"

randomButton.addEventListener("click", event => {
    pause();
    reset(true);
});


// Mouse click toggling support.
canvas.addEventListener("click", event => {
    if (paused) {
        const boundingRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / boundingRect.width;
        const scaleY = canvas.height / boundingRect.height;
        const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
        const canvasTop = (event.clientY - boundingRect.top) * scaleY;
        const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
        const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
    
        universe.toggle(row, col);
        // drawGrid();
        drawCells();
    }
});


// Renders next tick of universe in desired FPS rate.
const FPS = 5;
const FPS_INTERVAL = 1000 / FPS;
var last_draw_time = Date.now();

function renderLoop() {
    let now = Date.now();
    let elapsed = now - last_draw_time;

    if (!paused) {
        if (elapsed > FPS_INTERVAL) {
            last_draw_time = now - (elapsed % FPS_INTERVAL);
            
            universe.tick();
            // drawGrid();
            drawCells();
        }
        
        requestAnimationFrame(renderLoop);
    }
}

window.onload = () => {
    drawGrid();
    drawCells();
    requestAnimationFrame(renderLoop);
}

drawGrid();
drawCells();
requestAnimationFrame(renderLoop);
