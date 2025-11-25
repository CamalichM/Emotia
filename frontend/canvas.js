const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let activeFilter = 'all';

// Emotion physics configurations
// Adjust these to change how "heavy" or "energetic" emotions feel
const EMOTIONS = {
    joy: { color: '#ffd700', gravity: -0.05, friction: 0.98, radiusMult: 1.2 },     // Floats up
    sadness: { color: '#1e90ff', gravity: 0.05, friction: 0.95, radiusMult: 1.0 },  // Sinks down
    anger: { color: '#ff4500', gravity: 0, friction: 0.9, radiusMult: 1.1 },        // Fast, vibrating
    fear: { color: '#800080', gravity: 0.02, friction: 0.92, radiusMult: 0.9 },     // Sinks slowly, jitters
    energy: { color: '#00ff00', gravity: -0.02, friction: 0.99, radiusMult: 1.3 },  // Expands outward
    neutral: { color: '#808080', gravity: 0, friction: 0.95, radiusMult: 0.8 }      // Floats neutrally
};

export function initCanvas() {
    resize();
    window.addEventListener('resize', resize);

    // Setup filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Toggle active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Set current filter
            activeFilter = e.target.dataset.emotion;
        });
    });

    animate();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

export function addDataPoint(data) {
    particles.push(new Particle(data));
}

export function clearCanvas() {
    particles = [];
}

class Particle {
    constructor(data) {
        this.data = data;

        // Spawn near center with some spread
        this.x = width / 2 + (Math.random() - 0.5) * 100;
        this.y = height / 2 + (Math.random() - 0.5) * 100;

        // Initial random velocity
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;

        // Apply emotion-specific physics
        const config = EMOTIONS[data.emotion] || EMOTIONS.neutral;
        this.color = config.color;
        this.gravity = config.gravity;
        this.friction = config.friction;
        this.baseRadius = (5 + data.score * 10) * config.radiusMult;
        this.radius = this.baseRadius;
    }

    update() {
        // Apply gravity (up or down depending on emotion)
        this.vy += this.gravity;

        // Apply air resistance
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Add "personality" to movement
        if (this.data.emotion === 'anger') {
            this.x += (Math.random() - 0.5) * 2; // Aggressive jitter
            this.y += (Math.random() - 0.5) * 2;
        } else if (this.data.emotion === 'fear') {
            this.x += (Math.random() - 0.5) * 1; // Nervous shaking
        }

        this.x += this.vx;
        this.y += this.vy;

        // Screen boundaries with energy loss on bounce
        if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.8; }
        if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -0.8; }

        if (this.y < this.radius) { this.y = this.radius; this.vy *= -0.8; }
        if (this.y > height - this.radius) { this.y = height - this.radius; this.vy *= -0.8; }
    }

    draw() {
        // Check if this particle should be visible based on filter
        const isVisible = activeFilter === 'all' || this.data.emotion === activeFilter;
        const targetAlpha = isVisible ? 1.0 : 0.1;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = targetAlpha * 0.8; // Base transparency
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Add glow for high-energy emotions
        if (isVisible && (this.data.emotion === 'joy' || this.data.emotion === 'energy')) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw subtle connections between nearby particles to create a "web" feel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        // Only connect if both are visible enough
        if (activeFilter !== 'all' && p1.data.emotion !== activeFilter) continue;

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];

            // Skip connection if p2 is filtered out
            if (activeFilter !== 'all' && p2.data.emotion !== activeFilter) continue;

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}
