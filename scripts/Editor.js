const fourierCanvas = "fourier_canvas";
let canvasIndexes = new Object();
window.onload = function() {
    let htmlCanvas = window.document.getElementById(fourierCanvas);
    let canvas = htmlCanvas.transferControlToOffscreen();
    worker.postMessage({canvas: canvas, addCanvas: true}, [canvas]);
    canvasIndexes[fourierCanvas] = 0;
    worker.postMessage({X: [{amplitude: 47, phase: 0, frequency: -1}], length: 300, drawFunction: true, canvasIndex: canvasIndexes[fourierCanvas]});
}

function addButtonClick() {
    let parent = document.getElementById("vectors");
    let ch = parent.rows[0].cloneNode(true);
    ch.cells[0].firstElementChild.value = 47;
    ch.cells[1].firstElementChild.value = 0;
    ch.cells[2].firstElementChild.value = 1;
    ch.cells[3].firstElementChild.style = "display: block;";
    worker.postMessage({addVector: true, canvasIndex: canvasIndexes[fourierCanvas], amplitude: 47, phase: 0, frequency: -1});
    parent.appendChild(ch);
}

function modifyVector(row) {
    let amplitude = Number(row.cells[0].firstElementChild.value);
    let phase = -Number(row.cells[1].firstElementChild.value) / 180 * Math.PI;
    let frequency = -Number(row.cells[2].firstElementChild.value);
    worker.postMessage({modifyVector: true, canvasIndex: canvasIndexes[fourierCanvas], index: row.rowIndex, amplitude: amplitude, phase: phase, frequency: frequency});
}

function removeButtonClick(sender) {
    let row = sender.parentNode.closest("tr");
    worker.postMessage({removeVector: true, canvasIndex: canvasIndexes[fourierCanvas], index: row.rowIndex});
    document.getElementById("vectors").deleteRow(row.rowIndex);
}

function valueChanged(sender) {
    modifyVector(sender.parentNode.closest("tr"));
}