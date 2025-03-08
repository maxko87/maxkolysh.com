document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('animation-trigger');
    trigger.classList.add('first-circle');
    
    trigger.addEventListener('click', () => {
        trigger.classList.add('hide');
        
        const links = document.getElementsByTagName('a');
        Array.from(links).forEach((link, index) => {
            link.classList.remove('swing-animation');
            void link.offsetWidth;
            link.style.animationDelay = '0s';
            link.classList.add('swing-animation');
        });

        setTimeout(() => {
            const secondButton = document.createElement('div');
            secondButton.className = 'trigger-circle second-circle show';
            secondButton.id = 'dropTrigger';
            document.body.appendChild(secondButton);

            secondButton.click();

            secondButton.addEventListener('click', function() {
                const links = document.querySelectorAll('a');
                links.forEach((link, index) => {
                    link.style.transform = 'rotate(-90deg)';
                    link.classList.remove('swing-animation');
                    void link.offsetWidth;
                    link.classList.add('vertical-drop');
                });
                
                this.classList.add('hide');
                
                setTimeout(() => {
                    const thirdButton = document.createElement('div');
                    thirdButton.className = 'trigger-circle third-circle show';
                    thirdButton.id = 'snakeTrigger';
                    document.body.appendChild(thirdButton);
                    
                    thirdButton.click();
                    
                    thirdButton.addEventListener('click', initSnakeGame);
                }, 0);
            });
        }, 0);
    });
});

