// Элементы DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const menuButton = document.getElementById('menuButton');
const gameOverScreen = document.getElementById('gameOver');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');

// Звуковые эффекты
let jumpSound = null;
let gameOverSound = null;

// Загрузка звуков
function loadSounds() {
    try {
        jumpSound = new Audio('звуки/piggy-squeal.mp3');
        jumpSound.volume = 0.5;
    } catch (e) {
        console.log('Звук прыжка не загружен:', e);
    }
    
    try {
        gameOverSound = new Audio('звуки/pigs-fight-for-sounds.mp3');
        gameOverSound.volume = 0.5;
    } catch (e) {
        console.log('Звук game over не загружен:', e);
    }
}

// Игровые переменные
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameSpeed = 6;
let gravity = 0.6;
let jumpPower = -15;
let groundLevel;

// Изображения
const dinoImage = new Image();
const obstacleImage = new Image();
dinoImage.src = 'изображения/рома.png';
obstacleImage.src = 'изображения/skin_back_pahan.png';

// Объект динозаврика
const dino = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    velocityY: 0,
    jumping: false,
    
    draw() {
        if (dinoImage.complete) {
            ctx.drawImage(dinoImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#667eea';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    
    update() {
        if (this.jumping) {
            this.velocityY += gravity;
            this.y += this.velocityY;
            
            if (this.y >= groundLevel) {
                this.y = groundLevel;
                this.velocityY = 0;
                this.jumping = false;
            }
        }
    },
    
    jump() {
        if (!this.jumping) {
            this.velocityY = jumpPower;
            this.jumping = true;
            playSound(jumpSound);
        }
    }
};

// Массив препятствий
let obstacles = [];

// Класс препятствия
class Obstacle {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width;
        this.y = groundLevel;
        this.passed = false;
    }
    
    draw() {
        if (obstacleImage.complete) {
            ctx.drawImage(obstacleImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    collidesWith(dino) {
        return (
            dino.x < this.x + this.width - 10 &&
            dino.x + dino.width - 10 > this.x &&
            dino.y < this.y + this.height - 10 &&
            dino.y + dino.height - 10 > this.y
        );
    }
}

// Настройка canvas
function resizeCanvas() {
    const maxWidth = 1000;
    const maxHeight = 400;
    const minWidth = 320;
    const minHeight = 200;
    
    let width = window.innerWidth * 0.9;
    let height = window.innerHeight * 0.6;
    
    // Ограничения размеров
    width = Math.max(minWidth, Math.min(maxWidth, width));
    height = Math.max(minHeight, Math.min(maxHeight, height));
    
    // Поддержка соотношения сторон
    if (width / height > 2.5) {
        width = height * 2.5;
    } else if (width / height < 2) {
        height = width / 2;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Обновление позиций
    groundLevel = canvas.height - 80;
    dino.x = 50;
    dino.y = groundLevel;
    
    // Адаптивный размер персонажей
    const scale = Math.min(width / 1000, height / 400);
    dino.width = 60 * scale;
    dino.height = 60 * scale;
}

// Воспроизведение звука
function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Ошибка воспроизведения звука'));
    }
}

// Создание препятствия
function createObstacle() {
    const obstacle = new Obstacle();
    const scale = Math.min(canvas.width / 1000, canvas.height / 400);
    obstacle.width = 50 * scale;
    obstacle.height = 50 * scale;
    obstacle.y = groundLevel;
    obstacles.push(obstacle);
}

// Обновление счета
function updateScore() {
    score++;
    scoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('dinoHighScore', highScore);
    }
    
    // Постепенное ускорение как в оригинале
    if (score % 100 === 0) {
        gameSpeed += 0.5;
    }
}

// Отрисовка земли
function drawGround() {
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundLevel + dino.height);
    ctx.lineTo(canvas.width, groundLevel + dino.height);
    ctx.stroke();
}

// Игровой цикл
let lastObstacleTime = 0;
let obstacleInterval = 1500;
let animationId;

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка земли
    drawGround();
    
    // Обновление и отрисовка динозаврика
    dino.update();
    dino.draw();
    
    // Создание препятствий
    if (timestamp - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = timestamp;
        // Случайный интервал между препятствиями
        obstacleInterval = 1200 + Math.random() * 1000;
    }
    
    // Обновление препятствий
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.update();
        obstacle.draw();
        
        // Проверка столкновения
        if (obstacle.collidesWith(dino)) {
            endGame();
            return;
        }
        
        // Подсчет очков
        if (!obstacle.passed && obstacle.x + obstacle.width < dino.x) {
            obstacle.passed = true;
            updateScore();
        }
        
        // Удаление препятствий за экраном
        if (obstacle.isOffScreen()) {
            obstacles.splice(i, 1);
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Начало игры
function startGame() {
    menu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Сброс переменных
    gameRunning = true;
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    lastObstacleTime = 0;
    
    scoreElement.textContent = '0';
    highScoreElement.textContent = highScore;
    
    resizeCanvas();
    dino.y = groundLevel;
    dino.velocityY = 0;
    dino.jumping = false;
    
    animationId = requestAnimationFrame(gameLoop);
}

// Конец игры
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    playSound(gameOverSound);
    
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    
    gameOverScreen.classList.remove('hidden');
}

// Возврат в меню
function returnToMenu() {
    gameContainer.classList.add('hidden');
    menu.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    obstacles = [];
}

// Обработчики событий
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
menuButton.addEventListener('click', returnToMenu);

// Управление клавиатурой
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning) {
        e.preventDefault();
        dino.jump();
    }
});

// Управление касанием
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        dino.jump();
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        dino.jump();
    }
});

// Адаптивность при изменении размера окна
window.addEventListener('resize', () => {
    if (gameRunning) {
        resizeCanvas();
    }
});

// Инициализация
window.addEventListener('load', () => {
    loadSounds();
    highScoreElement.textContent = highScore;
    resizeCanvas();
});
