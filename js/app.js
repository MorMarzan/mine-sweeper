'use strict'

const MINE = '💥'

var gBoard
var gLevel
var gGame

function onInit(size = 4) {
    // console.log('loaded!')
    gLevel = {
        size,
        mines: getMinesNum(size)
    }
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    }
    gBoard = buildBoard(gLevel.size, gLevel.mines)
    console.log('gBoard', gBoard)
    // console.table(gBoard)

    renderBoard(gBoard)

    //maybe to outer func
    var elModal = document.querySelector(".game-over")
    elModal.classList.add("hide")
}

function getMinesNum(size) {
    switch (size) {
        case 4:
            return 2
            break;
        case 8:
            return 14
            break;
        case 12:
            return 32
    }
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
    setMinesAroundCount(board)
    return board
}

function setMines(board, minesNum) {
    // static location for development
    // board[0][0].isMine = true
    // board[0][1].isMine = true

    //random
    var possiblePositions = getBoardPositions(board)

    for (var i = 0; i < minesNum; i++) {
            var randomPos = getRandomInt(0, possiblePositions.length)
            var rowIdx = possiblePositions[randomPos].i
            var colIdx = possiblePositions[randomPos].j
            // console.log('mine in', {rowIdx, colIdx})
            board[rowIdx][colIdx].isMine = true
            var y = possiblePositions.splice(randomPos, 1)

    }
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

function setMinesAroundCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currNegCount = countNegMines(i, j, board)
            board[i][j].minesAroundCount = currNegCount
        }
    }
}

function countNegMines(rowIdx, colIdx, board) {
    var neighborsCount = 0

    // for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    //     if (i < 0 || i >= board.length) continue

    //     for (var j = colIdx - 1; j <= colIdx + 1; j++) {
    //         if (i === rowIdx && j === colIdx) continue
    //         if (j < 0 || j >= board[i].length) continue
    //         if (board[i][j].isMine) neighborsCount++
    //     }
    // }
    var negsPositions = getNegPositions(rowIdx, colIdx, board)
    for (var i = 0; i < negsPositions.length; i++) {
        var negRowIdx = negsPositions[i].i
        var negColIdx = negsPositions[i].j
        if (board[negRowIdx][negColIdx].isMine) neighborsCount++
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
                \t<td 
                    oncontextmenu="onCellMarked(event, this)"
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

function onCellClicked(elCell, i, j) {
    //TO DO: CHECK IF GAME IS ON
    if (!gGame.isOn) return

    const currCell = gBoard[i][j]
    if (currCell.isShown || currCell.isMarked) return

    //check if mine was clicked -> gameOver(),return
    if (currCell.isMine) {
        gameOver(false)
        return
    }

    //show cell content:
    showCell(currCell, elCell)

    //check if cell with no neg mines ("safe cell") -> expandShown
    if (!currCell.minesAroundCount) {
        expandShown(gBoard, elCell, i, j)
    }

    checkGameOver()

}

function onCellMarked(event, elCell) {
    // Called when a cell is right-clicked 
    // console.log('right Clicked!')
    event.preventDefault()
    if (!gGame.isOn) return

    //take coors from elCell, update model, render cell
    const cellPos = getBoardPos(elCell)
    const currCell = gBoard[cellPos.i][cellPos.j]
    if (currCell.isShown) return

    currCell.isMarked = !currCell.isMarked

    if (currCell.isMarked) {
        gGame.markedCount++
        elCell.classList.add("marked")
        checkGameOver()
    } else {
        elCell.classList.remove("marked")
        gGame.markedCount--
    }

}

function showCell(cell, elCell) {
    cell.isShown = true
    gGame.shownCount++
    elCell.querySelector("div").classList.remove("hide")
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

//better name is check victory, but this is according to instructions
function checkGameOver() {
    if (gGame.shownCount + gGame.markedCount === gLevel.size ** 2 &&
        gGame.markedCount === gLevel.mines) {
        gameOver(true)
    }
}

function expandShown(board, elCell,
    i, j) {
    /* NOTE: start with a basic
    implementation that only opens
    the non-mine 1st degree
    neighbors */
    //find relevant cells
    //update the model cell to show
    //update the DOM, remove hide
    console.log('EXPAND')

    // var negsPositions = getNegPositions(i, j, board)

    // for (var i = 0; i < negsPositions.length; i++) {
        
    //     var negRowIdx = negsPositions[i].i
    //     var negColIdx = negsPositions[i].j
    //     var currNeg = board[negRowIdx][negColIdx]

    //     if (!currNeg.isShown && !currNeg.isMine) {
    //         currNeg.isShown = true
    //         gGame.shownCount ++
    //     }
    // }
    // console.log('negsPositions', negsPositions)
}

function revealAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMine) {
                gBoard[i][j].isShown = true
                var currEl = getEl({ i, j })
                currEl.querySelector("div").classList.remove("hide")

            }
        }
    }

}

function gameOver(isVictory = false) {
    var elModal = document.querySelector(".game-over")
    var elModalText = elModal.querySelector("h2")
    if (isVictory) {
        elModalText.innerText = "VICTORY!"
        // console.log('VICTORY!')
    } else {
        elModalText.innerText = "GAME OVER!"
        // console.log('GAME OVER!')
        revealAllMines()
    }
    elModal.classList.remove("hide")
    gGame.isOn = false
}


