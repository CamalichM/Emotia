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

class Particle {
    constructor(data) {
        this.data = data;
        this.x = width / 2;
        this.y = height / 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 5 + data.score * 10;

        // Color based on emotion
        switch (data.emotion) {
            case 'joy': this.color = '#ffd700'; break;
            case 'sadness': this.color = '#1e90ff'; break;
            case 'anger': this.color = '#ff4500'; break;
            default: this.color = '#808080';
        }
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
