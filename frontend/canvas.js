const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

export function initCanvas() {
    resize();
    window.addEventListener('resize', resize);
    animate();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

export function addDataPoint(data) {
    particles.push(new Particle(data));
}

export function resetParticles() {
    particles = [];
}

class Particle {
    constructor(data) {
        this.data = data;
        this.x = width / 2;
        this.y = height / 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 6 + data.score * 12;
        this.color = getEmotionColor(data.emotion);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Simple bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

function getEmotionColor(emotion) {
    switch (emotion) {
        case 'joy':
            return '#ffd700';
        case 'sadness':
            return '#1e90ff';
        case 'anger':
            return '#ff4500';
        case 'energy':
            return '#00e0a4';
        case 'fear':
            return '#800080';
        default:
            return '#808080';
    }
}
