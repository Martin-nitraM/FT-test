let squareCanvas = "square_canvas";
let sawCanvas = "saw_canvas";
let triangleCanvas = "triangle_canvas";
let imageCanvas = "image_canvas";
let fourierCanvas = "fourier_canvas"
let canvasIndexes = [];
let savePos = false;
let lastPosX = 0;
let lastPosY = 0;
let originX = 333;
let originY = 333;

window.onload = function() {
    canvasIndexes[squareCanvas] = addCanvas(squareCanvas);
    let X = createSquareWave();
    activateFunctionCanvas(canvasIndexes[squareCanvas], X, 300);
    setVectorsCount(1, canvasIndexes[squareCanvas]);

    canvasIndexes[sawCanvas] = addCanvas(sawCanvas);
    X = createSawWave();
    activateFunctionCanvas(canvasIndexes[sawCanvas], X, 300);
    setVectorsCount(1, canvasIndexes[sawCanvas]);

    canvasIndexes[triangleCanvas] = addCanvas(triangleCanvas);
    X = createTriangleWave();
    activateFunctionCanvas(canvasIndexes[triangleCanvas], X, 300);
    setVectorsCount(1, canvasIndexes[triangleCanvas]);

    canvasIndexes[fourierCanvas] = addCanvas(fourierCanvas);

    let htmlCanvas = window.document.getElementById(imageCanvas);
    originX = htmlCanvas.width / 2;
    originY = htmlCanvas.height / 2;
    htmlCanvas.addEventListener("pointerdown" , canvasMouseDown, false);
    htmlCanvas.addEventListener("pointerup" , canvasMouseUp, false);
    htmlCanvas.addEventListener("pointermove" , canvasMouseMove, false);
    htmlCanvas.style.touchAction = 'none';

    canvasIndexes[imageCanvas] = addCanvas(imageCanvas);

    //int = setInterval(addPosToPath, 21);
}

function canvasMouseDown(event) {
    console.log("down");
    savePos = true;
    stopCanvas(canvasIndexes[fourierCanvas]);
}

function canvasMouseUp(event) {
    console.log("up");
    savePos = false;
    let length = x.length;
    document.getElementById("image_input").max = length;
    document.getElementById("image_range").max = length;
    document.getElementById("image_input").value = length;
    document.getElementById("image_range").value = length;
    activateImageCanvas(canvasIndexes[fourierCanvas], calculateDFT(), length);
    clearPath();
}

function canvasMouseMove(event) {
    console.log("move");
    let rect = event.srcElement.getBoundingClientRect();
    posX = (event.clientX - rect.left) * (event.srcElement.width / rect.width);
    posY = (event.clientY - rect.top) * (event.srcElement.height / rect.height);
    addPosToPath();
}

function addPosToPath() {
    if (savePos) {
        let dx = lastPosX - posX;
        let dy = lastPosY - posY;
        if (dx*dx + dy*dy > 17) {
            addToPath(posX - originX, posY - originY);
            drawPath(canvasIndexes[imageCanvas], posX, posY);
            lastPosX = posX;
            lastPosY = posY;
        } 
    }
}

function createSquareWave() {
    let X = new Array(333);
    for (let i = 0; i < X.length; i++) {
        X[i] = {amplitude: (61 / (2 * i + 1)), phase: 0, frequency: -(2 * i + 1)};
    }
    return X;
}

function createSawWave() {
    X = new Array(333);
    for (let i = 0; i < X.length; i++) {
        X[i] = {amplitude: (61 / (i + 1)), phase: 0, frequency: -(i + 1)};
    }
    return X;
}

function createTriangleWave() {
    X = new Array(333);
    let j = -1;
    for (let i = 0; i < X.length; i++) {
        j *= -1;
        let n = 2 * i + 1;
        X[i] = {amplitude: (61 * j / (n * n)), phase: 0, frequency: -n};
    }
    return X;
}