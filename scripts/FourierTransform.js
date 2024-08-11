let x = [];
const PI2 = Math.PI * 2;

function addToPath(coordX, coordY) {
    x.push(new ComplexNumber(coordX, coordY));
}

function clearPath() {
    x = [];
}

//X_k = sum_from(n=0)_to(N) x_n * [cos(2*pi*k*n/N) -i*sin(2*pi*k*n/N)]
function calculateDFT() {
    let N = x.length;
    let X = [];
    for (let k = 0; k < N; k++) {
        let X_k = new ComplexNumber(0, 0);
        for (let n = 0; n < N; n++) {
            let angle = PI2 * k * n / N;
            X_k.addTo(x[n].multiply(new ComplexNumber(-angle, 1, true)));
        }
        X_k.divideByConstant(N);
        X_k.recalculate();
        let amp = X_k.magnitude;
        if (amp > 0) {
            X.push({amplitude: amp, phase: X_k.phase, frequency: k});
        }
    }
    X.sort((a, b) => b.amplitude - a.amplitude);
    return X;
}