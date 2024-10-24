// effects.js
export class EffectsManager {
    constructor(canvas, gameCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize(gameCanvas);
        this.gridSize = 20;
        this.cellSize = gameCanvas.width / this.gridSize;
        
        // Arcade-style colors for effects
        this.collisionColors = [
            '#00ffff',  // Cyan
            '#00ff00',  // Bright green
            '#ff00ff',  // Magenta
            '#ffff00'   // Yellow
        ];
    }

    resize(gameCanvas) {
        this.canvas.width = gameCanvas.width;
        this.canvas.height = gameCanvas.height;
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const velocity = 3 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1,
                color: color,
                size: 5 + Math.random() * 2
            });
        }
    }

    createTrail(x, y, color) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 12,
                y: y + (Math.random() - 0.5) * 12,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                life: 0.7,
                color: color,
                size: 3 + Math.random() * 2
            });
        }
    }

    createWallSparks(segment, isWallCollision = false) {
        const x = segment.x * this.cellSize + this.cellSize/2;
        const y = segment.y * this.cellSize + this.cellSize/2;
        
        let angle = 0;
        let spread = Math.PI / 4;

        if (segment.x === 0) angle = 0;
        else if (segment.x === this.gridSize - 1) angle = Math.PI;
        else if (segment.y === 0) angle = Math.PI / 2;
        else if (segment.y === this.gridSize - 1) angle = -Math.PI / 2;

        const particleCount = isWallCollision ? 15 : 5;
        const baseVelocity = isWallCollision ? 4 : 2;

        for (let i = 0; i < particleCount; i++) {
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            const velocity = baseVelocity + Math.random() * 2;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(particleAngle) * velocity,
                vy: Math.sin(particleAngle) * velocity,
                life: isWallCollision ? 1 : 0.5,
                color: isWallCollision ? 
                    this.collisionColors[Math.floor(Math.random() * this.collisionColors.length)] : 
                    '#ffff00',
                size: isWallCollision ? 4 : 2
            });
        }
    }

    createCollisionEffect(head, isWallCollision) {
        const x = head.x * this.cellSize + this.cellSize/2;
        const y = head.y * this.cellSize + this.cellSize/2;
        
        // Create multiple waves of particles
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 40; i++) {
                    const angle = (Math.PI * 2 / 40) * i;
                    const velocity = 4 + Math.random() * 4;
                    
                    // Cycle through bright arcade colors
                    const color = this.collisionColors[Math.floor(Math.random() * this.collisionColors.length)];
                    
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * velocity,
                        vy: Math.sin(angle) * velocity,
                        life: 1.2,
                        color: color,
                        size: 6 + Math.random() * 3
                    });
                }
            }, wave * 100); // Stagger the waves
        }
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.97;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();
        }
    }
}