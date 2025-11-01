// Система валюты и колеса фортуны

function updateCurrencyDisplay() {
    bigMacsElement.textContent = bigMacs;
    bigMacsShopElement.textContent = bigMacs;
    bigMacsGameElement.textContent = bigMacs;
}

function saveBigMacs() {
    localStorage.setItem('bigMacs', bigMacs);
}

function checkAchievementSkin() {
    const achievementSkin = 'изображения/рома финальный.png';
    if (highScore >= 300 && !ownedSkins.includes(achievementSkin)) {
        ownedSkins.push(achievementSkin);
        localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
    }
}

// Колесо фортуны
function drawWheel() {
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = 180;
    const segments = wheelPrizes.length;
    const anglePerSegment = (2 * Math.PI) / segments;
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    wheelCtx.save();
    wheelCtx.translate(centerX, centerY);
    wheelCtx.rotate(currentRotation);
    
    // Отрисовка начинается с верхней точки (0 радиан) и идет по часовой стрелке
    for (let i = 0; i < segments; i++) {
        // Начинаем с -PI/2 чтобы первый сегмент был сверху
        const startAngle = i * anglePerSegment - Math.PI / 2;
        const endAngle = startAngle + anglePerSegment;
        
        wheelCtx.beginPath();
        wheelCtx.moveTo(0, 0);
        wheelCtx.arc(0, 0, radius, startAngle, endAngle);
        wheelCtx.closePath();
        wheelCtx.fillStyle = colors[i];
        wheelCtx.fill();
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 3;
        wheelCtx.stroke();
        
        // Вопросительный знак в центре сегмента
        wheelCtx.save();
        wheelCtx.rotate(startAngle + anglePerSegment / 2);
        wheelCtx.textAlign = 'center';
        wheelCtx.textBaseline = 'middle';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 40px Arial';
        wheelCtx.fillText('❓', radius * 0.65, 0);
        wheelCtx.restore();
    }
    
    wheelCtx.restore();
}

function canSpinToday() {
    if (!lastSpinDate) return true;
    const today = new Date().toDateString();
    return lastSpinDate !== today;
}

function spinWheel() {
    if (isSpinning || !canSpinToday()) return;
    
    isSpinning = true;
    spinButton.disabled = true;
    
    const spins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = spins * 360 + extraDegrees;
    const duration = 4000;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = (totalRotation * easeOut * Math.PI) / 180;
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // ФИНАЛЬНЫЙ ПРАВИЛЬНЫЙ расчет
            const segmentAngle = (2 * Math.PI) / wheelPrizes.length;
            
            // Нормализуем угол поворота
            let rotation = currentRotation % (2 * Math.PI);
            while (rotation < 0) rotation += 2 * Math.PI;
            
            // Указатель сверху = 0 градусов в нашей системе координат
            // Сегменты начинаются с -PI/2 (верх) и идут по часовой
            // Нужно найти какой сегмент под углом 0 (сверху) после поворота
            
            // Инвертируем поворот (колесо крутится, указатель стоит)
            let angleFromTop = (2 * Math.PI - rotation) % (2 * Math.PI);
            
            // Компенсируем смещение начала сегментов (-PI/2)
            angleFromTop = (angleFromTop + Math.PI / 2) % (2 * Math.PI);
            
            // Определяем индекс
            let winningIndex = Math.floor(angleFromTop / segmentAngle) % wheelPrizes.length;
            
            const prize = wheelPrizes[winningIndex];
            
            console.log('Rotation:', rotation.toFixed(2), 'Angle from top:', angleFromTop.toFixed(2), 'Segment angle:', segmentAngle.toFixed(2), 'Index:', winningIndex, 'Prize:', prize);
            
            bigMacs += prize;
            saveBigMacs();
            updateCurrencyDisplay();
            
            lastSpinDate = new Date().toDateString();
            localStorage.setItem('lastSpinDate', lastSpinDate);
            
            wheelInfo.textContent = `Вы выиграли ${prize} бигмаков!`;
            wheelInfo.style.color = '#27ae60';
            wheelInfo.style.fontSize = '1.5rem';
            
            setTimeout(() => {
                isSpinning = false;
                updateWheelButton();
            }, 2000);
        }
    }
    
    animate();
}

