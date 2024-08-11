class Equation {
    constructor(equation) {
        this.equation = equation;
        this.node = this.convertToTree(this.equation);
    }

    convertToTree(equation) {
        let node = new EquationNode("");
        for (let i = 0; i < equation.length; i++) {
            let currentNode = new EquationNode(equation[i]);
            if (currentNode.isSpace()) continue;
            if (currentNode.isOperator()) {
                currentNode.setChildren(node, new Equation(equation.slice(i + 1)).node);
                return currentNode;
            } else if (currentNode.isOpeningBracket()) {
                let k = i;
                let j = 1;
                while(j != 0) {
                    if (k > equation.length) return;
                    let testNode = new EquationNode(equation[++k]);
                    if (testNode.isClosingBracket()) j--;
                    else if (testNode.isOpeningBracket()) j++;
                }
                let partialEquation = equation.substr(i + 1, k - i - 1);
                let newNode = new Equation(partialEquation).node;
                if (!node.isEmpty()) newNode.setFunction(node);
                node = newNode;
                node.brackets();
                i = k;
                continue;
            } 
            node.add(currentNode);
        }
        return node;
    }

    toString() {
        return this.node.toString();
    }

    convertToList(node) {
        let nodes = [];
        if (node.isInBrackets || node.isLeaf()) {
            var serials = [node];
        } else {
            node.left.paralel = false;
            var serials = [node.left];
        }
        while(node && node.left && !node.isInBrackets) {
            let right = node.right;
            let push = !right.left || right.isInBrackets ? right : right.left;
            if (node.value == "|") {
                push.paralel = true;
                serials.push(push);
            }
            else if (node.value == "_") {
                //if (serials.length == 1 && !serials[0].isInBrackets) serials = serials[0];
                nodes.push(serials);
                serials = [];
                push.paralel = false;
                serials.push(push);
            }
            node = node.right;
        }
        //if (serials.length == 1 && !serials[0].isInBrackets) serials = serials[0];
        nodes.push(serials);
        for (let i = 0; i < nodes.length; i++) {
            for (let j = 0; j < nodes[i].length; j++) {
                if (nodes[i][j].isInBrackets && !nodes[i][j].isLeaf()){ 
                    let paralel = nodes[i][j].paralel;
                    nodes[i][j].isInBrackets = false;
                    nodes[i][j] = this.convertToList(nodes[i][j]);
                    nodes[i][j].paralel = paralel;
                }
            }
            if (nodes[i].length == 1) nodes[i] = nodes[i][0];
        }
        if (nodes.length == 1) nodes = nodes[0];
        return nodes;
    }
}

class EquationNode {
    constructor(value) {
        this.value = value;
    }

    replace(other) {
        this.value = other.value;
        this.left = other.left;
        this.right = other.right;
        this.func = other.func;
        this.isInBrackets = other.isInBrackets;
    }

    copy() {
        let copy = new EquationNode(this.value);
        if (!this.isLeaf()) {
            copy.setChildren(this.left.copy(), this.right.copy())
        }
        copy.func = this.func;
        copy.isInBrackets = this.isInBrackets;
        return copy;
    }

    removeUselessBrackets() {
        if (this.isLeaf()) return;
        if (this.value == this.right.value) this.isInBrackets = false;

    }

    brackets() {
        this.isInBrackets = true;
    }

    setFunction(node) {
        this.func = node.value;
    }

    isLeaf() {
        return this.left == undefined;
    }

    add(node) {
        this.value += node.value;
    }

    setChildren(left, right) {
        this.left = left;
        this.right = right;
    }

    isEmpty() {
        return this.value == "";
    }

    isOperator() {
        return this.value == "+" || this.value == "-" || this.value == "*" || this.value == "/" || this.value == "^" || this.value == "|" || this.value == "_";
    }

    isOpeningBracket() {
        return this.value == "(" || this.value == "{" || this.value == "[";
    }
    
    isClosingBracket() {
        return this.value == ")" || this.value == "}" || this.value == "]";
    }

    isSpace() {
        return this.value == " ";
    }

    getClosingBracket() {
        if (this.value == "(") return ")";
        if (this.value == "{") return "}";
        if (this.value == "[") return "]";
    }

    toString() {
        if (this.isLeaf()) {
            if (this.isInBrackets) return "(" + this.value + ")";
            return this.value;
        }
        if (this.func) {
            return this.func + "(" + this.left.toString() + this.value + this.right.toString() + ")";
        }
        if (this.isInBrackets) {
            return "(" + this.left.toString() + this.value + this.right.toString() + ")";
        }
        return this.left.toString() + this.value + this.right.toString();
    }
}
