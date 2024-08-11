const equationDesigner = new EquationDesigner(111, 111);
let frequency;
let inputs;
let select;
let circuitInput;
let circuitImage;
let circuitImageDiv = document.getElementById("circuitImage");
let circuitInputsDiv = document.getElementById("circuitInputs");
let resultDiv = document.getElementById("result");
let calculationPregresionDiv = document.getElementById("calculationProgression");
let omega = 0;

let canvases = document.getElementById("canvases");

let currentVoltageCanvas = document.getElementById("currentVoltageCanvas");
currentVoltageCanvas = currentVoltageCanvas.transferControlToOffscreen();
worker.postMessage({canvas: currentVoltageCanvas, addCanvas: true}, [currentVoltageCanvas]);
let currentVoltageCanvasId = 0;

let powerCanvas = document.getElementById("powerCanvas");
powerCanvas = powerCanvas.transferControlToOffscreen();
worker.postMessage({canvas: powerCanvas, addCanvas: true}, [powerCanvas]);
let powerCanvasId = 1;

function setEquation(text) {
    if (!validate(text)) {
        return;
    }
    clear();
    inputs = [];
    equationDesigner.setEquation(text);
    circuitImage = equationDesigner.draw();
    circuitImageDiv.appendChild(circuitImage);
    let table = document.createElement("table");
    let row = table.insertRow();
    let cell1 = row.insertCell();
    cell1.innerHTML = "frekvence[Hz]";
    let cell2 = row.insertCell();
    frequency = document.createElement("input");
    frequency.type = "number";
    frequency.min = 0.1;
    cell2.appendChild(frequency);
    let values = equationDesigner.set.values();
    let value = values.next();
    while(!value.done) {
        row = table.insertRow();
        cell1 = row.insertCell();
        cell1.innerText = value.value + getUnit(value.value);
        cell2 = row.insertCell();
        let input = document.createElement("input");
        input.type = "number";
        input.min = 0.001;
        cell2.appendChild(input);
        inputs.push({input: input, value: value.value});
        value = values.next();
    }
    select = document.createElement("select");
    select.innerHTML = "<option value='I'>Im[A]:</option><option value='U'>Um[V]:</option>"
    circuitInput = document.createElement("input");
    circuitInput.type = "number";
    circuitInput.min = 0.001;
    row = table.insertRow();
    row.insertCell().appendChild(select);
    row.insertCell().appendChild(circuitInput);
    cell1 = table.insertRow().insertCell();
    cell1.style = "text-align: center;"
    cell1.colSpan = 2;
    cell1.innerHTML = "<input class='Calculate' type='button' onclick='calculate()' value='Vypočítat'>";
    circuitInputsDiv.appendChild(table);
}

function validate(text) {
    text = text.replaceAll(" ", "");
    let res = text.match(/(?!((\()|(\))|(\|)|(\_)|([A-Z])|([a-z])|([0-9])))./);
    if (res != null) return false;
    res = text.match(/((\(\))|(\_\))|(\|\))|(\_\_)|(\|\|)|(\_\|)|(\|\_)|(\)(([A-Z])|([a-z])|([0-9])))|((([A-Z])|([a-z])|([0-9]))\()|(\_$)|(\|$))/);
    if (res != null) return false;
    let c = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] == "(") c++;
        if (text[i] == ")") {
            c--;
            if (c < 0) return false;
        }
    }
    if (c != 0 || !m()) return false;
    return true;
}

function getUnit(value) {
    switch(value[0]) {
        case "C":
        case "c":
            return "[μF]";
        case "L":
        case "l":
            return "[mH]";
        default:
            return "[Ω]";           
    }
}

function substituteValues() {
    omega = 2 * Math.PI * Number(frequency.value).valueOf();
    for (let i = 0; i < inputs.length; i++) {
        let element = inputs[i];
        let value = Number(element.input.value).valueOf();
        if (value == 0) return false;
        if (element.value[0] == "c" | element.value[0] == "C") {
            if (omega == 0) return false;
            let number = new ComplexNumber(0, -1000000 / (omega * value));
            equationDesigner.substitute(element.value, number);
        } else if (element.value[0] == "l" | element.value[0] == "L") {
            if (omega == 0) return false;
            let number = new ComplexNumber(0, omega * value / 1000);
            equationDesigner.substitute(element.value, number);
        } else {
            let number = new ComplexNumber(value, 0);
            equationDesigner.substitute(element.value, number);
        }
    }
    return true;
}

function replaceExponents(equation) {
    let match = equation.match(/e-\d+/);
    if(match) {
        let number = match[0].match(/\d+/);
        return replaceExponents(equation.replace(match[0],"\\cdot 10^{-"+ number +"}"))
    } else return equation;
}

function displayCalculation(result) {
    calculationPregresionDiv.appendChild(circuitImage);
    for (let i = 0; i < result.canvases.length; i++) {
        let d = document.createElement("div");

        d.innerHTML = result.messages[i * 2] + "<br> $$" + replaceExponents(result.messages[i * 2 + 1]) + "$$";
        calculationPregresionDiv.appendChild(d);
        calculationPregresionDiv.appendChild(result.canvases[i]);
    }
    MathJax.typeset();
}

