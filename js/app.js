'use strict'

const MINE = '💥'

var gBoard
var gLevel
var gGame

function onInit() {
    // console.log('loaded!')
    gLevel = {
        size: 4,
        mines: 2
    }
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    }
    gBoard = buildBoard(gLevel.size, gLevel.mines)
    console.table(gBoard)
    console.log('gBoard', gBoard)
    // console.table(gBoard)

    renderBoard(gBoard)
    //intiate vars
    // document.addEventListener('contextmenu', (ev) => ev.preventDefault())
}

function buildBoard(size, minesNum) {
    var board = []

    for (var i = 0; i < size; i++) {
        board.push([])
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    setMines(board, minesNum)
    setMinesNegsCount(board)
    return board
}

function setMines(board, minesNum) {
    //static location for development
    board[0][0].isMine = true
    board[0][1].isMine = true

    //random
    /* var possiblePositions = getBoardPositions(board)

    for (var i = 0; i < minesNum; i++) {
            var randomPos = getRandomInt(0, possiblePositions.length)
            var rowIdx = possiblePositions[randomPos].i
            var colIdx = possiblePositions[randomPos].j
            console.log('mine in', {rowIdx, colIdx})
            board[rowIdx][colIdx].isMine = true
            possiblePositions.splice[randomPos, 1]

    } */
}

function getBoardPositions(board) {
    const positions = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            positions.push({ i, j })
        }
    }
    return positions
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currNegCount = countNegMines(i, j, board)
            board[i][j].minesAroundCount = currNegCount
        }
    }
}

function countNegMines(rowIdx, colIdx, mat) {
    var neighborsCount = 0

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= mat.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= mat[i].length) continue
            if (mat[i][j].isMine) neighborsCount++
        }
    }
    return neighborsCount
}

function renderBoard(board) {
    var strHtml = ''
    const elBoard = document.querySelector('.board')

    for (var i = 0; i < board.length; i++) {
        strHtml += `\n<tr>\n`
        for (var j = 0; j < board[i].length; j++) {
            var strClass = "cell"
            var divStrClass = board[i][j].isShown ? "" : "hide"
            var cellContent = board[i][j].isMine ? MINE : board[i][j].minesAroundCount
            const strDataAttr = `data-i="${i}" data-j="${j}"`

            strHtml += `
                \t<td oncontextmenu="onCellMarked(event, this)"
                    onclick="onCellClicked(this, ${i}, ${j})" 
                    ${strDataAttr}
                    class="${strClass}">
                    <div class="${divStrClass}">
                        ${cellContent}
                    </div>
                </td>\n`
        }
        strHtml += `</tr>`
    }
    elBoard.innerHTML = strHtml
}
//oncontextmenu="(event) => {onCellMarked(event, this)}"
//oncontextmenu="onCellMarked(event, this)"


function onCellClicked(elCell, i, j) {
    //TO DO: CHECK IF GAME IS ON

    const currCell = gBoard[i][j]

    if (currCell.isShown || currCell.isMarked) return

    //check if mine was clicked -> gameOver(),return
    if (currCell.isMine) {
        gameOver(false)
        return
    }
    //show cell content:
    currCell.isShown = true
    elCell.querySelector("div").classList.remove("hide")

    //check if cell with no neg mines ("safe cell") -> expandShown
    if (!currCell.minesAroundCount) {
        expandShown(gBoard, elCell, i, j)
    }

    /* Game ends when all mines are
    marked, and all the other cells
    are shown */
    //checkGameOver() - check victory
}

function onCellMarked(event, elCell) {
    // Called when a cell is right-clicked 
    console.log('right Clicked!')
    event.preventDefault()

    //take coors from elCell, update model, render cell
    const cellPos = getBoardPos(elCell)
    const currCell = gBoard[cellPos.i][cellPos.j]
    if (currCell.isShown) return

    currCell.isMarked = !currCell.isMarked

    if (currCell.isMarked) {
        elCell.classList.add("marked")
    } else {
        elCell.classList.remove("marked")
    }

}

//extracts model pos from DOM
function getBoardPos(elCell) {
    const rowIdx = elCell.dataset.i
    const colIdx = elCell.dataset.j
    // console.log('board pos is:', {rowIdx, colIdx})
    return { i: rowIdx, j: colIdx }
}

//extracts DOM el from model. loc {i,j}
function getEl(location) {
    const selector = `[data-i="${location.i}"][data-j="${location.j}"]`
    return document.querySelector(selector)
}

function checkGameOver() {

}

function expandShown(board, elCell,
    i, j) {
    /* NOTE: start with a basic
    implementation that only opens
    the non-mine 1st degree
    neighbors */
    console.log('EXPAND')
}

function revealAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMine) {
                // console.log('its a mine!')
                gBoard[i][j].isShown = true
                // console.log(`gBoard[${i}][${j}]`, gBoard[i][j])

                var currEl = getEl({ i, j })
                // currEl.querySelector("div").classList.remove("hide")

            }
        }
    }

}

function gameOver(isVictory = false) {
    if (isVictory) {
        console.log('VICTORY!')
    } else {
        console.log('GAME OVER!')
        revealAllMines()
    }
}