function updateWheelButton() {
    if (canSpinToday()) {
        spinButton.disabled = false;
        wheelInfo.textContent = 'Крути колесо и выигрывай бигмаки!';
        wheelInfo.style.color = '#666';
        wheelInfo.style.fontSize = '';
    } else {
        spinButton.disabled = true;
        wheelInfo.textContent = 'Приходи завтра за новым призом!';
        wheelInfo.style.color = '#e74c3c';
    }
}

function openWheelMenu() {
    menu.classList.add('hidden');
    wheelMenu.classList.remove('hidden');
    drawWheel();
    updateWheelButton();
}

function closeWheelMenu() {
    wheelMenu.classList.add('hidden');
    menu.classList.remove('hidden');
}

// Обновленная система скинов с покупками
function updateSkinsDisplay() {
    const skinCards = document.querySelectorAll('.skin-card');
    skinCards.forEach(card => {
        const skinPath = card.getAttribute('data-skin');
        const price = parseInt(card.getAttribute('data-price'));
        const achievement = parseInt(card.getAttribute('data-achievement'));
        
        if (skinPath === currentSkin) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
        
        if (ownedSkins.includes(skinPath)) {
            card.classList.remove('locked');
            const lockOverlay = card.querySelector('.lock-overlay');
            if (lockOverlay) lockOverlay.remove();
        } else if (achievement) {
            if (highScore >= achievement) {
                card.classList.remove('locked');
                const lockOverlay = card.querySelector('.lock-overlay');
                if (lockOverlay) lockOverlay.remove();
                if (!ownedSkins.includes(skinPath)) {
                    ownedSkins.push(skinPath);
                    localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
                }
            }
        }
    });
}

function buySkin(skinPath, price) {
    if (bigMacs >= price && !ownedSkins.includes(skinPath)) {
        bigMacs -= price;
        ownedSkins.push(skinPath);
        saveBigMacs();
        localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
        updateCurrencyDisplay();
        updateSkinsDisplay();
        selectSkin(skinPath);
    } else if (bigMacs < price) {
        alert('Недостаточно бигмаков!');
    }
}

function selectSkinNew(skinPath) {
    if (ownedSkins.includes(skinPath)) {
        currentSkin = skinPath;
        localStorage.setItem('selectedSkin', skinPath);
        dinoImage.src = skinPath;
        updateSkinsDisplay();
    }
}

// Обработчики событий
wheelButton.addEventListener('click', openWheelMenu);
backToMenuFromWheel.addEventListener('click', closeWheelMenu);
spinButton.addEventListener('click', spinWheel);

// Обновленные обработчики для скинов с покупкой
document.querySelectorAll('.skin-card').forEach(card => {
    card.addEventListener('click', () => {
        const skinPath = card.getAttribute('data-skin');
        const price = parseInt(card.getAttribute('data-price'));
        const achievement = card.getAttribute('data-achievement');
        
        if (ownedSkins.includes(skinPath)) {
            selectSkinNew(skinPath);
        } else if (!achievement && price > 0) {
            buySkin(skinPath, price);
        } else if (achievement) {
            const requiredScore = parseInt(achievement);
            if (highScore >= requiredScore) {
                selectSkinNew(skinPath);
            } else {
                alert(`Достигните рекорда в ${requiredScore} очков для разблокировки!`);
            }
        }
    });
});

// Обновление отображения скинов при открытии магазина
const originalOpenSkinsMenu = openSkinsMenu;
openSkinsMenu = function() {
    menu.classList.add('hidden');
    skinsMenu.classList.remove('hidden');
    updateCurrencyDisplay();
    updateSkinsDisplay();
};
