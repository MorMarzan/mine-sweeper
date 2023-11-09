'use strict'

const MINE = '💥'
const NORMAL = '😃'
const SAD = '🤯'
const HAPPY = '😎'

var gBoard
var gLevel
var gGame

/********** game initiation funcs **********/

function onInit(size = 4) {
    gLevel = {
        size,
        mines: getMinesNum(size),
        lives: getLivesNum(size)
    }
    gGame = {
        isOn: true,
        firstClick: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        shownMines: 0
    }

    gBoard = buildBoard(gLevel.size, gLevel.mines)
    console.log('gBoard', gBoard)
    renderBoard(gBoard)

    updateLives()
    updateMinesDisplay()
    restartScreen()
}

function restartScreen() {
    const elModal = document.querySelector(".game-over")
    elModal.classList.add("hide")

    const elHintsDiv = document.querySelector(".hints")
    elHintsDiv.classList.add("disabeled")
    const elHints = elHintsDiv.querySelectorAll("div")
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].classList.remove("used")
    }

    restartBtnChange(NORMAL)

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

function getLivesNum(size) {
    switch (size) {
        case 4:
            return 2
            break;
        default:
            return 3
    }
}

function restartBtnChange(img) {
    const elRestartBtn = document.querySelector(".restart button")
    elRestartBtn.innerText = img
}

function updateLives() {
    var elLivesSpan = document.querySelector(".lives span")
    elLivesSpan.innerText = gLevel.lives 
}

function updateMinesDisplay() {
    const minesShown = getLivesNum(gLevel.size) - gLevel.lives
    var elMinesSpan = document.querySelector(".mines span")

    elMinesSpan.innerText = gLevel.mines - gGame.markedCount - minesShown
}

/********** model setting board funcs **********/

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
    return board
}

function setMines(board, minesNum, firstClickPos) {
    // static location for development
    // board[0][0].isMine = true
    // board[0][1].isMine = true

    //random
    var possiblePositions = getMatPositions(board)
    const firstClickIdx = firstClickPos.i * board.length + firstClickPos.j
    possiblePositions.splice(firstClickIdx, 1)

    /* maybe later - mimic the original game better by not allowing also the negs of the first click to be a mine, meaning splicing them from possiblePositions as well
    do it by creating a copy of the board, receive first position getNegPositions(), cut it and the first pos itself from the copy, then use getMatPositions and starr the loop below */

    for (var i = 0; i < minesNum; i++) {
        var randomPos = getRandomInt(0, possiblePositions.length)
        var rowIdx = possiblePositions[randomPos].i
        var colIdx = possiblePositions[randomPos].j
        // console.log('mine in', {rowIdx, colIdx})
        board[rowIdx][colIdx].isMine = true
        possiblePositions.splice(randomPos, 1)

    }
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

/********** DOM rendering board funcs **********/

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

function renderCellsContent(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j]
            var elCellContent = getEl({ i, j }).querySelector("div")
            var cellContent = currCell.isMine ? MINE : currCell.minesAroundCount
            elCellContent.innerText = cellContent
        }
    }
}

/********** on click funcs **********/

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return

    if (!gGame.firstClick) {
        // console.log('1st click!')
        gGame.firstClick = true

        //intitiate board with mines DOM and model
        setMines(gBoard, gLevel.mines, { i, j })
        setMinesAroundCount(gBoard)
        renderCellsContent(gBoard)
        hintModeOff() //enables click on hints after 1st click
    }

    const currCell = gBoard[i][j]
    if (currCell.isShown || currCell.isMarked) return

    if (gGame.hintMode) {
        expandShown(gBoard, i, j, true, elCell, false)
        setTimeout(expandShown, 1000, gBoard, i, j, true, elCell, true)
        hintModeOff()
        return
    }

    if (currCell.isMine) {
        gLevel.lives--
        updateLives()
        updateMinesDisplay()
        if (!gLevel.lives) {
            gameOver(false)
            return
        }
        // restartBtnChange(SAD) //location doesnt fit - if the game ends with openning mine, but enough lives for victory
        // setTimeout(restartBtnChange, 1000, NORMAL)
    }

    showCell(currCell, elCell)

    //("safe cell") -> expand
    if (!currCell.minesAroundCount && !currCell.isMine) {
        expandShown(gBoard, i, j)
    }

    checkGameOver()

}

function onCellMarked(event, elCell) {
    // Called when a cell is right-clicked 
    // console.log('right Clicked')
    event.preventDefault()
    if (!gGame.isOn || gGame.hintMode) return

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
    updateMinesDisplay()
}

function expandShown(board, i, j, forHint = false, elCell = null, toHide = null) {
    var negsPositions = getNegPositions(i, j, board)

    if (forHint) toggleShowElCell(elCell, toHide)

    for (var i = 0; i < negsPositions.length; i++) {
        var negRowIdx = negsPositions[i].i
        var negColIdx = negsPositions[i].j
        var currNeg = board[negRowIdx][negColIdx]
        var elNeg = getEl({ i: negRowIdx, j: negColIdx })

        if (!forHint) {
            if (!currNeg.isShown && !currNeg.isMarked) {
                showCell(currNeg, elNeg)
                // !currNeg.isMine //not relevant to check because - it wont enter this func since it's only for safe cells
            }
        } else {
            if (!currNeg.isShown) toggleShowElCell(elNeg, toHide)
        }
    }  
}

//updating show mode in DOM and model 
function showCell(cell, elCell) {
    cell.isShown = true
    gGame.shownCount++
    elCell.querySelector("div").classList.remove("hide")
}

//toggle show in model only
function toggleShowElCell(elCell, toHide) {
    const elCellContent = elCell.querySelector("div")

    if (toHide) elCellContent.classList.add("hide")
    else elCellContent.classList.remove("hide")
}

/********** helpers funcs funcs **********/

//extracts DOM el from model. loc {i,j}
function getEl(location) {
    const selector = `[data-i="${location.i}"][data-j="${location.j}"]`
    return document.querySelector(selector)
}

//extracts model pos from DOM
function getBoardPos(elCell) {
    const rowIdx = elCell.dataset.i
    const colIdx = elCell.dataset.j
    return { i: rowIdx, j: colIdx }
}

/********** end of game funcs **********/

//updating mine revealing in DOM and model 
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

//better name is check victory, but this is according to instructions
function checkGameOver() {
    const cellsNum = gLevel.size ** 2
    if ((gGame.shownCount + gGame.markedCount === cellsNum) &&
        areMarkedsCorrect()) {
        gameOver(true)
    }
}

function areMarkedsCorrect() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMine && currCell.isMarked) {
                return false
            }
        }
    }
    return true
}

function gameOver(isVictory = false) {
    const elModal = document.querySelector(".game-over")
    const elModalText = elModal.querySelector("h2")

    if (isVictory) {
        elModalText.innerText = "VICTORY!"
        restartBtnChange(HAPPY)
    } else {
        elModalText.innerText = "GAME OVER!"
        restartBtnChange(SAD)
        revealAllMines()
    }
    elModal.classList.remove("hide")

    gGame.isOn = false
    
    const elHintsDiv = document.querySelector(".hints")
    elHintsDiv.classList.add("disabeled")
}

/********** bonus funcs - before sorting **********/

function onHint(elHint) {
    gGame.hintMode = true
    elHint.classList.add("used")

    //disable another hint click when hintMode is on:
    const elHintsDiv = document.querySelector(".hints")
    elHintsDiv.classList.add("disabeled")
}

function hintModeOff() {
    gGame.hintMode = false
    const elHintsDiv = document.querySelector(".hints")
    elHintsDiv.classList.remove("disabeled")
}