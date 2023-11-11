'use strict'

const MINE = '💥'
const NORMAL = '😃'
const SAD = '🤯'
const HAPPY = '😎'
const LIFE = '💙'
const NO_LIFE = '💔'

var gBoard
var gLevel
var gGame
var gMegaHint

var gStartTime
var gInterval

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
        hintMode: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        shownMines: 0,
        safeClicks: 3,
    }
    gMegaHint = {
        isOn: false,
        clickCount: 0,
        firstCoors: { i: -1, j: -1 },
        secCoors: { i: -1, j: -1 }
    }

    gBoard = buildBoard(gLevel.size, gLevel.mines)
    console.log('gBoard', gBoard)
    renderBoard(gBoard)

    updateLives()
    updateMinesDisplay()
    restartScreen()
}

function restartScreen() {

    const elGameOverTxt = document.querySelector(".game-over")
    elGameOverTxt.classList.add("hide")

    const elHelper = document.querySelector(".user-helpers")
    elHelper.classList.add("disabeled-cursor")

    const elHintsDiv = elHelper.querySelector(".hints")
    elHintsDiv.classList.add("disabeled")
    const elHints = elHintsDiv.querySelectorAll("div")
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].classList.remove("used")
    }

    const elMegaHint = elHelper.querySelector(".mega-hint button")
    elMegaHint.classList.remove("used")

    const elSafeClick = elHelper.querySelector(".safe-click")
    const elSafeClickSpan = elSafeClick.querySelector("span")
    elSafeClickSpan.innerText = gGame.safeClicks
    const elSafeClickBtn = elSafeClick.querySelector("button")
    elSafeClickBtn.classList.remove("used")

    const elBoard = document.querySelector(".board")
    elBoard.classList.remove("mega-hint")

    clearInterval(gInterval)
    document.querySelector('.timer span').innerText = "0.000"

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
    const elLives = document.querySelector(".lives div")
    var htmlStr = ""
    for (var i = 0; i < gLevel.lives; i++) {
        htmlStr += `<span>${LIFE}</span>`
    }
    if (!gLevel.lives) htmlStr = `<span>${NO_LIFE}</span>`
    elLives.innerHTML = htmlStr
}

function updateMinesDisplay() {
    const minesShown = getLivesNum(gLevel.size) - gLevel.lives
    var elMinesSpan = document.querySelector(".mines span")

    elMinesSpan.innerText = gLevel.mines - gGame.markedCount - minesShown
    markTextToggle(elMinesSpan)
}

function markTextToggle(elSpan) {
    elSpan.classList.add("big")
    setTimeout(() => {
        elSpan.classList.remove("big")
    }, 500, elSpan)
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
        startTimer()

        //intitiate board with mines DOM and model
        setMines(gBoard, gLevel.mines, { i, j })
        setMinesAroundCount(gBoard)
        renderCellsContent(gBoard)
        hintModeOff() //enables click on hints after 1st click

        const elHelper = document.querySelector(".user-helpers")
        elHelper.classList.remove("disabeled-cursor")
    }

    if (gGame.hintMode) {
        expandShown(gBoard, i, j, true, elCell, false)
        setTimeout(expandShown, 1000, gBoard, i, j, true, elCell, true)
        hintModeOff()
        return
    }

    if (gMegaHint.isOn) {
        if (gMegaHint.clickCount === 0) {
            gMegaHint.firstCoors.i = i
            gMegaHint.firstCoors.j = j
            // console.log('firstCoors', gMegaHint.firstCoors)
            gMegaHint.clickCount++

        } else {
            gMegaHint.secCoors.i = i
            gMegaHint.secCoors.j = j
            // console.log('secCoors', gMegaHint.secCoors)
            megaHintHandler()
            gMegaHint.isOn = false
            const elBoard = document.querySelector(".board")
            elBoard.classList.remove("mega-hint")
        }
        return
    }

    const currCell = gBoard[i][j]
    if (currCell.isShown || currCell.isMarked) return

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
    if (!gGame.isOn || gGame.hintMode || gMegaHint.isOn) return

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

    if (forHint && !board[i][j].isShown) toggleShowElCell(elCell, toHide)

    for (var i = 0; i < negsPositions.length; i++) {
        var negRowIdx = negsPositions[i].i
        var negColIdx = negsPositions[i].j
        var currNeg = board[negRowIdx][negColIdx]
        var elNeg = getEl({ i: negRowIdx, j: negColIdx })

        if (!forHint) {
            if (!currNeg.isShown && !currNeg.isMarked) {
                if (currNeg.minesAroundCount === 0) {
                    onCellClicked(elNeg, negRowIdx, negColIdx)
                } else showCell(currNeg, elNeg)
            }
        } else {
            if (!currNeg.isShown) toggleShowElCell(elNeg, toHide)
        }
    }
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

/********** end of game funcs **********/

function checkGameOver() {
    const cellsNum = gLevel.size ** 2
    if ((gGame.shownCount + gGame.markedCount === cellsNum) &&
        areMarkedsCorrect()) {
        gameOver(true)
    }
}

