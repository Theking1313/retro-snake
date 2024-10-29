import { 
    GAME_STATES, 
    DIRECTIONS, 
    config,
    GameStateManager,
    Player,
    FoodManager,
    CollisionManager,
    Renderer
} from './game-core.js';

import { SoundFX } from './sound.js';
import { EffectsManager } from './effects.js';

export class GameController {
    constructor(canvas, effectsCanvas) {
        this.stateManager = new GameStateManager();
        this.collisionManager = new CollisionManager(config.gridSize);
        this.foodManager = new FoodManager(config.gridSize);
        this.renderer = new Renderer(canvas);
        this.effectsManager = new EffectsManager(effectsCanvas, canvas);
        this.soundFX = new SoundFX();
        this.players = [];
        this.gameLoop = null;
        this.effectsLoop = null;
        this.baseSpeed = config.initialSpeed;
        this.speed = config.initialSpeed;
        this.obstacles = [];
        this.maxObstacles = 5;
        this.foodIsMoving = false;
        this.foodMoveInterval = null;
        
        // Define player configurations
        this.playerConfigs = [
            { id: 1, color: '#00ff00', name: 'Player 1', controls: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight'
            }},
            { id: 2, color: '#0088ff', name: 'Player 2', controls: {
                up: 'w',
                down: 's',
                left: 'a',
                right: 'd'
            }},
            { id: 3, color: '#ff8800', name: 'Player 3', controls: {
                up: 'i',
                down: 'k',
                left: 'j',
                right: 'l'
            }},
            { id: 4, color: '#ff00ff', name: 'Player 4', controls: {
                up: 'NumPad8',
                down: 'NumPad5',
                left: 'NumPad4',
                right: 'NumPad6'
            }}
        ];
        
