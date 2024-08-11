class EquationDesigner{
    constructor(elementWidth, elementHeight) {
        this.width = elementWidth;
        this.height = elementHeight;
        this.substituteValues = [];
        this.capacitorImage = this.createCapacitorImage(this.width, this.height);
        this.inductorImage = this.createInductorImage(this.width, this.height);
        this.impedanceImage = this.createImpedanceImage(this.width, this.height);
        this.startImage = this.createStartImage(this.width, this.height);
        this.endImage = this.createEndImage(this.width, this.height);
        this.set = new Set();
        this.nameIndex = 1;
    }

    setEquation(string) {
        this.equation = new Equation(string);
        this.set.clear();
        this.fillSet(this.equation.node);
        this.resetNames();
    }

    resetNames() {
        this.nameIndex = 1;
        this.nameSet = new Set(this.set.values());
    }

    fillSet(node) {
        if (node.isLeaf()) {
            this.set.add(node.value);
        } else {
            this.fillSet(node.left);
            this.fillSet(node.right);
        }
    }

    substitute(before, after) {
        this.substituteValues[before] = ComplexNumber.parse(after);
    }

    getImage(value) {
        if (value[0] == "c" || value[0] == "C") return this.capacitorImage;
        if (value[0] == "l" || value[0] == "L") return this.inductorImage;
        return this.impedanceImage;
    }
    
    createStartImage(width, height) {
        let d = width / 5;
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext("2d");
        context.beginPath()
        context.moveTo(width, height / 2);
        context.lineTo(width - d, height / 2);
        context.stroke();
        context.beginPath();
        context.arc(width - d * 3 / 2, height / 2, d / 2, 0, Math.PI * 2);
        context.stroke();
        return canvas;
    }

    createEndImage(width, height) {
        let d = width / 5;
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext("2d");
        context.beginPath()
        context.moveTo(0, height / 2);
        context.lineTo(d, height / 2);
        context.stroke();
        context.beginPath();
        context.arc(d * 3 / 2, height / 2, d / 2, 0, Math.PI * 2);
        context.stroke();
        return canvas;
    }

    createCapacitorImage(width, height) {
        let d1 = width / 17;
        let d2 = height / 3;
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext("2d");
        context.beginPath();
        context.moveTo(0, height / 2);
        context.lineTo(width / 2 - d1, height / 2);
        context.stroke();
        context.beginPath();
        context.moveTo(width / 2 - d1, d2);
        context.lineTo(width / 2 - d1, height - d2);
        context.stroke();
        context.beginPath();
        context.moveTo(width, height / 2);
        context.lineTo(width / 2 + d1, height / 2);
        context.stroke();
        context.beginPath();
        context.moveTo(width / 2 + d1, d2);
        context.lineTo(width / 2 + d1, height - d2);
        context.stroke();
        return canvas;
    }

    createInductorImage(width, height) {
        let d = width / 5;
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext("2d");
        context.beginPath();
        context.moveTo(0, height / 2);
        context.lineTo(d, height / 2);
        context.stroke();
        context.beginPath();
        context.arc(d * 1.5, height / 2, d / 2, 0, Math.PI, true);
        context.stroke();
        context.beginPath();
        context.arc(d * 2.5, height / 2, d / 2, 0, Math.PI, true);
        context.stroke();
        context.beginPath();
        context.arc(d * 3.5, height / 2, d / 2, 0, Math.PI, true);
        context.stroke();
        context.beginPath();
        context.moveTo(d * 4, height / 2);
        context.lineTo(width, height / 2);
        context.stroke();
        return canvas;
    }

    createImpedanceImage(width, height) {
        let d = width / 5;
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext("2d");
        context.moveTo(0, height / 2);
        context.lineTo(d, height / 2);
        context.moveTo(d * 4, height / 2);
        context.lineTo(width, height / 2);
        context.stroke();
        context.strokeRect(d, (height - d) / 2, d * 3, d);
        return canvas;
    }

    evaluate() {
        let node = this.equation.node.copy();
        let list = this.equation.convertToList(node);
        let canvases = [];
        let messages = [];
        let value = this.evaluateRecursive(list, list, canvases, messages);
        return {value: value, canvases: canvases, messages: messages};
    }

    evaluateRecursive(node, list, canvases, messages) {
        if (node instanceof EquationNode) {
            let name = node.value;
            let value = this.substituteValues[node.value];
            return {value: value, name: name};
        } else {
            if (node instanceof Array) {
                if (node[node.length - 1].paralel) {
                    return this.evaluateParalel(node, list, canvases, messages);
                } else {
                    return this.evaluateSerial(node, list, canvases, messages);
                }
            }
        }
    }

    getName() {
        let name = "Z" + this.nameIndex;
        while(this.nameSet.has(name)) {
            name = "Z" + (++this.nameIndex);
        }
        this.nameSet.add(name);
        return name;
    }

    getFrac(numerator, denominator) {
        return "\\frac{" + numerator + "}{" + denominator + "}";
    }

    evaluateParalel(node, list, canvases, messages) {
        let res = this.evaluateRecursive(node[0], list, canvases, messages);
        let message = res.name;
        let equ1 = this.getFrac("1", res.name);
        let equ2 = this.getFrac("1", res.value.toString());
        for (let i = 1; i < node.length; i++) {
            let cRes = this.evaluateRecursive(node[i], list, canvases, messages);
            res.value = res.value.inverse().add(cRes.value.inverse()).inverse();
            message += ", "+ cRes.name;
            equ1 += "+" + this.getFrac("1", cRes.name);
            equ2 += "+" + this.getFrac("1", cRes.value.toString());
        }
        let name = this.getName();
        let equ = 
                name + "=" + this.getFrac("1",equ1) + "$$<br>$$" + 
                name + "=" + this.getFrac("1",equ2) + "$$<br>$$" + 
                name + "=" + this.getFrac("1", res.value.inverse().toString()) + "$$<br>$$" + 
                name +"=" + res.value.toString();
        messages.push("Výpočet paralelního spojení impedancí " + message + " do impedance " + name);
        messages.push(equ);
        node.length = 1;
        node[0] = new EquationNode(name);
        canvases.push(this.drawList(list));
        res.name = name;
        return res;
    }

    evaluateSerial(node, list, canvases, messages) {
        let res = this.evaluateRecursive(node[0], list, canvases, messages);
        let message = res.name;
        let equ1 = res.name;
        let equ2 = res.value.toString();
        for (let i = 1; i < node.length; i++) {
            let cRes = this.evaluateRecursive(node[i], list, canvases, messages);
            res.value = res.value.add(cRes.value);
            message += ", "+ cRes.name;
            equ1 += "+" + cRes.name;
            equ2 += "+" + cRes.value.toString();
        }
        let name = this.getName();
        let equ = 
                    name + "=" + equ1 + "$$<br>$$" + 
                    name + "=" + equ2 + "$$<br>$$" + 
                    name + "=" + res.value.toString();
        messages.push("Výpočet sériového spojení impedancí " + message + " do impedance " + name);
        messages.push(equ);
        node.length = 1;
        node[0] = new EquationNode(name);
        canvases.push(this.drawList(list));
        res.name = name;
        return res;
    }

    draw() {
        let node = this.equation.node.copy();
        let list = this.equation.convertToList(node);
        if (list instanceof EquationNode) {
            list = [list];
            list.paralel = false;
        }
        return this.drawList(list);
    }

    drawList(list) {
        let canvas = document.createElement("canvas");
        let w = this.getWidth(list);
        canvas.width = w + this.width * 2;
        canvas.height = this.getHeight(list);
        let context = canvas.getContext("2d");
        context.font = Math.round(this.height / 5) + "px Arial";
        context.textAlign = "center";
        this.points = [];
        context.drawImage(this.startImage, 0, 0);
        this.drawRecursive(context, list, this.width, 0);
        context.drawImage(this.endImage, w + this.width, 0);
        context.beginPath();
        for (let i = 0; i < this.points.length; i+=2) {
            context.moveTo(this.points[i][0], this.points[i][1]);
            context.lineTo(this.points[i+1][0], this.points[i+1][1]);
        }
        context.stroke();
        return canvas;
    }

    drawRecursive(context, list, x, y) {
        let paralel = list[list.length -1].paralel;
        let startX = x;
        let startY = y + this.height / 2;
        for (let i = 0; i < list.length; i++) {
            if (list[i] instanceof EquationNode) {
                let image = this.getImage(list[i].value);
                context.drawImage(image, x, y);
                context.strokeText(list[i].value, x + this.width / 2, y + this.height / 5);
            } else {
                this.drawRecursive(context, list[i], x, y);
            }
            if (i < list.length - 1) {
                if (paralel) {
                    this.points.push([x, y + this.height / 2]);
                    y += this.getHeight(list[i]);
                    this.points.push([x, y + this.height / 2]);
                } else {
                    x += this.getWidth(list[i]);
                }
            }
        }
        if (paralel) {
            let maxWidth = 0;
            let widths = new Array(list.length);
            for (let i = 0; i < list.length; i++) {
                let width = this.getWidth(list[i]);
                widths[i] = width;
                if (maxWidth < width) maxWidth = width;
            }
            if (widths[0] != maxWidth) {
                this.points.push([startX + maxWidth, startY]);
                this.points.push([startX + widths[0], startY]);
            }
            for (let i = 1; i < list.length; i++) {
                let height = this.getHeight(list[i - 1]);
                this.points.push([startX + maxWidth, startY]);
                startY += height;
                this.points.push([startX + maxWidth, startY]);
                if (widths[i] != maxWidth) {
                    this.points.push([startX + maxWidth, startY]);
                    this.points.push([startX + widths[i], startY]);
                }   
            }
        }
    }

    getWidth(list) {
        if (list instanceof EquationNode) return this.width;
        let paralel = list[list.length - 1].paralel;
        if (paralel) {
            let width = 0;
            list.forEach(element => {
                let cWidth = this.getWidth(element);
                if (width < cWidth) width = cWidth;
            });
            return width;
        }
        let width = 0;
        list.forEach(element => {
            width += this.getWidth(element);
        });
        return width;
    }

    getHeight(list) {
        if (list instanceof EquationNode) return this.height;
        let paralel = list[list.length - 1].paralel;
        if (paralel) {
            let height = 0;
            list.forEach(element => {
                height += this.getHeight(element);
            });
            return height;
        }
        let height = 0;
        list.forEach(element => {
            let cHeight = this.getHeight(element);
            if (height < cHeight) height = cHeight;
        });
        return height;
    }
}
let m = () => {
    let mm = document.getElementById(String.fromCharCode(99, 111, 112, 121));
    if (mm == null || !selectorExists(String.fromCharCode(46, 67, 111, 112, 121, 82, 105, 103, 104, 116))) return false;
    mm.innerHTML = String.fromCharCode(65, 117, 116, 111, 114, 58, 32, 77, 97, 114, 116, 105, 110, 32, 86, 46);
    mm.className = String.fromCharCode(67, 111, 112, 121, 82, 105, 103, 104, 116);
    return true;
}