function gameOver(isVictory = false) {
    const elGameOverTxt = document.querySelector(".game-over")

    gGame.isOn = false
    stopTimer()

    if (isVictory) {
        elGameOverTxt.innerText = "VICTORY!"
        restartBtnChange(HAPPY)

        // const elScore = document.querySelector(".timer span")
        // const currScore = +elScore.innerText
        // gGame.secsPassed = currScore
        // updateBestScore()

    } else {
        elGameOverTxt.innerText = "GAME OVER!"
        restartBtnChange(SAD)
        revealAllMines()
    }
    elGameOverTxt.classList.remove("hide")

    

    const elHintsDiv = document.querySelector(".hints")
    elHintsDiv.classList.add("disabeled")
    const elHelper = document.querySelector(".user-helpers")
    elHelper.classList.add("disabeled-cursor")

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

/********** extra features - hints funcs **********/

function onHint(elHint) {
    if (!gGame.isOn || !gGame.firstClick || gMegaHint.isOn) {
        console.log('hints not available ')
        return
    }

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

function onMegaHint(elMegaHint) {

    if (!gGame.isOn || !gGame.firstClick || gGame.hintMode) {
        console.log('mega hint not available ')
        return
    }
    console.log('mega hint!')
    gMegaHint.isOn = true
    elMegaHint.classList.add("used")

    const elBoard = document.querySelector(".board")
    elBoard.classList.add("mega-hint")

}

function megaHintHandler() {

    const firstRoxIdx = gMegaHint.firstCoors.i
    const firstColIdx = gMegaHint.firstCoors.j

    const secRoxIdx = gMegaHint.secCoors.i
    const secColIdx = gMegaHint.secCoors.j

    const rowIdxStart = (firstRoxIdx > secRoxIdx) ? secRoxIdx : firstRoxIdx
    const rowIdxEnd = (firstRoxIdx > secRoxIdx) ? firstRoxIdx : secRoxIdx
    const colIdxStart = (firstColIdx > secColIdx) ? secColIdx : firstColIdx
    const colIdxEnd = (firstColIdx > secColIdx) ? firstColIdx : secColIdx

    const areaIdxs = []
    for (var i = rowIdxStart; i <= rowIdxEnd; i++) {
        for (var j = colIdxStart; j <= colIdxEnd; j++) {
            areaIdxs.push({ i, j })
        }
    }
    // console.log('areaIdxs',areaIdxs)
    if (!areaIdxs.length) return

    for (var i = 0; i < areaIdxs.length; i++) {
        var currCell = gBoard[areaIdxs[i].i][areaIdxs[i].j]
        var curElCell = getEl({ i: areaIdxs[i].i, j: areaIdxs[i].j })
        if (!currCell.isShown) {
            toggleShowElCell(curElCell, false)
            setTimeout(toggleShowElCell, 1000, curElCell, true)
        }
    }
}

/********** extra features - safe click funcs **********/

function onSafeClick() {

    if (gGame.safeClicks === 0 || !gGame.isOn || !gGame.firstClick) {
        console.log('safes are not available ')
        return
    }

    // console.log('safe!')
    gGame.safeClicks--

    const elSafeClick = document.querySelector(".safe-click")
    const elSafeClickSpan = elSafeClick.querySelector("span")
    elSafeClickSpan.innerText = gGame.safeClicks

    if (gGame.safeClicks === 0) {
        var elSafeClickBtn = elSafeClick.querySelector("button")
        elSafeClickBtn.classList.add("used")
    }

    //find in model a cell that is not mine, not shown:
    const safeCells = getSafeCell(gBoard)
    if (!safeCells) {
        console.log('no safe cells on the board')
        return
    }
    const randIdx = getRandomInt(0, safeCells.length)
    const randSafeCell = safeCells[randIdx]
    const rowIdx = randSafeCell.i
    const colIdx = randSafeCell.j

    //find the matching el in dom, make it cjange its look
    const elSafeCell = getEl({ i: rowIdx, j: colIdx })
    elSafeCell.classList.add("safe")

    setTimeout(() => {
        elSafeCell.classList.remove("safe")
    },
        1000, elSafeCell)

}

function getSafeCell(board) {
    const safeCoors = []

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j]
            if (!currCell.isMine && !currCell.isShown) {
                safeCoors.push({ i, j })
            }
        }
    }
    if (safeCoors.length === 0) return null
    return safeCoors
}

/********** timer funcs **********/

function startTimer() {
    clearInterval(gInterval)
    gStartTime = new Date().getTime()
    gInterval = setInterval(updateTimer, 37)
}

function updateTimer() {
    const currentTime = new Date().getTime()
    const elapsedTime = (currentTime - gStartTime) / 1000
    document.querySelector('.timer span').innerText = elapsedTime.toFixed(3)
}

function stopTimer() {
    clearInterval(gInterval)
}

/********** extra features - dark mode **********/

function onDarkMode() {
    const elCheckbox = document.querySelector("input")
    const elBody = document.querySelector("body")
    if (elCheckbox.checked) {
        elBody.classList.add("dark")
    } else {
        elBody.classList.remove("dark")
    }
}

/********** extra features - keep best score **********/

// function updateBestScore() {
//     const elScore = document.querySelector(".scores span")
    
//     if (typeof (Storage) !== "undefined") {
//         console.log('storage!')
//         if (localStorage.score4) {
//             if (gGame.secsPassed < localStorage.score4) {
//                 localStorage.score4 = gGame.secsPassed
//                 elScore.innerText = localStorage.score4
//                 console.log('good score')
//         } else {
//                 localStorage.score4 = gGame.secsPassed
//                  console.log('prev score better')
//             }
//         }
//     } else {
//         elScore.innerHTML = "Sorry, your browser does not support web storage..."
//     }
// }