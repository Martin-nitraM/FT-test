const sineFuncCanvas = "sine_func_canvas";
const cosineFuncCanvas = "cosine_func_canvas";
const canvasIndexes = [];

window.onload = function() {
    canvasIndexes[sineFuncCanvas] = addCanvas(sineFuncCanvas);
    worker.postMessage({drawSine: true, phase: 0, amplitude: 111, frequency: 1, length: 700, canvasIndex: canvasIndexes[sineFuncCanvas]});

    canvasIndexes[cosineFuncCanvas] = addCanvas(cosineFuncCanvas);
    worker.postMessage({drawCosine: true, phase: 0, amplitude: 111, frequency: 1, length: 700, canvasIndex: canvasIndexes[cosineFuncCanvas]});
}

function drawSine(phase) {
    worker.postMessage({drawSine: true, phase: phase / 180 * Math.PI, amplitude: 111, frequency: 1, length: 700, canvasIndex: canvasIndexes[sineFuncCanvas]});
}

function drawCosine(phase) {
    worker.postMessage({drawCosine: true, phase: phase / 180 * Math.PI, amplitude: 111, frequency: 1, length: 700, canvasIndex: canvasIndexes[cosineFuncCanvas]});
}

function modifyVector(row) {
    let values = getValues(row);
    worker.postMessage({modifyVector: true, canvasIndex: canvasIndexes[sineCanvas], index: row.rowIndex, amplitude: values.amplitude, phase: values.phase, frequency: values.frequency});
}

function startButtonClick(sender) {
    let row = sender.parentNode.closest("tr");
    let values = getValues(row);
    worker.postMessage({X: [{amplitude: values.amplitude, phase: values.phase, frequency: values.frequency}], length: 300, drawPeriods: true, canvasIndex: canvasIndexes[sineCanvas]});
}

function valueChanged(sender) {
    modifyVector(sender.parentNode.closest("tr"));
}

function getValues(row) {
    return {amplitude: Number(row.cells[0].firstElementChild.value), phase: -Number(row.cells[1].firstElementChild.value) / 180 * Math.PI, frequency: -Number(row.cells[2].firstElementChild.value)};
}




