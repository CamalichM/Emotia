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

// Global reference for the selected particle
let selectedParticleRef = null;

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

    // Click Interaction for Floating Card
    const card = document.getElementById('particleCard');
    const cardEmotion = document.getElementById('cardEmotion');
    const cardText = document.getElementById('cardText');
    const closeCardBtn = document.getElementById('closeCardBtn');

    // Force hide on init
    if (card) {
        card.classList.add('hidden');
        card.style.display = 'none';
    }

    selectedParticleRef = null;

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        let clicked = null;

        // Check click (iterate backwards for z-index)
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const dx = clickX - p.x;
            const dy = clickY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < p.radius + 10) {
                clicked = p;
                break;
            }
        }

        if (clicked) {
            if (selectedParticleRef === clicked) {
                // Toggle off if clicking same one
                selectedParticleRef = null;
                card.classList.add('hidden');
                card.style.display = 'none';
            } else {
                // Select new one
                selectedParticleRef = clicked;

                // Update Content
                cardEmotion.textContent = clicked.data.emotion;
                cardEmotion.style.color = clicked.color;
                cardText.textContent = clicked.data.text;

                card.classList.remove('hidden');
                card.style.display = 'block';
            }
        } else {
            // Clicked empty space - deselect
            selectedParticleRef = null;
            card.classList.add('hidden');
            card.style.display = 'none';
        }
    });

    closeCardBtn.addEventListener('click', () => {
        selectedParticleRef = null;
        card.classList.add('hidden');
        card.style.display = 'none';
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
        this.x = width / 2 + (Math.random() - 0.5) * 200;
        this.y = height / 2 + (Math.random() - 0.5) * 200;
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

        // 1. Centering Force (Global Soft Pull)
        // Pulls everything gently to center, no hard boundary
        const centerX = width / 2;
        const centerY = height / 2;

        // Very weak pull that scales with distance
        // This allows them to spread out but stay on screen
        const pullStrength = 0.00002;
        this.vx += (centerX - this.x) * pullStrength;
        this.vy += (centerY - this.y) * pullStrength;

        // 2. Strong Dispersion (Anti-Clump)
        // Push away from neighbors
        for (let other of particles) {
            if (other === this) continue;
            const dx2 = this.x - other.x;
            const dy2 = this.y - other.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const repelDist = 200; // Large repulsion radius

            if (dist2 < repelDist && dist2 > 0) {
                // Force is stronger when closer
                const force = (repelDist - dist2) / repelDist;
                const strength = 0.01 * force; // Strong push

                this.vx += (dx2 / dist2) * strength;
                this.vy += (dy2 / dist2) * strength;
            }
        }

        // 3. Base Physics (Floaty)
        this.vy += this.config.gravity * 0.05;
        this.vx *= 0.98;
        this.vy *= 0.98;

        // 4. Mouse Interaction
        const maxDist = 300;

        if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;

            switch (this.config.interaction) {
                case 'attract':
                    this.vx += dx * 0.0002 * force;
                    this.vy += dy * 0.0002 * force;
                    break;
                case 'repel':
                    this.vx -= dx * 0.0005 * force;
                    this.vy -= dy * 0.0005 * force;
                    break;
                case 'agitate':
                    this.vx += (Math.random() - 0.5) * 0.5 * force;
                    this.vy += (Math.random() - 0.5) * 0.5 * force;
                    break;
                case 'flee':
                    if (dist < 200) {
                        this.vx -= dx * 0.002 * force;
                        this.vy -= dy * 0.002 * force;
                    }
                    break;
                case 'orbit':
                    this.vx += -dy * 0.001 * force;
                    this.vy += dx * 0.001 * force;
                    break;
                case 'nudge':
                    this.vx -= dx * 0.0001 * force;
                    this.vy -= dy * 0.0001 * force;
                    break;
            }
        }

        // 5. Movement & Boundaries
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.5; }
        if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -0.5; }
        if (this.y < this.radius + 70) { this.y = this.radius + 70; this.vy *= -0.5; }
        if (this.y > height - this.radius) { this.y = height - this.radius; this.vy *= -0.5; }
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

        // Selection Ring
        if (this === selectedParticleRef) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Hover Text - Fixed Position (Right Side)
        // Only show if NOT selected (to avoid clutter)
        if (this.isHovered && this !== selectedParticleRef) {
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

    // Update Floating Card Position
    if (selectedParticleRef) {
        const card = document.getElementById('particleCard');
        if (card && !card.classList.contains('hidden')) {
            const cardRect = card.getBoundingClientRect();
            const cardWidth = cardRect.width || 220;
            const cardHeight = cardRect.height || 150;

            // Initial Position: Right of particle, centered vertically
            let cardX = selectedParticleRef.x + selectedParticleRef.radius + 8;
            let cardY = selectedParticleRef.y - cardHeight / 2;

            // 1. Horizontal Clamping
            // If it goes off the right edge, flip to the left
            if (cardX + cardWidth > width - 10) {
                cardX = selectedParticleRef.x - selectedParticleRef.radius - cardWidth - 15;
            }
            // If flipping makes it go off the left edge, clamp it to the left edge
            if (cardX < 10) {
                cardX = 10;
            }

            // 2. Vertical Clamping
            // If it goes off the bottom, shift up
            if (cardY + cardHeight > height - 10) {
                cardY = height - cardHeight - 10;
            }
            // If it goes off the top, shift down
            if (cardY < 10) {
                cardY = 10;
            }

            card.style.transform = `translate(${cardX}px, ${cardY}px)`;
        }
    } else {
        // Double safety: Ensure hidden if no particle selected
        const card = document.getElementById('particleCard');
        if (card && !card.classList.contains('hidden')) {
            card.classList.add('hidden');
        }
    }

    requestAnimationFrame(animate);
}
