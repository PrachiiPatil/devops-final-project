let currentPlayer = "X";
let board = Array(9).fill("");

const boardDiv = document.getElementById("board");

function createBoard() {
    boardDiv.innerHTML = "";
    board.forEach((val, i) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.innerText = val;
        cell.onclick = () => makeMove(i);
        boardDiv.appendChild(cell);
    });
}

function makeMove(i) {
    if (board[i] === "") {
        board[i] = currentPlayer;
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        createBoard();
    }
}

function resetGame() {
    board = Array(9).fill("");
    currentPlayer = "X";
    createBoard();
}

createBoard();