        this.setupEventListeners();
        this.createScoreBoard();
        this.stateManager.subscribe(this.handleStateChange.bind(this));
        this.stateManager.setState(GAME_STATES.MENU);
    }

    setupEventListeners() {
        // Menu button listeners
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.soundFX.init(); // Initialize audio context
                this.stateManager.setState(GAME_STATES.PLAYING);
            });
        }

        const howToPlayBtn = document.getElementById('how-to-play-btn');
        if (howToPlayBtn) {
            howToPlayBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.HOW_TO_PLAY);
            });
        }

        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.MENU);
            });
        }

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.PLAYING);
            });
        }

        // Keyboard controls for all players
        document.addEventListener('keydown', (event) => {
            if (this.stateManager.currentState !== GAME_STATES.PLAYING) return;

            this.players.forEach((player, index) => {
                const controls = this.playerConfigs[index].controls;
                let direction = null;

                switch (event.key.toLowerCase()) {
                    case controls.up.toLowerCase():
                        direction = DIRECTIONS.UP;
                        break;
                    case controls.down.toLowerCase():
                        direction = DIRECTIONS.DOWN;
                        break;
                    case controls.left.toLowerCase():
                        direction = DIRECTIONS.LEFT;
                        break;
                    case controls.right.toLowerCase():
                        direction = DIRECTIONS.RIGHT;
                        break;
                }

                if (direction) {
                    event.preventDefault();
                    player.setDirection(direction);
                }
            });
        });
    }

    handleStateChange(newState) {
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('how-to-play-menu').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('score').style.display = 'none';

        switch(newState) {
            case GAME_STATES.MENU:
                this.stopGame();
                document.getElementById('start-menu').style.display = 'flex';
                this.soundFX.playTheme();
                break;
            case GAME_STATES.HOW_TO_PLAY:
                this.stopGame();
                document.getElementById('how-to-play-menu').style.display = 'flex';
                break;
            case GAME_STATES.PLAYING:
                document.getElementById('score').style.display = 'flex';
                this.soundFX.stopTheme();
                this.initGame();
                break;
            case GAME_STATES.GAME_OVER:
                document.getElementById('game-over').style.display = 'flex';
                break;
        }
    }

    createScoreBoard() {
        const scoreBoard = document.getElementById('score');
        scoreBoard.style.display = 'none';
        scoreBoard.innerHTML = '';
        
        this.playerConfigs.forEach(config => {
            const playerScore = document.createElement('div');
            playerScore.id = `player-${config.id}-score`;
            playerScore.className = 'player-score';
            playerScore.style.color = config.color;
            playerScore.innerHTML = `${config.name}: 0`;
            scoreBoard.appendChild(playerScore);
        });
    }

    calculateStartingPositions(numPlayers) {
        const positions = [];
        const margin = 3; // Distance from walls
        const gridSize = config.gridSize;
        
        // Pre-defined optimal starting positions for up to 4 players
        const startingPositions = {
            1: [{ x: margin, y: Math.floor(gridSize/2) }],
            2: [
                { x: margin, y: Math.floor(gridSize/3) },
                { x: gridSize - margin - 1, y: Math.floor(2*gridSize/3) }
            ],
            3: [
                { x: margin, y: margin },
                { x: gridSize - margin - 1, y: margin },
                { x: Math.floor(gridSize/2), y: gridSize - margin - 1 }
            ],
            4: [
                { x: margin, y: margin },
                { x: gridSize - margin - 1, y: margin },
                { x: margin, y: gridSize - margin - 1 },
                { x: gridSize - margin - 1, y: gridSize - margin - 1 }
            ]
        };
        
        return startingPositions[numPlayers] || startingPositions[1];
    }

    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.effectsLoop) {
            cancelAnimationFrame(this.effectsLoop);
            this.effectsLoop = null;
        }
        if (this.foodMoveInterval) {
            clearInterval(this.foodMoveInterval);
            this.foodMoveInterval = null;
        }
        this.foodIsMoving = false;
        this.obstacles = [];
    }

    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.gameLoop = setInterval(() => {
            this.update();
        }, this.speed);
    }

    startEffectsLoop() {
        if (this.effectsLoop) cancelAnimationFrame(this.effectsLoop);
        const updateEffects = () => {
            this.effectsManager.update();
            this.effectsLoop = requestAnimationFrame(updateEffects);
        };
        updateEffects();
    }

    initGame() {
        this.stopGame();
        this.players = [];
        
        // Determine number of players (could be made configurable via UI)
        const numPlayers = 1; // Starting with 2 players for now
        
        // Get optimal starting positions
        const startingPositions = this.calculateStartingPositions(numPlayers);
        
        // Create players with their configurations
        for (let i = 0; i < numPlayers; i++) {
            const player = new Player(
                this.playerConfigs[i].id,
                startingPositions[i]
            );
            player.color = this.playerConfigs[i].color;
            this.players.push(player);
        }
        
        // Reset scores
        this.resetScores();
        
        this.speed = this.baseSpeed;
        this.foodManager.repositionFood(this.players.map(p => p.snake));
        document.getElementById('score').style.display = 'flex';
        this.startGameLoop();
        this.startEffectsLoop();
    }

    resetScores() {
        this.players.forEach(player => {
            const scoreElement = document.getElementById(`player-${player.id}-score`);
            if (scoreElement) {
                scoreElement.innerHTML = `${this.playerConfigs[player.id - 1].name}: 0`;
            }
        });
    }

    updatePlayerScore(player) {
        const scoreElement = document.getElementById(`player-${player.id}-score`);
        if (scoreElement) {
            scoreElement.innerHTML = `${this.playerConfigs[player.id - 1].name}: ${player.score}`;
            scoreElement.classList.add('glow');
            setTimeout(() => scoreElement.classList.remove('glow'), 500);
        }
    }

    update() {
        this.players.forEach(player => {
            if (!player.isAlive) return;

            const prevHead = { ...player.snake[0] };
            player.move();
            this.soundFX.playMove();

            // Create trail effects with player's color
            const cellSize = this.renderer.cellSize;
            player.snake.forEach(segment => {
                this.effectsManager.createTrail(
                    segment.x * cellSize + cellSize/2,
                    segment.y * cellSize + cellSize/2,
                    player.color
                );
            });

            // Check wall proximity
            player.snake.forEach(segment => {
                if (segment.x === 0 || segment.x === config.gridSize - 1 ||
                    segment.y === 0 || segment.y === config.gridSize - 1) {
                    this.effectsManager.createWallSparks(segment);
                }
            });

            // Check food collision
            const head = player.snake[0];
            if (head.x === this.foodManager.position.x && 
                head.y === this.foodManager.position.y) {
                player.grow();
                this.foodManager.repositionFood(
                    this.players.map(p => p.snake)
                );
                this.increaseSpeed();
                
                this.soundFX.playCollect();
                this.updatePlayerScore(player);
                
                this.effectsManager.createExplosion(
                    head.x * cellSize + cellSize/2,
                    head.y * cellSize + cellSize/2,
                    config.colors.food
                );
            }

            // Check collisions
            const otherPlayers = this.players.filter(p => p.id !== player.id);
            if (this.collisionManager.checkCollisions(player, otherPlayers, this.obstacles)) {
                const head = player.snake[0];
                const cellSize = this.renderer.cellSize;
                
                this.effectsManager.createCollisionEffect(head, 
                    this.collisionManager.checkWallCollision(head)
                );
                
                setTimeout(() => {
                    player.isAlive = false;
                    if (this.players.every(p => !p.isAlive)) {
                        this.gameOver();
                    }
                }, 500);
            }
        });

        this.renderer.render(
            this.stateManager.currentState, 
            this.players, 
            this.foodManager,
            this.obstacles
        );
    }

    increaseSpeed() {
        const scoreBasedReduction = Math.floor(
            Math.max(...this.players.map(p => p.score)) / 100
        ) * 3;
        this.speed = Math.max(
            config.minSpeed,
            this.baseSpeed - scoreBasedReduction
        );
        this.startGameLoop();
        
        const highestScore = Math.max(...this.players.map(p => p.score));
        if (highestScore >= 150 && !this.foodIsMoving) {
            this.startMovingFood();
        }
        
        if (highestScore >= 250) {
            this.updateObstacles();
        }
    }

    startMovingFood() {
        this.foodIsMoving = true;
        const highestScore = Math.max(...this.players.map(p => p.score));
        
        const moveInterval = Math.max(
            2000 - Math.floor((highestScore - 150) / 50) * 100,
            800
        );
        
        if (this.foodMoveInterval) {
            clearInterval(this.foodMoveInterval);
        }
        
        this.foodMoveInterval = setInterval(() => {
            this.foodManager.repositionFood(this.players.map(p => p.snake));
        }, moveInterval);
    }

    updateObstacles() {
        const highestScore = Math.max(...this.players.map(p => p.score));
        const desiredObstacles = Math.min(
            Math.floor((highestScore - 250) / 100) + 1,
            this.maxObstacles
        );
        
        while (this.obstacles.length < desiredObstacles) {
            this.addObstacle();
        }
    }

    addObstacle() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * config.gridSize),
                y: Math.floor(Math.random() * config.gridSize)
            };
        } while (
            this.isPositionOccupied(position) ||
            this.isNearSnake(position)
        );
        
        this.obstacles.push(position);
    }

    isPositionOccupied(position) {
        if (position.x === this.foodManager.position.x &&
            position.y === this.foodManager.position.y) {
            return true;
        }
        
        return this.obstacles.some(obstacle =>
            obstacle.x === position.x && obstacle.y === position.y
        );
    }

    isNearSnake(position) {
        const head = this.players[0].snake[0];
        const safeDistance = 2;
        
        return Math.abs(position.x - head.x) <= safeDistance &&
               Math.abs(position.y - head.y) <= safeDistance;
    }

    setupEventListeners() {
        // Menu button listeners
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.soundFX.init(); // Initialize audio context
                this.stateManager.setState(GAME_STATES.PLAYING);
            });
        }

        const howToPlayBtn = document.getElementById('how-to-play-btn');
        if (howToPlayBtn) {
            howToPlayBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.HOW_TO_PLAY);
            });
        }

        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.MENU);
            });
        }

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.stateManager.setState(GAME_STATES.PLAYING);
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (this.stateManager.currentState !== GAME_STATES.PLAYING) return;

            const keyMappings = {
                'ArrowUp': DIRECTIONS.UP,
                'ArrowDown': DIRECTIONS.DOWN,
                'ArrowLeft': DIRECTIONS.LEFT,
                'ArrowRight': DIRECTIONS.RIGHT
            };

            if (keyMappings[event.key]) {
                event.preventDefault();
                this.players[0].setDirection(keyMappings[event.key]);
            }
        });
    }

    gameOver() {
        this.stopGame();
        const finalScore = this.players[0].score;
        document.getElementById('final-score').textContent = finalScore;
        
        // Update high score if necessary
        const currentHighScore = parseInt(document.getElementById('high-score').textContent);
        if (finalScore > currentHighScore) {
            document.getElementById('high-score').textContent = finalScore;
        }
        
        this.stateManager.setState(GAME_STATES.GAME_OVER);
        this.soundFX.playGameOver();
        
        const head = this.players[0].snake[0];
        const cellSize = this.renderer.cellSize;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.effectsManager.createExplosion(
                    head.x * cellSize + cellSize/2,
                    head.y * cellSize + cellSize/2,
                    i === 0 ? '#ff0000' : i === 1 ? '#00ff00' : '#0000ff'
                );
            }, i * 200);
        }
    }
}

// Initialize the game
window.onload = () => {
    const gameCanvas = document.getElementById('gameCanvas');
    const effectsCanvas = document.getElementById('effects-canvas');
    const game = new GameController(gameCanvas, effectsCanvas);
    
    // Try to start audio context on various user interactions
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
        document.addEventListener(eventType, async () => {
            if (game.soundFX.audioContext.state === 'suspended') {
                await game.soundFX.audioContext.resume();
            }
        }, { once: true });
    });
};