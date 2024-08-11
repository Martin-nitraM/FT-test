class ComplexNumber {
    constructor(real, imaginary, exp) {
        if (exp) {
            this.phase = real;
            this.magnitude = imaginary;
            this.real = Math.cos(this.phase) * this.magnitude;
            this.imaginary = Math.sin(this.phase) * this.magnitude;
        } else {
            this.real = real;
            this.imaginary = imaginary;
            this.phase = Math.atan2(this.imaginary, this.real);
            this.magnitude = Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
        }
    }

    conjugate() {
        return new ComplexNumber(this.real, - this.imaginary);
    }

    add(other) {
        return new ComplexNumber(this.real + other.real, this.imaginary + other.imaginary);
    }

    subtract(other) {
        return new ComplexNumber(this.real - other.real, this.imaginary - other.imaginary);
    }

    addTo(other) {
        this.real += other.real;
        this.imaginary += other.imaginary;
    }

    subtractFrom(other) {
        this.real -= other.real;
        this.imaginary -= other.imaginary;
    }

    multiply(other) {
        return new ComplexNumber(this.real * other.real - this.imaginary * other.imaginary, this.imaginary * other.real + other.imaginary * this.real);
    }
    recalculate() {
        this.phase = Math.atan2(this.imaginary, this.real);
        this.magnitude = Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
    }

    divideByConstant(number) {
        this.real /= number;
        this.imaginary /= number;
    }

    multiplyByConstant(number) {
        this.real *= number;
        this.imaginary *= number;
    }

    divide(other) {
        let numeraterReal = other.real * this.real - other.imaginary * this.imaginary;
        let numeraterImaginary = other.real * this.imaginary - other.imaginary * this.real;
        let denominator = other.real * other.real + other.imaginary * other.imaginary;
        if (denominator == 0) return null;
        return new ComplexNumber(numeraterReal / denominator, numeraterImaginary / denominator);
    }

    divideExp(other) {
        if (other.magnitude == 0) return;
        let magnitude = this.magnitude / other.magnitude;
        let phase = this.phase - other.phase;
        return new ComplexNumber(phase, magnitude, true);
    }

    phaseToDegrees() {
        return this.phase / Math.PI * 180;
    }

    inverse() {
        if (this.real == 0 && this.imaginary == 0) return 0;
        return new ComplexNumber(1, 0).divide(this);
    }

    round(value) {
        return Math.round(value * 1000000000) / 1000000000;
    }

    toString() {
        let r = this.round(this.real);
        let i = this.round(this.imaginary);
        if (r == 0) {
            if (i < 0) {
                return "("+i+"j)";
            } 
            return i + "j";
        } else {
            if (r < 0) {
                if (i == 0) {
                    return "(" + r + ")";
                } else if (this.imaginary < 0) {
                    return "(" + r + "" + i + "j)"
                }
                return "(" + r + "+" + i + "j)"
            }
            if (i == 0) {
                return r;
            } else if (i < 0) {
                return r + "" + i + "j"
            }
            return r + "+" + i + "j"
        }
    }

    static parse(string) {
        if (string instanceof ComplexNumber) return string;
        let match = string.match(/[+|-]?([0-9]*[.])?[0-9]*(?=[i|j])[i|j](?<=[i|j])([0-9]*[.])?[0-9]*/);
        let imaginary = match == undefined ? 0 : match[0].replace(/[i|j]/,"");
        let real = string.replace(/[+|-]?([0-9]*[.])?[0-9]*(?=[i|j])[i|j](?<=[i|j])([0-9]*[.])?[0-9]*/,"");
        return new ComplexNumber(new Number(real).valueOf(), new Number(imaginary).valueOf());
    }
}