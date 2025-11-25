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

export function spawnDemoParticles() {
    const demoTexts = [
        { text: "This is amazing!", emotion: "joy" },
        { text: "I feel so heavy today.", emotion: "sadness" },
        { text: "Why is this happening?!", emotion: "anger" },
        { text: "I'm nervous about the result.", emotion: "fear" },
        { text: "Let's go! Can't wait!", emotion: "energy" },
        { text: "Just a regular day.", emotion: "neutral" },
        { text: "Love this new design.", emotion: "joy" },
        { text: "It's a bit gloomy outside.", emotion: "sadness" },
        { text: "So much energy in here!", emotion: "energy" }
    ];

    // Spawn a bunch of random particles
    for (let i = 0; i < 20; i++) {
        const randomData = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        // Add some variation to score
        const data = { ...randomData, score: 0.5 + Math.random() * 0.5 };
        particles.push(new Particle(data));
    }
}

class Particle {
    constructor(data) {
        this.data = data;
        this.x = width / 2 + (Math.random() - 0.5) * 400;
        this.y = height / 2 + (Math.random() - 0.5) * 400;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;

        const config = EMOTIONS[data.emotion] || EMOTIONS.neutral;
        this.config = config;
        this.color = config.color;
        this.baseRadius = (6 + data.score * 10) * config.radiusMult;
        this.radius = this.baseRadius;
        this.isHovered = false;
    }

    update() {
        // Check mouse distance
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Hover Interaction: STOP if close
        if (dist < this.radius + 10) {
            this.isHovered = true;
            this.vx *= 0.5; // Heavy friction
            this.vy *= 0.5;
            return; // Skip other physics
        } else {
            this.isHovered = false;
        }

        // 1. Base Physics (Gravity & Friction)
        this.vy += this.config.gravity;
        this.vx *= this.config.friction;
        this.vy *= this.config.friction;

        // 2. Mouse Interaction (Magnetic Field)
        const maxDist = 400;

        if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist; // 0 to 1 strength

            switch (this.config.interaction) {
                case 'attract': // Joy
                    this.vx += dx * 0.0005 * force;
                    this.vy += dy * 0.0005 * force;
                    break;
                case 'repel': // Sadness
                    this.vx -= dx * 0.001 * force;
                    this.vy -= dy * 0.001 * force;
                    break;
                case 'agitate': // Anger
                    this.vx += (Math.random() - 0.5) * 2 * force;
                    this.vy += (Math.random() - 0.5) * 2 * force;
                    break;
                case 'flee': // Fear
                    if (dist < 200) {
                        this.vx -= dx * 0.005 * force;
                        this.vy -= dy * 0.005 * force;
                    }
                    break;
                case 'orbit': // Energy
                    this.vx += -dy * 0.002 * force;
                    this.vy += dx * 0.002 * force;
                    break;
                case 'nudge': // Neutral
                    this.vx -= dx * 0.0002 * force;
                    this.vy -= dy * 0.0002 * force;
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

        // Hover Text - Fixed Position (Right Side)
        if (this.isHovered) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Outfit';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Draw background pill for text
            const text = this.data.text.length > 30 ? this.data.text.substring(0, 30) + "..." : this.data.text;
            const textWidth = ctx.measureText(text).width;
            const padding = 8;
            const boxX = this.x + this.radius + 10;
            const boxY = this.y - 15;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, textWidth + padding * 2, 30, 8);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillText(text, boxX + padding, boxY + 15);
        }
    }
}

function animate() {
    // Trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; // Fades out previous frames
    ctx.fillRect(0, 0, width, height);

    // Draw connections
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

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

    requestAnimationFrame(animate);
}