function initSnakeGame() {
    this.classList.add('hide');
    
    const whoCareContainer = document.createElement('div');
    whoCareContainer.className = 'who-care-container';
    
    const blankSpacesContainer = document.createElement('div');
    blankSpacesContainer.className = 'blank-spaces';
    for (let i = 0; i < 7; i++) {
        const blank = document.createElement('div');
        blank.className = 'blank-space';
        if (i === 3) blank.style.marginLeft = '20px';
        blank.dataset.index = i;
        blankSpacesContainer.appendChild(blank);
    }
    whoCareContainer.appendChild(blankSpacesContainer);
    document.body.appendChild(whoCareContainer);
    
    const headers = Array.from(document.getElementsByTagName('h3'));
    const reachOutText = headers.find(h => h.textContent.toLowerCase() === 'reach out');
    const workText = headers.find(h => h.textContent.toLowerCase() === 'work');
    
    function makeLetterDraggable(letterDiv) {
        letterDiv.draggable = true;
        letterDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', letterDiv.dataset.letter);
            letterDiv.classList.add('dragging');
        });
        
        letterDiv.addEventListener('dragend', () => {
            letterDiv.classList.remove('dragging');
        });
    }

    function convertTextToDraggableLetters(element) {
        if (!element) return;
        
        const text = element.textContent;
        element.textContent = '';
        
        [...text].forEach(char => {
            if (char === ' ') {
                element.appendChild(document.createTextNode(' '));
                return;
            }
            
            const letterDiv = document.createElement('span');
            letterDiv.textContent = char;
            letterDiv.className = 'draggable-letter header-letter';
            letterDiv.dataset.letter = char.toUpperCase();
            letterDiv.classList.add('letter-color');
            
            makeLetterDraggable(letterDiv);
            element.appendChild(letterDiv);
        });
    }
    
    convertTextToDraggableLetters(workText);
    convertTextToDraggableLetters(reachOutText);
    
    const blanks = blankSpacesContainer.querySelectorAll('.blank-space');
    blanks.forEach(blank => {
        blank.addEventListener('dragover', (e) => {
            e.preventDefault();
            blank.classList.add('drag-over');
        });
        
        blank.addEventListener('dragleave', () => {
            blank.classList.remove('drag-over');
        });
        
        blank.addEventListener('drop', (e) => {
            e.preventDefault();
            blank.classList.remove('drag-over');
            const letter = e.dataTransfer.getData('text/plain');
            const draggedElement = document.querySelector('.draggable-letter.dragging');
            
            if (draggedElement) {
                // If there's already a letter in this blank, swap it
                if (blank.children.length > 0) {
                    const existingLetter = blank.children[0];
                    if (draggedElement.parentElement.classList.contains('blank-space')) {
                        // If dragged from another blank, swap positions
                        draggedElement.parentElement.appendChild(existingLetter);
                    } else {
                        // If dragged from header, move existing letter back to closest matching header
                        const headers = Array.from(document.getElementsByTagName('h3'));
                        const targetHeader = headers.find(h => 
                            h.textContent.toLowerCase().includes(existingLetter.textContent.toLowerCase()));
                        if (targetHeader) targetHeader.appendChild(existingLetter);
                    }
                }
                
                blank.appendChild(draggedElement);
                checkWhoCareWin();
            }
        });
    });
    
    let snakeGameWon = false;
    let whoCareWon = false;
    
    function checkWhoCareWin() {
        const filledBlanks = Array.from(blanks).map(blank => 
            blank.children[0]?.dataset.letter || '');
        const currentWord = filledBlanks.join('');
        
        if (currentWord === 'WHOCARE') {
            whoCareWon = true;
            
            // Turn all letters green and make them non-draggable
            blanks.forEach(blank => {
                if (blank.children[0]) {
                    blank.children[0].classList.remove('letter-color');
                    blank.children[0].classList.add('success-color');
                    blank.children[0].draggable = false;
                }
            });
            
            checkFinalVictory();
        }
    }
    
    const originalVictory = victory;
    victory = function() {
        snakeGameWon = true;
        checkFinalVictory();
    }
    
    function checkFinalVictory() {
        if (snakeGameWon && whoCareWon) {
            document.body.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
            
            const fourthButton = document.createElement('div');
            fourthButton.className = 'trigger-circle fourth-circle show';
            fourthButton.id = 'secretButton';
            document.body.appendChild(fourthButton);
            
            fourthButton.addEventListener('click', () => {
                window.open('https://www.youtube.com/watch?v=LWOVdKVVh3M', '_blank');
            });
            
            document.body.removeChild(gameContainer);
            document.body.removeChild(whoCareContainer);
            
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        }
    }
    
    const targetWord = 'maksim';
    let currentIndex = 1;
    let snake = {
        x: 300,
        y: 200,
        char: 'm',
        direction: { x: 1, y: 0 },
        speed: 100,
        positions: []
    };
    
    const STEP_SIZE = 20;
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 400;
    const TAIL_LENGTH = 8;
    
    const gameContainer = document.createElement('div');
    gameContainer.className = 'snake-game-container';
    
    const snakeContainer = document.createElement('div');
    snakeContainer.className = 'snake-container';
    gameContainer.appendChild(snakeContainer);
    
    const existingLetters = new Set();
    
    function getDistance(x1, y1, x2, y2) {
        const dx = Math.min(
            Math.abs(x1 - x2),
            Math.abs(x1 - x2 + GAME_WIDTH),
            Math.abs(x1 - x2 - GAME_WIDTH)
        );
        const dy = Math.min(
            Math.abs(y1 - y2),
            Math.abs(y1 - y2 + GAME_HEIGHT),
            Math.abs(y1 - y2 - GAME_HEIGHT)
        );
        return Math.floor(Math.sqrt(dx * dx + dy * dy) / STEP_SIZE);
    }

    function getValidPosition(snakePos) {
        let attempts = 0;
        let x, y;
        
        do {
            x = Math.floor(Math.random() * (GAME_WIDTH - 40) / STEP_SIZE) * STEP_SIZE;
            y = Math.floor(Math.random() * (GAME_HEIGHT - 40) / STEP_SIZE) * STEP_SIZE;
            
            const distance = getDistance(x, y, snakePos.x, snakePos.y);
            attempts++;
            
            if (distance >= 5 || attempts > 100) {
                return { x, y };
            }
        } while (attempts <= 100);
        
        return { x, y };
    }
    
    function spawnLetters() {
        const nextLetter = document.createElement('div');
        nextLetter.className = 'snake-letter target';
        nextLetter.textContent = targetWord[currentIndex];
        nextLetter.dataset.isTarget = 'true';
        
        const targetPos = getValidPosition({ x: snake.x, y: snake.y });
        nextLetter.style.left = targetPos.x + 'px';
        nextLetter.style.top = targetPos.y + 'px';
        
        gameContainer.appendChild(nextLetter);
        
        const targetLetter = targetWord[currentIndex];
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.replace(targetLetter, '');
        
        const decoyCount = Math.floor(Math.random() * 3) + 3;
        for(let i = 0; i < decoyCount; i++) {
            const decoy = document.createElement('div');
            decoy.className = 'snake-letter decoy';
            decoy.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
            
            const decoyPos = getValidPosition({ x: snake.x, y: snake.y });
            decoy.style.left = decoyPos.x + 'px';
            decoy.style.top = decoyPos.y + 'px';
            
            gameContainer.appendChild(decoy);
        }
        
        return nextLetter;
    }
    
    let currentLetter = spawnLetters();
    document.body.appendChild(gameContainer);
    
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp': 
                snake.direction = { x: 0, y: -1 }; 
                break;
            case 'ArrowDown': 
                snake.direction = { x: 0, y: 1 }; 
                break;
            case 'ArrowLeft': 
                snake.direction = { x: -1, y: 0 }; 
                break;
            case 'ArrowRight': 
                snake.direction = { x: 1, y: 0 }; 
                break;
        }
    });
    
    function updateSnakeDisplay() {
        snakeContainer.innerHTML = '';
        
        const currentWordLength = snake.char.length;
        const visiblePositions = snake.positions.slice(0, currentWordLength);
        
        visiblePositions.forEach((pos, index) => {
            const segment = document.createElement('div');
            segment.className = 'snake-character';
            segment.textContent = snake.char[index];
            
            const rotation = (index * 5);
            
            segment.style.left = pos.x + 'px';
            segment.style.top = pos.y + 'px';
            segment.style.transform = `rotate(${rotation}deg)`;
            segment.style.opacity = 1 - (index / (currentWordLength * 1.5));
            
            snakeContainer.appendChild(segment);
        });
    }
    
    function moveSnake() {
        snake.x += snake.direction.x * STEP_SIZE;
        snake.y += snake.direction.y * STEP_SIZE;
        
        if (snake.x >= GAME_WIDTH) snake.x = 0;
        if (snake.x < 0) snake.x = GAME_WIDTH - STEP_SIZE;
        if (snake.y >= GAME_HEIGHT) snake.y = 0;
        if (snake.y < 0) snake.y = GAME_HEIGHT - STEP_SIZE;
        
        snake.positions.unshift({ x: snake.x, y: snake.y });
        
        if (snake.positions.length > TAIL_LENGTH) {
            snake.positions = snake.positions.slice(0, TAIL_LENGTH);
        }
        
        updateSnakeDisplay();
        setTimeout(moveSnake, snake.speed);
    }
    
    moveSnake();
    
    function gameOver() {
        document.body.removeChild(gameContainer);
        initSnakeGame.call(document.getElementById('snakeTrigger'));
    }
    
    function victory() {
        document.body.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        
        const fourthButton = document.createElement('div');
        fourthButton.className = 'trigger-circle fourth-circle show';
        fourthButton.id = 'secretButton';
        document.body.appendChild(fourthButton);
        
        fourthButton.addEventListener('click', () => {
            window.open('https://www.youtube.com/watch?v=LWOVdKVVh3M', '_blank');
        });
        
        document.body.removeChild(gameContainer);
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }
    
    function checkCollisions() {
        const letters = gameContainer.querySelectorAll('.snake-letter');
        const snakeHead = snakeContainer.firstChild.getBoundingClientRect();
        
        letters.forEach(letter => {
            const letterRect = letter.getBoundingClientRect();
            if (isColliding(snakeHead, letterRect)) {
                if (letter.dataset.isTarget === 'true') {
                    currentIndex++;
                    letters.forEach(l => gameContainer.removeChild(l));
                    
                    if (currentIndex === targetWord.length) {
                        victory();
                        return;
                    }
                    
                    snake.char += targetWord[currentIndex - 1];
                    currentLetter = spawnLetters();
                } else {
                    gameOver();
                }
            }
        });
        
        requestAnimationFrame(checkCollisions);
    }
    
    checkCollisions();
}

function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom);
} 