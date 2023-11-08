'use strict'

// console.log('hey from util js')

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function getCellsWithVal(val) {
    var cells = []
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j] === val) {
                cells.push({ i, j })
            }
        }
    }
    if (cells.length === 0) return null
    return cells
}