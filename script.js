document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('puzzle-canvas');
    const context = canvas.getContext('2d');
    const loadButton = document.getElementById('load-pokemon');

    const gridSize = 4; // 4x4 grid
    let pieces = [];
    let pieceSize;
    let shuffledPieces = [];
    let draggingPiece = null;
    let pokemonImage = new Image(); // Declare globally to access it everywhere

    canvas.width = 400;
    canvas.height = 400;
    pieceSize = canvas.width / gridSize;

    // Load a new Pokémon and initialize the game
    loadButton.addEventListener('click', loadNewPokemon);

    function loadNewPokemon() {
        const randomId = Math.floor(Math.random() * 150) + 1; // Random Pokémon ID between 1 and 150
        fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`)
            .then(response => response.json())
            .then(pokemon => {
                const imageUrl = pokemon.sprites.other['official-artwork'].front_default;
                if (imageUrl) {
                    loadImage(imageUrl);
                } else {
                    alert('Failed to load Pokémon image. Try again.');
                }
            });
    }

    function loadImage(url) {
        pokemonImage.src = url;
        pokemonImage.onload = () => {
            initializeGame(pokemonImage);
        };
    }

    function initializeGame(image) {
        pieces = [];
        shuffledPieces = [];
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate the piece size based on the smaller dimension to fit the image properly in the canvas
        const scaleFactor = Math.min(canvas.width / image.width, canvas.height / image.height);
        const imgWidth = image.width * scaleFactor;
        const imgHeight = image.height * scaleFactor;
        pieceSize = Math.min(imgWidth, imgHeight) / gridSize;

        // Adjust canvas size to fit the scaled image
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // Draw and slice the Pokémon image into grid pieces
        drawImageGrid(image, imgWidth, imgHeight);
        shufflePieces();
        drawShuffledPieces();
        setupDragAndDrop();
    }

    function drawImageGrid(image, imgWidth, imgHeight) {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const piece = {
                    x: x * pieceSize,
                    y: y * pieceSize,
                    imgX: x * pieceSize,
                    imgY: y * pieceSize,
                    width: pieceSize,
                    height: pieceSize,
                    correctX: x,
                    correctY: y
                };
                pieces.push(piece);
            }
        }
    }

    function shufflePieces() {
        shuffledPieces = [...pieces];
        for (let i = shuffledPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPieces[i], shuffledPieces[j]] = [shuffledPieces[j], shuffledPieces[i]];
        }
    }

    function drawShuffledPieces() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        shuffledPieces.forEach(piece => {
            context.drawImage(
                pokemonImage,
                piece.imgX, piece.imgY, piece.width, piece.height,
                piece.x, piece.y, piece.width, piece.height
            );
        });
    }

    function setupDragAndDrop() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
    }

    function getPieceUnderMouse(x, y) {
        return shuffledPieces.find(piece => 
            x > piece.x && x < piece.x + piece.width && 
            y > piece.y && y < piece.y + piece.height
        );
    }

    function onMouseDown(e) {
        const mousePos = getMousePos(e);
        draggingPiece = getPieceUnderMouse(mousePos.x, mousePos.y);
        if (draggingPiece) {
            draggingPiece.offsetX = mousePos.x - draggingPiece.x;
            draggingPiece.offsetY = mousePos.y - draggingPiece.y;
        }
    }

    function onMouseMove(e) {
        if (!draggingPiece) return;
        const mousePos = getMousePos(e);
        draggingPiece.x = mousePos.x - draggingPiece.offsetX;
        draggingPiece.y = mousePos.y - draggingPiece.offsetY;

        drawShuffledPieces();
        // Draw the dragging piece on top
        context.drawImage(
            pokemonImage,
            draggingPiece.imgX, draggingPiece.imgY, draggingPiece.width, draggingPiece.height,
            draggingPiece.x, draggingPiece.y, draggingPiece.width, draggingPiece.height
        );
    }

    function onMouseUp(e) {
        if (!draggingPiece) return;
        const mousePos = getMousePos(e);
        const targetPiece = getPieceUnderMouse(mousePos.x, mousePos.y);

        if (targetPiece && targetPiece !== draggingPiece) {
            // Swap positions
            [draggingPiece.x, draggingPiece.y, targetPiece.x, targetPiece.y] = [targetPiece.x, targetPiece.y, draggingPiece.x, draggingPiece.y];
        } else {
            // Snap the dragging piece back to its shuffled position if no valid swap
            const piece = pieces.find(p => p.imgX === draggingPiece.imgX && p.imgY === draggingPiece.imgY);
            if (piece) {
                draggingPiece.x = piece.correctX * pieceSize;
                draggingPiece.y = piece.correctY * pieceSize;
            }
        }

        draggingPiece = null;
        drawShuffledPieces();
    }

    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
});