function createResultTable(value, Im, Um, S) {
    let sign = value.value.imaginary < 0 ? " " : " + ";
    let table = document.createElement("table");

    let row = table.insertRow();
    row.insertCell().outerHTML = "<th style='width: fit-content;'>Výsledná impedance</th>";
    row = table.insertRow();
    row.insertCell().innerHTML = "<span style='text-decoration: overline'>" + value.name + "</span>[Ω] = " + roundValue(value.value.real) + sign + roundValue(value.value.imaginary) + "j";
    row = table.insertRow();
    row.insertCell().innerHTML = value.name + "[Ω] = " + roundValue(value.value.magnitude);
    row = table.insertRow();
    let cell = row.insertCell();
    cell.style.paddingBottom = "3em";
    cell.innerHTML = "φ<sub>" + value.name + "</sub>[rad] = " + roundValue(value.value.phase);
    row = table.insertRow();

    let mult = omega == 0 ? 1 : Math.SQRT1_2;
    row.insertCell().outerHTML = select.value == "I" ? "<th>Napětí</th>" : "<th>Proud</th>";
    row = table.insertRow();
    row.insertCell().innerHTML = select.value == "I" ? "Um[V] = " + roundValue(Um.magnitude) : "Im[A] = " + roundValue(Im.magnitude);
    row = table.insertRow();
    row.insertCell().innerHTML = select.value == "I" ? "Uef[V] = " + roundValue(Um.magnitude * mult) : "Ief[A] = " + roundValue(Im.magnitude * mult);
    row = table.insertRow();
    cell = row.insertCell();
    cell.style.paddingBottom = "3em";
    cell.innerHTML = select.value == "I" ? "φ<sub>U</sub>[rad] = " + roundValue(Um.phase) : "φ<sub>I</sub>[rad] = " + roundValue(Im.phase);
    row = table.insertRow();   

    row.insertCell().outerHTML = "<th>Výkon</th>";
    row = table.insertRow();
    row.insertCell().innerHTML = "S[VA] = " + roundValue(S.magnitude / 2);
    row = table.insertRow();
    row.insertCell().innerHTML = "P[W] = " + roundValue(S.real / 2);
    row = table.insertRow();
    row.insertCell().innerHTML = "Q[VAr] = " + roundValue(S.imaginary / 2);
    resultDiv.appendChild(table);
}

function calculate() {
    if(!substituteValues()) return;
    worker.postMessage({stop: true, canvasIndex: currentVoltageCanvasId});
    worker.postMessage({stop: true, canvasIndex: powerCanvasId});
    resultDiv.innerHTML = "";
    calculationPregresionDiv.innerHTML = "";
    equationDesigner.resetNames();
    let result = equationDesigner.evaluate();
    displayCalculation(result);
    let value = result.value;
    let Im;
    let Um;
    if (select.value == "I") {
        Im = new ComplexNumber(Number(circuitInput.value).valueOf(), 0);
        Um = Im.multiply(value.value);
    } else {
        Um = new ComplexNumber(Number(circuitInput.value).valueOf(), 0);
        Im = Um.divide(value.value);
    }
    let S = Um.multiply(Im.conjugate());
    createResultTable(value, Im, Um, S);

    canvases.style = "display: block;"
    let dp = omega == 0 ? -Math.PI : Um.phase + Im.phase;
    let am = omega == 0 ? 0 : 61 * Math.cos(dp);
    dp += Math.PI / 2;
    let f = omega == 0 ? 0 : 1;
    worker.postMessage({X: [{amplitude: am, phase: -Math.PI / 2, frequency: 0},{amplitude: (61), phase: dp, frequency: f * 2}], length: 300, drawAndFill: true, canvasIndex: powerCanvasId, axisName: "P[W]"});
    worker.postMessage({functions: [[{amplitude: 61, phase: omega == 0 ? -Math.PI / 2 : -Im.phase, frequency: -f}],[{amplitude: (61), phase: omega == 0 ? -Math.PI / 2 : -Um.phase, frequency: -f}]], length: 300, drawMultiple: true, canvasIndex: currentVoltageCanvasId, axisName: "I[A], U[V]", colors: ["blue", "red"], vectorsName: ["I[A]", "U[V]"]});
    worker.postMessage({synchronize: true, firstIndex: powerCanvasId, secondIndex: currentVoltageCanvasId});
}

function roundValue(value) {
    return Math.round(value * 1000) / 1000;
}

function clear() {
    worker.postMessage({stop: true, canvasIndex: currentVoltageCanvasId});
    worker.postMessage({stop: true, canvasIndex: powerCanvasId});
    canvases.style = "display: none;"
    circuitImageDiv.innerHTML = "";
    circuitInputsDiv.innerHTML = "";
    resultDiv.innerHTML = "";
    calculationPregresionDiv.innerHTML = "";
}

function createRandom() {
    let RIndex = 1;
    let LIndex = 1;
    let CIndex = 1;
    function randomEquation(depth) {
        if (depth == 0) {
            let r = Math.random();
            let element;
            if (r < 0.33) {
                element = "R" + RIndex++;
            } else if(r < 0.7) {
                element = "L" + LIndex++;
            } else {
                element = "C" + CIndex++;
            }
            return element;
        }
        let left = randomEquation(depth-1);
        let right = randomEquation(depth-1);
        r = Math.random();
        if (r < 0.5) {
            r = Math.random();
            if (r < 0.5) return "(" + left + ")|(" + right + ")";
            return left + "|" + right;;
        }
        return left + "_" + right;
    }
    return randomEquation(3);
}

function getAllSelectors() { 
    var ret = [];
    for(var i = 0; i < document.styleSheets.length; i++) {
        var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
        for(var x in rules) {
            if(typeof rules[x].selectorText == 'string') ret.push(rules[x].selectorText);
        }
    }
    return ret;
}

function selectorExists(selector) { 
    var selectors = getAllSelectors();
    for(var i = 0; i < selectors.length; i++) {
        if(selectors[i] == selector) return true;
    }
    return false;
}