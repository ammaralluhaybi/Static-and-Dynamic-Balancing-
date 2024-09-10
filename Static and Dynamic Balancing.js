document.addEventListener('DOMContentLoaded', () => {
    const numMassesSelect = document.getElementById('num_masses');
    const massInputsDiv = document.getElementById('mass_inputs');
    const rotateButton = document.getElementById('rotate_button');
    const resetButton = document.getElementById('reset_button');
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const shaftLength = 0.5; // Shaft length in meters (given in the image)
    const shaftPixels = 600 * shaftLength; // Convert shaft length to pixels for canvas drawing
    const shaftXStart = 100;
    const shaftY = canvas.height / 2;

    const angularVelocity = 20; // Angular velocity in rad/s (given in the image)
    const gravity = 9.81; // Gravitational acceleration in m/s²

    let rotationAngle = 0;
    let rotationSpeed = angularVelocity / 60; // Convert angular velocity to speed in radians per frame
    let animationFrameId;

    function generateMassInputs(num) {
        massInputsDiv.innerHTML = '';
        for (let i = 1; i <= num; i++) {
            const massSection = document.createElement('div');
            massSection.classList.add('mass-section');

            massSection.innerHTML = `
                <h3>Mass ${i}:</h3>
                <label for="mass${i}_value">Mass (kg):</label>
                <input type="number" id="mass${i}_value" min="0.1" step="0.1" value="1">

                <label for="mass${i}_radius">Radius (m):</label>
                <input type="number" id="mass${i}_radius" min="0.1" step="0.1" value="0.2">

                <label for="mass${i}_angle">Angle (°):</label>
                <input type="number" id="mass${i}_angle" min="0" max="360" step="1" value="${(i - 1) * 90}">

                <label for="mass${i}_position">Axial Position (m):</label>
                <input type="number" id="mass${i}_position" min="0" max="2" step="0.1" value="${(i - 1) * 0.5}">
            `;
            massInputsDiv.appendChild(massSection);
        }
    }

    function drawShaft() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(shaftXStart, shaftY);
        ctx.lineTo(shaftXStart + shaftPixels, shaftY);
        ctx.stroke();

        // Draw supports
        ctx.fillStyle = '#888';
        ctx.fillRect(shaftXStart - 20, shaftY - 30, 40, 60);
        ctx.fillRect(shaftXStart + shaftPixels - 20, shaftY - 30, 40, 60);
    }

    function drawMasses(masses) {
        masses.forEach((mass, index) => {
            const { radius, angle, position } = mass;
            const xPos = shaftXStart + (position / 2) * shaftPixels;
            const totalAngleRad = ((angle + rotationAngle) * Math.PI) / 180;

            // Mass position is vertically mounted to the shaft (it moves up and down)
            const massX = xPos;
            const massY = shaftY + radius * 100 * Math.sin(totalAngleRad);  // Vertically move mass up/down

            // Draw the mass as a rectangular block
            const blockWidth = 20; // Make the width smaller for vertical alignment
            const blockHeight = 60; // Taller height to show vertical block
            ctx.save();
            ctx.fillStyle = getMassColor(index);
            ctx.fillRect(massX - blockWidth / 2, massY - blockHeight / 2, blockWidth, blockHeight);
            ctx.restore();

            // Draw the circular disk centered on the rectangular block
            const diskRadius = 15;
            ctx.beginPath();
            ctx.arc(massX, massY, diskRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();
        });
    }

    function getMassColor(index) {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
        return colors[index % colors.length];
    }

    function calculateBalance(masses) {
        let sumFx = 0;
        let sumFy = 0;
        let sumMx = 0;
        let sumMy = 0;

        masses.forEach(mass => {
            const { massValue, radius, angle, position } = mass;
            const angleRad = ((angle + rotationAngle) * Math.PI) / 180;
            const force = massValue * radius;
            sumFx += force * Math.cos(angleRad);
            sumFy += force * Math.sin(angleRad);
            sumMx += force * position * Math.cos(angleRad);
            sumMy += force * position * Math.sin(angleRad);
        });

        const isStaticallyBalanced = Math.abs(sumFx) < 0.01 && Math.abs(sumFy) < 0.01;
        const isDynamicallyBalanced = isStaticallyBalanced && Math.abs(sumMx) < 0.01 && Math.abs(sumMy) < 0.01;

        return {
            sumFx: sumFx.toFixed(3),
            sumFy: sumFy.toFixed(3),
            sumMx: sumMx.toFixed(3),
            sumMy: sumMy.toFixed(3),
            isStaticallyBalanced,
            isDynamicallyBalanced
        };
    }

    function displayResults(results) {
        resultsDiv.innerHTML = `
            <h2>Results:</h2>
            <p>Sum of Forces in X-direction: ${results.sumFx} N</p>
            <p>Sum of Forces in Y-direction: ${results.sumFy} N</p>
            <p>Sum of Moments about X-axis: ${results.sumMx} Nm</p>
            <p>Sum of Moments about Y-axis: ${results.sumMy} Nm</p>
            <p>Static Balance: <span class="${results.isStaticallyBalanced ? 'result-balanced' : 'result-unbalanced'}">${results.isStaticallyBalanced ? 'Balanced' : 'Unbalanced'}</span></p>
            <p>Dynamic Balance: <span class="${results.isDynamicallyBalanced ? 'result-balanced' : 'result-unbalanced'}">${results.isDynamicallyBalanced ? 'Balanced' : 'Unbalanced'}</span></p>
        `;
    }

    function collectMassData(num) {
        const masses = [];
        for (let i = 1; i <= num; i++) {
            const massValue = parseFloat(document.getElementById(`mass${i}_value`).value);
            const radius = parseFloat(document.getElementById(`mass${i}_radius`).value);
            const angle = parseFloat(document.getElementById(`mass${i}_angle`).value);
            const position = parseFloat(document.getElementById(`mass${i}_position`).value);
            masses.push({ massValue, radius, angle, position });
        }
        return masses;
    }

    function animate() {
        rotationAngle += rotationSpeed;
        const num = parseInt(numMassesSelect.value);
        const masses = collectMassData(num);
        drawShaft();
        drawMasses(masses);
        const results = calculateBalance(masses);
        displayResults(results);
        animationFrameId = requestAnimationFrame(animate);
    }

    function toggleAnimation() {
        if (animationFrameId) {
            // Stop the animation
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            rotateButton.textContent = 'Rotate';
        } else {
            // Start the animation
            animate();
            rotateButton.textContent = 'Stop';
        }
    }

    function resetSimulation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        rotationAngle = 0;
        rotateButton.textContent = 'Rotate';
        generateMassInputs(parseInt(numMassesSelect.value));
        drawShaft();
        resultsDiv.innerHTML = '';
    }

    // Event Listeners
    numMassesSelect.addEventListener('change', () => {
        generateMassInputs(parseInt(numMassesSelect.value));
    });

    rotateButton.addEventListener('click', toggleAnimation);
    resetButton.addEventListener('click', resetSimulation);

    // Initialize
    generateMassInputs(4);
    drawShaft();
});
