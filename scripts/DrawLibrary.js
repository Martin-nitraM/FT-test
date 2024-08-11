const worker = new Worker(URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], {type: 'text/javascript'})));
function worker_function(){
    class Path {
        constructor(color, width) {
            this.coordinates = [];
            this.color = color;
            this.width = width;
        }
        add(coordinate) {
            this.coordinates.push(coordinate);
        };
        remove(index) {
            this.coordinates.splice(index, 1);
        };
        getLast() {
            return this.coordinates[this.coordinates.length - 1];
        }
        removeFirst() {
            this.remove(0);
        }
        clear() {
            this.coordinates = [];
        }
        draw(context) {
            context.strokeStyle = this.color;
            context.lineWidth = this.width;
            context.beginPath();
            this.coordinates.forEach(coordinate => {
                context.lineTo(coordinate.x, coordinate.y);
            });
            context.stroke();
        }
        fill(context) {
            let yZero = Math.floor(context.canvas.height / 2);
            let negative = false;
            if (this.coordinates[0].y < yZero) negative = true;
            context.beginPath();
            context.moveTo(Math.floor(this.coordinates[0].x), yZero);
            for (var i = 0; i < this.coordinates.length; i++) {
                let isNegative = this.coordinates[i].y < yZero;
                let x = Math.floor(this.coordinates[i].x);
                if (isNegative != negative) {
                    if (negative) {
                        context.fillStyle = "green";
                    } else context.fillStyle = "red";
                    negative = isNegative;
                    context.lineTo(x, yZero);
                    context.closePath();
                    context.fill();
                    context.beginPath();
                    context.moveTo(x, yZero);
                }
                context.lineTo(x, Math.floor(this.coordinates[i].y));
            }
            if (negative) {
                context.fillStyle = "green";
            } else context.fillStyle = "red";
            context.lineTo(Math.floor(this.coordinates[i - 1].x), yZero);
            context.closePath();
            context.fill();
        }
        move() {
            this.coordinates.forEach(coordinate =>{
                coordinate.x--;
            })
        }
    }
    
    class Coordinate {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    class Vector {

        x;
        y;
        offsetX = 0;
        offsetY = 0;

        constructor(amplitude, phase, frequency, oX, oY) {
            this.amplitude = Math.abs(amplitude);
            this.phase = amplitude < 0 ? phase + Math.PI : phase;
            this.angle = this.phase;
            this.frequency = frequency;
            this.originX = oX;
            this.originY = oY;
            this.calculateCoordinates();
        }

        rotate(dt) {
            this.angle += dt * this.frequency;
            this.angle %= PI2;
            this.calculateCoordinates();
        }

        setValues(amplitude, phase, frequency, time) {
            this.amplitude = amplitude;
            this.phase = phase;
            this.angle = phase;
            this.frequency = frequency;
            this.rotate(time);
        }

        calculateCoordinates() {
            this.x = Math.cos(this.angle) * this.amplitude;
            this.y = Math.sin(this.angle) * this.amplitude;
        }

        setOffset(x, y) {
            this.offsetX = x;
            this.offsetY = y;         
        }

        getOriginX() {
            return this.originX;
        }

        getOriginY() {
            return this.originY;
        }

        getX() {
            return this.x + this.offsetX;
        }

        getY() {
            return this.y + this.offsetY;
        }

        draw(context) {
            context.beginPath();
            context.moveTo(this.originX + this.offsetX, this.originY + this.offsetY);
            context.lineTo(this.getX() + this.originX, this.getY() + this.originY);
            context.stroke();
        }

        addVectorToPath(context) {
            if (this.amplitude > 1) {
                context.lineTo(this.getX() + this.originX, this.getY() + this.originY);
            }
            
        }

        addCircleToPath(context) {
            if (this.amplitude > 1) {
                context.moveTo(this.originX + this.offsetX + this.amplitude, this.originY + this.offsetY);
                context.ellipse(this.originX + this.offsetX, this.originY + this.offsetY,this.amplitude, this.amplitude, 0, 0, PI2);
                //context.arc(this.originX + this.offsetX, this.originY + this.offsetY, this.amplitude, 0, PI2);
            }
        }
 
        get origin() {
            return {x: this.originX + this.offsetX, y: this.originY + this.offsetY};
        }

        get end() {
            return {x: this.x + this.offsetX, y: this.y + this.offsetY};
        }

        drawCircle(context) {
            if (this.amplitude > 1) {
                context.beginPath();
                context.arc(this.originX + this.offsetX, this.originY + this.offsetY, this.amplitude, 0, PI2);
                context.stroke();
            }
        }
    }

    class FourierTransform {

        #phases = ["-4π", "-7π/2", "-3π", "-5π/2", "-2π", "-3π/2", "-π", "-π/2", "0", "π/2", "π", "3π/2", "2π", "5π/2", "3π", "7π/2", "4π", "9π/2", "5π", "11π/2", "6π"];

        constructor(length, context, pathColor, pathWidth, periods, canvasWidth, canvasHeight, vectors) {
            this.delayErase = 7;
            this.iteration = 0;
            this.time = 0;
            this.dt = PI2 / length;
            this.periods = periods;
            this.length = length * periods;
            this.vectors = vectors;
            this.context = context;
            this.path = new Path(pathColor, pathWidth);
            this.yAxisPos = 21;
            this.xAxisLength = this.yAxisPos + this.length;
            this.count = vectors.length;
            this.lastVector = vectors[vectors.length - 1];
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.originX = vectors[0].getOriginX();
            this.originY = vectors[0].getOriginY();
            this.xAxisPos = this.originY;
            this.yAxisLength = this.originY * 2;
            this.vectorPath = new Array(vectors.length + 1);
        }

        setFunction(func) {
            this.func = func;
        }

        setAxisName(name) {
            this.axisName = name;
        }

        setVectorsName(name) {
            this.vectorsName = name;
        }

        addVector(amplitude, phase, frequency) {
            let vector = new Vector(amplitude, phase, frequency, this.originX, this.originY);
            vector.rotate(this.time * this.dt);
            this.vectors.push(vector);
            this.count = this.vectors.length;
            this.lastVector = vector;
        }

        removeVector(index) {
            this.vectors.splice(index, 1);
            this.count = this.vectors.length;
            this.lastVector = this.vectors[this.count - 1];
        }

        modifyVector(index, amplitude, phase, frequency) {
            this.vectors[index].setValues(amplitude, phase, frequency, this.time * this.dt);
        }

        clearCanvas() {
            let fill = this.context.fillStyle;
            this.context.fillStyle = "white";
            this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.context.fillStyle = fill;
        }

        drawFunction() {
            this.path.draw(this.context);
            this.context.strokeStyle = "#000777";
            this.context.lineWidth = 1;
            this.context.beginPath();
            this.context.moveTo(this.lastVector.getX() + this.lastVector.getOriginX(), this.lastVector.getY() + this.lastVector.getOriginY());
            this.context.lineTo(this.path.getLast().x, this.path.getLast().y);
            this.context.stroke();
        }

        drawAndFillFunction() {
            this.path.fill(this.context);
            this.path.draw(this.context);
        }

        drawPath() {
            this.path.draw(this.context);
        }

        fillPath() {
            this.path.fill(this.context);
        }

        rotateVectors() {
            this.iteration++;
            this.time++;
            let N = this.vectors.length;
            this.vectors[0].rotate(this.dt);
            for (let i = 1; i < N; i++) {
                this.vectors[i].rotate(this.dt);
                this.vectors[i].setOffset(this.vectors[i-1].getX(), this.vectors[i-1].getY());
            }
        }

        drawVectors() {
            let N = this.vectors.length;
            let c = this.count - 1;

            this.context.strokeStyle = "#707007";
            this.context.lineWidth = 1.7;
            this.context.beginPath();
            this.context.moveTo(this.vectors[0].originX, this.vectors[0].originY);
            for (let i = 0; i < N; i++) {
                if (i > c) break;
                this.vectors[i].addVectorToPath(this.context);
            }
            this.context.stroke();

            this.context.strokeStyle = "#777777";
            this.context.lineWidth = .7;
            this.context.beginPath();
            for (let i = 0; i < N; i++) {
                if (i > c) break;
                this.vectors[i].addCircleToPath(this.context);
            }
            this.context.stroke();
        }

        removeIfLongEnough() {
            if (this.isLongEnough()) {
                this.path.removeFirst();
            }
        }

        removeAndMoveIfLongEnough() {
            if (this.isLongEnough()) {
                this.iteration--;
                if (this.delayErase > 0) this.delayErase--;
                else this.path.removeFirst();
                this.path.move();
            }
        }

        isLongEnough() {
            return this.iteration >= this.length;
        }

        drawAxis() {
            this.context.strokeStyle = "#999999";
            this.context.beginPath();
            this.context.moveTo(0, this.xAxisPos);
            this.context.lineTo(this.xAxisLength, this.xAxisPos);
            this.context.moveTo(this.yAxisPos, 0);
            this.context.lineTo(this.yAxisPos, this.yAxisLength);
            this.context.stroke();
        }

        drawAxisName() {
            this.context.fillStyle = "black";
            this.context.fillText(this.axisName, this.yAxisPos + 7, this.yAxisPos);
        }

        drawVectorsName() {
            this.context.fillStyle = "black";
            this.context.fillText(this.vectorsName, this.originX + 7, this.originY - this.vectors[0].amplitude - 10);
        }

        addLastVectorCoordinateToPath() {
            this.path.add(new Coordinate(this.lastVector.getX() + this.originX, this.lastVector.getY() + this.originY));
        }

        addNewFunctionPointToPath() {
            this.path.add(new Coordinate(21 + this.iteration, this.lastVector.getY() + this.originY));
        }

        setCount(value) {
            if (value < 1) value = 1;
            if (value > this.vectors.length) value = this.vectors.length;
            this.count = value;
            this.lastVector = this.vectors[this.count - 1];
        }

        drawVectorsAndFunction() {
            if (this.vectors === undefined || this.vectors.length === 0) return;
            this.rotateVectors();
            this.drawVectors();
            this.addNewFunctionPointToPath();
            this.drawFunction();
        }

        drawFunctionWithCoordinates() {
            this.drawAxis();
            this.drawCoordinates();
            let time = -this.dt * this.yAxisPos;
            let phase = -this.lastVector.phase;
            let frequency = this.lastVector.frequency;
            let amplitude = this.lastVector.amplitude;
            this.context.strokeStyle = this.path.color;
            this.context.beginPath();
            this.context.moveTo(0, - this.func(phase + time * frequency) * amplitude + this.originY);
            for(let i = 1; i <= this.xAxisLength; i++) {
                time += this.dt;
                this.context.lineTo(i, - this.func(phase + time * frequency) * amplitude + this.originY);
            }
            this.context.stroke();
        }

        #drawLine(startX, startY, endX, endY) {
            this.context.beginPath();
            this.context.moveTo(startX, startY);
            this.context.lineTo(endX, endY);
            this.context.stroke();
        }

        drawCoordinates() {
            let int = this.length / 4 / this.periods;
            let shift = this.yAxisPos;
            for (let i = -8; i < 17; i++) {
                let cx = shift + int * i;
                if (cx < 0 || cx > this.xAxisLength) continue;  
                this.context.fillText(this.#phases[i + 8], cx + 7, this.originY + 21);
                this.#drawLine(cx, this.originY - 7, cx, this.originY + 7);      
            }
        }

        drawUnitCircle() {
            console.log(this.originX);
            this.context.lineWidth = 2.1;
            let amplitude = this.lastVector.amplitude;
            this.context.fillText(this.#phases[8], this.originX + amplitude + 7, this.originY);
            this.context.fillText(this.#phases[9], this.originX - 11, this.originY - amplitude - 7);
            this.context.fillText(this.#phases[10], this.originX - amplitude - 21, this.originY);
            this.context.fillText(this.#phases[11], this.originX - 17, this.originY + amplitude + 21);
            this.context.strokeStyle = "#707007";
            this.lastVector.draw(this.context);
            this.context.strokeStyle = "#777777";
            this.#drawLine(this.originX, this.originY - amplitude, this.originX, this.originY + amplitude);
            this.#drawLine(this.originX - amplitude, this.originY, this.originX + amplitude, this.originY);
            this.lastVector.drawCircle(this.context);          
        }

        drawSineOfPhase() {
            this.#drawLine(this.lastVector.getX() + this.originX, this.lastVector.getY() + this.originY,this.originX, this.lastVector.getY() + this.originY);
            this.context.strokeStyle = "#000fff";
            this.#drawLine(this.originX, this.originY, this.originX ,this.lastVector.getY() + this.originY);
            this.#drawLine(this.yAxisPos, this.originY, this.yAxisPos, this.lastVector.getY() + this.originY);
        }

        drawCosineOfPhase() {
            this.#drawLine(this.lastVector.getX() + this.originX, this.lastVector.getY() + this.originY, this.lastVector.getX() + this.originX, this.originY);
            this.context.strokeStyle = "#000fff";
            this.#drawLine(this.originX, this.originY, this.lastVector.getX() + this.originX, this.originY);
            this.#drawLine(this.yAxisPos, this.originY, this.yAxisPos, this.originY - this.lastVector.getX());
        }
        
    }

    class FourierTransformCache {
        fourierTransforms;
        func;
        initilized = false;
        interval;

        initilize(fourierTransforms, func) {
            this.fourierTransforms = fourierTransforms;
            this.func = func;
            this.initilized = true;
            this.runAnimation = false;
        }

        setFunc(func) {
            this.func = func;
        } 

        start() {
            if (!this.initilized) return;
            if (!this.runAnimation) {
                this.runAnimation = true;
                this.draw();
            }
        }

        draw() {
            if (!this.runAnimation) return;
            this.func(this.fourierTransforms);
            requestAnimationFrame(this.draw.bind(this));
        }

        stop() {
            this.runAnimation = false;
        }

        setVectorCount(count) {
            if (this.fourierTransforms instanceof FourierTransform) this.fourierTransforms.setCount(count);
        }

        addVector(amplitude, phase, frequency) {
            if(this.fourierTransforms instanceof FourierTransform) this.fourierTransforms.addVector(amplitude, phase, frequency);
        }

        removeVector(index) {
            if(this.fourierTransforms instanceof FourierTransform) this.fourierTransforms.removeVector(index);
        }

        modifyVector(index, amplitude, phase, frequency) {
            if(this.fourierTransforms instanceof FourierTransform) this.fourierTransforms.modifyVector(index, amplitude, phase, frequency);
        }
    }

    const PI2 = Math.PI * 2;
    const canvases = [];
    const contexts = [];
    const fourierTransformCache = [];
    const origins = [];
    const imagePath = new Path("#00ffff", 4.3);
    let activeTransform;

    function addCanvas(data) {
        canvases.push(data.canvas);
        let context = data.canvas.getContext("2d", { alpha: false });
        context.font = "17px Arial";
        contexts.push(context);
        origins.push(new Coordinate(data.originX, data.originY));
        fourierTransformCache.push(new FourierTransformCache());
    }

    function createVectors(x, oX, oY) {
        for (let i = 0; i < x.length; i++) {
            let amplitude = x[i].amplitude;
            let phase = x[i].phase;
            let frequency = x[i].frequency;
            x[i] = new Vector(amplitude, phase, frequency, oX, oY);
        }
        console.log(x.length);
    }

    function drawImage(fourierTransform) {
        //drawPath.draw();
        fourierTransform.clearCanvas();
        fourierTransform.rotateVectors();
        fourierTransform.drawVectors();
        fourierTransform.addLastVectorCoordinateToPath();
        fourierTransform.drawPath();
        fourierTransform.removeIfLongEnough();
    }

    function drawPeriodsOfFunction(fourierTransform) {
        fourierTransform.clearCanvas();
        fourierTransform.drawAxis();
        fourierTransform.drawCoordinates();
        fourierTransform.drawVectorsAndFunction();
        if (fourierTransform.isLongEnough()) clearInterval(this.interval);
    }

    function drawAndFillFunction(fourierTransform) {
        fourierTransform.clearCanvas();
        fourierTransform.rotateVectors();
        fourierTransform.addNewFunctionPointToPath()
        fourierTransform.drawAndFillFunction();
        fourierTransform.drawAxis();
        fourierTransform.drawAxisName();
        fourierTransform.removeAndMoveIfLongEnough();
    }

    function drawMultipleFunctions(fourierTransforms) {
        fourierTransforms.functions[0].clearCanvas();
        fourierTransforms.functions[0].drawAxis();
        fourierTransforms.functions[0].drawAxisName();

        for (let i = 0; i < fourierTransforms.functions.length; i++) {
            fourierTransforms.functions[i].drawVectorsAndFunction();
            fourierTransforms.functions[i].drawVectorsName();
            fourierTransforms.functions[i].removeAndMoveIfLongEnough();
        }
        
    }

    function drawThreePhase(fourierTransforms) {
        fourierTransforms.phase1.clearCanvas();

        fourierTransforms.phase1.drawAxis();

        fourierTransforms.phase1.drawVectorsAndFunction();
        fourierTransforms.phase1.removeAndMoveIfLongEnough();

        fourierTransforms.phase2.drawVectorsAndFunction();
        fourierTransforms.phase2.removeAndMoveIfLongEnough();

        fourierTransforms.phase3.drawVectorsAndFunction();
        fourierTransforms.phase3.removeAndMoveIfLongEnough();
    }

    function drawFunctionContinuesly(fourierTransform) {
        fourierTransform.clearCanvas();
        fourierTransform.drawAxis();
        fourierTransform.drawVectorsAndFunction();
        fourierTransform.removeAndMoveIfLongEnough();
    }

    function drawSineOrCosine(sine, data, context, canvas) {
        let periods = 1;
        let oX = data.length * periods + 333;
        let oY = canvas.height / 2;
        let ft = new FourierTransform(data.length, context, "#9AD800", 2.1, periods, canvas.width, canvas.height, [new Vector(data.amplitude, -data.phase, data.frequency, oX, oY)]);
        if (sine) ft.setFunction(Math.sin);
        else ft.setFunction(Math.cos);
        ft.clearCanvas();
        ft.drawUnitCircle();
        ft.drawFunctionWithCoordinates();
        if (sine) ft.drawSineOfPhase();
        else ft.drawCosineOfPhase();
    }

    onmessage = (message) => {
        let data = message.data;
        
        if (data.addCanvas) {
            addCanvas(data);
        } else if (data.setActiveCanvas) {
            activeCanvas = canvases[data.canvasIndex];
            activeContext = contexts[data.canvasIndex];
            if (activeTransform != undefined) activeTransform.stop();
            activeTransform = fourierTransformCache[data.canvasIndex];
            activeTransform.start();
        } else if(data.resume) {
            let ft = fourierTransformCache[data.canvasIndex];
            if (ft) ft.start();
        } else if (data.drawFunction) {
            let ft = fourierTransformCache[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            let oX = data.length * 3 + 201;
            let oY = canvas.height / 2;
            createVectors(data.X, oX, oY);
            let fourierTransform = new FourierTransform(data.length, context, "#9AD800", 2.1, 3, canvas.width, canvas.height, data.X);
            fourierTransform.addNewFunctionPointToPath();
            ft.initilize(fourierTransform, drawFunctionContinuesly);
            ft.start();
        } else if (data.drawPeriods) {
            let ft = fourierTransformCache[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            let oX = data.length * 3 + 201;
            let oY = canvas.height / 2;
            createVectors(data.X, oX, oY);
            let fourierTransform = new FourierTransform(data.length, context, "#9AD800", 2.1, 3, canvas.width, canvas.height, data.X);
            fourierTransform.addNewFunctionPointToPath();
            ft.initilize(fourierTransform, drawPeriodsOfFunction);
            ft.start();
        } else if (data.drawAndFill){
            let ft = fourierTransformCache[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            let periods = 1.7;
            let oX = data.length * periods + 111;
            let oY = canvas.height / 2;
            createVectors(data.X, oX, oY);
            let fourierTransform = new FourierTransform(data.length, context, "#000000", 2.7, periods, canvas.width, canvas.height, data.X);
            fourierTransform.setAxisName(data.axisName);
            fourierTransform.addNewFunctionPointToPath();
            ft.initilize(fourierTransform, drawAndFillFunction);
            ft.start();
        }
         else if (data.drawSine) {
            drawSineOrCosine(true, data, contexts[data.canvasIndex], canvases[data.canvasIndex]);
        } else if (data.drawCosine) {
            drawSineOrCosine(false, data, contexts[data.canvasIndex], canvases[data.canvasIndex]);
        } else if (data.drawThreePhase) {
            let ft = fourierTransformCache[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            let periods = 1.7;
            let oX = data.length * periods + 111;
            let oY = canvas.height / 2;
            let phase1 = new FourierTransform(data.length, context, "#ff0000", 2.7, periods, canvas.width, canvas.height, [new Vector(61, 0, -1, oX, oY)]);
            let phase2 = new FourierTransform(data.length, context, "#00ff00", 2.7, periods, canvas.width, canvas.height, [new Vector(61, PI2 / 3, -1, oX + 173, oY)]);
            let phase3 = new FourierTransform(data.length, context, "#0000ff", 2.7, periods, canvas.width, canvas.height, [new Vector(61, PI2 / 3 * 2, -1, oX + 347, oY)]);
            ft.initilize({phase1: phase1, phase2: phase2, phase3: phase3}, drawThreePhase);
            ft.start();
        } else if(data.drawMultiple) {
            let ft = fourierTransformCache[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            let periods = 1.7;
            let oX = data.length * periods + 111;
            let oY = canvas.height / 2;
            let transforms = new Array(data.functions.length);
            for (let i = 0; i < transforms.length; i++) {
                createVectors(data.functions[i], oX, oY);
                transforms[i] = new FourierTransform(data.length, context, data.colors[i], 2.7, periods, canvas.width, canvas.height, data.functions[i]);
                transforms[i].setAxisName(data.axisName);
                transforms[i].setVectorsName(data.vectorsName[i]);
                oX += 173;
            }
            ft.initilize({functions: transforms}, drawMultipleFunctions);
            ft.start();
        } else if (data.drawPath) {
            let context = contexts[data.canvasIndex];
            let canvas = canvases[data.canvasIndex];
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            imagePath.add(new Coordinate(data.posX, data.posY));
            imagePath.draw(context);
        } else if (data.drawImage) {
            let canvas = canvases[data.canvasIndex];
            let context = contexts[data.canvasIndex];
            let ft = fourierTransformCache[data.canvasIndex];
            createVectors(data.X, canvas.width / 2, canvas.height / 2);
            let fourierTransform = new FourierTransform(data.length, context, "#9AD800", 2.1, 0.97, canvas.width, canvas.height, data.X);
            ft.initilize(fourierTransform, drawImage);
            ft.start();
        } else if(data.synchronize) {
            let ft1 = fourierTransformCache[data.firstIndex];
            let ft2 = fourierTransformCache[data.secondIndex];
            ft1.stop();
            ft2.stop();
            let newFunc = (fourierTransforms)=>{
                fourierTransforms[0].func(fourierTransforms[0].fourierTransforms);
                fourierTransforms[1].func(fourierTransforms[1].fourierTransforms);
            }
            let ft = new FourierTransformCache();
            fourierTransformCache[data.firstIndex] = ft;
            fourierTransformCache[data.secondIndex] = ft;
            ft.initilize([ft1, ft2], newFunc);
            ft.start();
        } 
        else if (data.stop) {
            fourierTransformCache[data.canvasIndex].stop();
            fourierTransformCache[data.canvasIndex] = new FourierTransformCache();
            imagePath.clear();
        } else if (data.setCount) {
            fourierTransformCache[data.canvasIndex].setVectorCount(data.count);
        } else if (data.addVector) {
            fourierTransformCache[data.canvasIndex].addVector(data.amplitude, data.phase, data.frequency);
        } else if (data.removeVector) {
            fourierTransformCache[data.canvasIndex].removeVector(data.index);
        } else if (data.modifyVector) {
            fourierTransformCache[data.canvasIndex].modifyVector(data.index, data.amplitude, data.phase, data.frequency);
        }
    };
}

let currentCanvasIndex = 0;
function addCanvas(canvasId) {
    let htmlCanvas = window.document.getElementById(canvasId);
    let canvas = htmlCanvas.transferControlToOffscreen();
    worker.postMessage({canvas: canvas, addCanvas: true}, [canvas]);
    return currentCanvasIndex++;
}

function activateFunctionCanvas(canvasIndex, X, length) {
    worker.postMessage({X: X, length: length, drawFunction: true, canvasIndex: canvasIndex});
}

function activateImageCanvas(canvasIndex, X, length) {
    worker.postMessage({X: X, length: length, drawImage: true, canvasIndex: canvasIndex});
}

function setVectorsCount(count, index, element) {
    count = Math.round(Number(count));
    if (element) element.value = count;
    worker.postMessage({setCount: true, count: count, canvasIndex: index});
}

function stopCanvas(canvasIndex) {
    worker.postMessage({stop: true, canvasIndex: canvasIndex});
}

function drawPath(canvasIndex, posX, posY) {
    worker.postMessage({drawPath: true, posX: posX, posY: posY, canvasIndex: canvasIndex});
}

function Draw() {
    console.log("maluj");
}