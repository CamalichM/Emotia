const canvas = document.getElementById('gravityCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

let width, height;
let particles = [];
let hoveredParticle = null;
let activeFilter = 'all';
let mouse = { x: -1000, y: -1000 }; // Start off-screen

// Emotion physics configurations
const EMOTIONS = {
    joy: { color: '#ffd700', gravity: -0.05, friction: 0.98, radiusMult: 1.2, interaction: 'attract' },
    sadness: { color: '#1e90ff', gravity: 0.05, friction: 0.95, radiusMult: 1.0, interaction: 'repel' },
    anger: { color: '#ff4500', gravity: 0, friction: 0.9, radiusMult: 1.1, interaction: 'agitate' },
    fear: { color: '#9d00ff', gravity: 0.02, friction: 0.92, radiusMult: 0.9, interaction: 'flee' },
    energy: { color: '#00ff00', gravity: -0.02, friction: 0.99, radiusMult: 1.3, interaction: 'orbit' },
    neutral: { color: '#808080', gravity: 0, friction: 0.95, radiusMult: 0.8, interaction: 'nudge' }
};

export function initCanvas() {
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking for "Magnetic Field" effect
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Filter logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
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
        this.x = width / 2 + (Math.random() - 0.5) * 200;
        this.y = height / 2 + (Math.random() - 0.5) * 200;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;

        const config = EMOTIONS[data.emotion] || EMOTIONS.neutral;
        this.config = config;
        this.color = config.color;
        this.baseRadius = (4 + data.score * 8) * config.radiusMult;
        this.radius = this.baseRadius;
    }

    update() {
        // 1. Base Physics (Gravity & Friction)
        this.vy += this.config.gravity;
        this.vx *= this.config.friction;
        this.vy *= this.config.friction;

        // 2. Mouse Interaction (The "Innovation")
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 300; // Interaction radius

        if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist; // 0 to 1 strength

            switch (this.config.interaction) {
                case 'attract': // Joy: Drawn to connection
                    this.vx += dx * 0.001 * force;
                    this.vy += dy * 0.001 * force;
                    break;
                case 'repel': // Sadness: Wants to be alone
                    this.vx -= dx * 0.002 * force;
                    this.vy -= dy * 0.002 * force;
                    break;
                case 'agitate': // Anger: Vibrates intensely near mouse
                    this.vx += (Math.random() - 0.5) * 2 * force;
                    this.vy += (Math.random() - 0.5) * 2 * force;
                    break;
                case 'flee': // Fear: Runs away fast
                    if (dist < 150) {
                        this.vx -= dx * 0.01 * force;
                        this.vy -= dy * 0.01 * force;
                    }
                    break;
                case 'orbit': // Energy: Swirls around
                    this.vx += -dy * 0.005 * force;
                    this.vy += dx * 0.005 * force;
                    break;
                case 'nudge': // Neutral: Gentle push
                    this.vx -= dx * 0.0005 * force;
                    this.vy -= dy * 0.0005 * force;
                    break;
            }
        }

        // 3. Emotion Specifics (Passive)
        if (this.data.emotion === 'anger') {
            this.x += (Math.random() - 0.5) * 1.5;
            this.y += (Math.random() - 0.5) * 1.5;
        }

        // 4. Movement & Boundaries
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.8; }
        if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -0.8; }
        if (this.y < this.radius) { this.y = this.radius; this.vy *= -0.8; }
        if (this.y > height - this.radius) { this.y = height - this.radius; this.vy *= -0.8; }
    }

    draw() {
        const isVisible = activeFilter === 'all' || this.data.emotion === activeFilter;
        if (!isVisible) return;

        // Draw Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Draw Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1.0;
        ctx.fill();

        // Hover detection for tooltip
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius + 14;
    }
}

function animate() {
    hoveredParticle = null;

    // Trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; // Fades out previous frames
    ctx.fillRect(0, 0, width, height);

    // Draw connections
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        const isHovered = p1.draw();
        if (isHovered) {
            hoveredParticle = p1;
        }

        if (activeFilter !== 'all' && p1.data.emotion !== activeFilter) continue;

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            if (activeFilter !== 'all' && p2.data.emotion !== activeFilter) continue;

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                const opacity = (1 - dist / 120) * 0.3;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    updateTooltip();

    requestAnimationFrame(animate);
}

function updateTooltip() {
    if (!hoveredParticle) {
        tooltip.classList.add('hidden');
        return;
    }

    tooltip.textContent = hoveredParticle.data.text;
    tooltip.classList.remove('hidden');
    tooltip.style.transform = `translate(${hoveredParticle.x + hoveredParticle.radius + 14}px, ${hoveredParticle.y - hoveredParticle.radius - 10}px)`;
}
