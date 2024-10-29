// Core game configurations and constants
export const GAME_STATES = {
    MENU: 'menu',
    HOW_TO_PLAY: 'howToPlay',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

export const config = {
    gridSize: 20,
    initialSpeed: 200,
    speedIncrease: 2,
    minSpeed: 80,
    colors: {
        background: '#000000',
        grid: '#1a1a1a',
        snake: '#00ff00',
        food: '#ff00ff',
        border: '#00ffff',
        obstacle: '#ff0000'
    }
};

// Core game classes
export class GameStateManager {
    constructor() {
        this.currentState = GAME_STATES.MENU;
        this.subscribers = [];
    }

    setState(newState) {
        this.currentState = newState;
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.currentState));
    }
}

export class Player {
    constructor(id, startingPosition) {
        this.id = id;
        this.snake = [startingPosition];
        this.direction = DIRECTIONS.RIGHT;
        this.score = 0;
        this.isAlive = true;
        this.growing = false;
    }

    move() {
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        this.snake.unshift(head);
        if (!this.growing) {
            this.snake.pop();
        }
        this.growing = false;
    }

    grow() {
        this.growing = true;
        this.score += 10;
    }

    setDirection(newDirection) {
        if (this.direction.x + newDirection.x === 0 && 
            this.direction.y + newDirection.y === 0) {
            return;
        }
        this.direction = newDirection;
    }
}

export class FoodManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.position = this.generateFood();
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };
    }

    repositionFood(snakes) {
        do {
            this.position = this.generateFood();
        } while (this.isPositionOccupied(snakes));
    }

    isPositionOccupied(snakes) {
        return snakes.some(snake => 
            snake.some(segment => 
                segment.x === this.position.x && segment.y === this.position.y
            )
        );
    }
}

export class CollisionManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
    }

    checkCollisions(player, otherPlayers = [], obstacles = []) {
        return (
            this.checkWallCollision(player.snake[0]) ||
            this.checkSelfCollision(player.snake) ||
            this.checkPlayersCollision(player.snake[0], otherPlayers) ||
            this.checkObstacleCollision(player.snake[0], obstacles)
        );
    }

    checkWallCollision(head) {
        return (
            head.x < 0 ||
            head.x >= this.gridSize ||
            head.y < 0 ||
            head.y >= this.gridSize
        );
    }

    checkSelfCollision(snake) {
        const head = snake[0];
        return snake.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    checkPlayersCollision(head, otherPlayers) {
        return otherPlayers.some(player =>
            player.snake.some(segment =>
                segment.x === head.x && segment.y === head.y
            )
        );
    }

    checkObstacleCollision(head, obstacles) {
        return obstacles.some(obstacle =>
            obstacle.x === head.x && obstacle.y === head.y
        );
    }
}

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupCanvas();
        this.glowIntensity = 0;
        this.glowIncreasing = true;
    }

    setupCanvas() {
        this.canvas.width = 600;
        this.canvas.height = 600;
        this.cellSize = this.canvas.width / config.gridSize;
    }

    render(gameState, players, food, obstacles = []) {
        this.clear();
        this.drawGrid();
        this.drawFood(food);
        this.drawObstacles(obstacles);
        players.forEach(player => this.drawSnake(player));
        this.updateGlow();
    }

    updateGlow() {
        if (this.glowIncreasing) {
            this.glowIntensity += 0.05;
            if (this.glowIntensity >= 1) this.glowIncreasing = false;
        } else {
            this.glowIntensity -= 0.05;
            if (this.glowIntensity <= 0) this.glowIncreasing = true;
        }
    }

    clear() {
        this.ctx.fillStyle = config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = config.colors.grid;
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= config.gridSize; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    drawSnake(player) {
        player.snake.forEach((segment, index) => {
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            
            this.ctx.shadowColor = config.colors.snake;
            this.ctx.shadowBlur = 15;
            
            this.ctx.fillStyle = config.colors.snake;
            this.ctx.beginPath();
            this.ctx.roundRect(
                x + 1,
                y + 1,
                this.cellSize - 2,
                this.cellSize - 2,
                5
            );
            this.ctx.fill();

            if (index === 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(
                    x + this.cellSize / 2,
                    y + this.cellSize / 2,
                    this.cellSize / 4,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
            
            this.ctx.shadowBlur = 0;
        });
    }

    drawFood(food) {
        const x = food.position.x * this.cellSize;
        const y = food.position.y * this.cellSize;
        
        this.ctx.shadowColor = config.colors.food;
        this.ctx.shadowBlur = 15 * this.glowIntensity;
        
        this.ctx.fillStyle = config.colors.food;
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + 1,
            y + 1,
            this.cellSize - 2,
            this.cellSize - 2,
            5
        );
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }

    drawObstacles(obstacles) {
        obstacles.forEach(obstacle => {
            const x = obstacle.x * this.cellSize;
            const y = obstacle.y * this.cellSize;
            
            this.ctx.shadowColor = config.colors.obstacle;
            this.ctx.shadowBlur = 15;
            
            this.ctx.fillStyle = config.colors.obstacle;
            this.ctx.beginPath();
            this.ctx.roundRect(
                x + 1,
                y + 1,
                this.cellSize - 2,
                this.cellSize - 2,
                5
            );
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        });
    }
}