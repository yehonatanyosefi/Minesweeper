'use strict'

const EMPTY = ''
const BOMB = '💣'
const FLAG = '🚩'
const SMILEY = '😀'

var gBoard
const gGame = {}
const gLevel = { DIFFICULTY: 0, }

document.addEventListener('contextmenu', event => event.preventDefault()) //disable context menu

//make fully working game - V
//refactor variables and functions with CA verbiage, because I didn't have pdf - V
//first click isn't a mine - V
//3 lives - V
//smiley - V
//3 hints - V
//best score - V - couldn't make it array so split it into 3
//full expand - V
//safe click - V - do you want me to notify the user when the 3 ends?
//manually positioned mines
//undo
//Dark Mode
//mega Hint
//mine exterminator
//ITP - renderCell() instead of renderBoard()
//ITP - refactor things to use more functions and make it more readable
//ITP - add comments everywhere

function init() {
    setGlobals()

    resetElements()

    gBoard = buildBoard()

    renderBoard(gBoard, '.board-container')

    gGame.isOn = true
}

function setGlobals() {
    clearInterval(gGame.timerInterval)
    gGame.markedCount = 0
    gGame.shownCount = 0
    gGame.timerInterval = null
    gGame.secsPassed = 0
    gGame.livesCount = 3
    gGame.hintsCount = 3
    gGame.safeClickCount = 3
    gGame.isHint = false
    switch (gLevel.DIFFICULTY) {
        case 0:
            if (!localStorage.scoreEasy) localStorage.scoreEasy = Infinity
            gLevel.MINES = 2
            gLevel.Size = 4
            break
        case 1:
            if (!localStorage.scoreMedium) localStorage.scoreMedium = Infinity
            gLevel.MINES = 14
            gLevel.Size = 8
            break
        case 2:
            if (!localStorage.scoreExpert) localStorage.scoreExpert = Infinity
            gLevel.MINES = 32
            gLevel.Size = 12
            break
    }
}

function resetElements() {
    updateFlags()
    updateLives()
    updateSmiley(SMILEY)
    updateTimer('0')
    updateHints()
    updateScore(getScore())
}

function getScore() {
    switch (gLevel.DIFFICULTY) {
        default:
            return localStorage.scoreEasy
            break
        case 1:
            return localStorage.scoreMedium
            break
        case 2:
            return localStorage.scoreExpert
            break
    }
}

function setDifficulty(diffLevel) {
    gLevel.DIFFICULTY = diffLevel
    init()
}

function buildBoard() {
    const size = gLevel.Size
    const board = []
    for (var i = 0; i < size; i++) {
        board[i] = []

        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }
    return board
}

function createBombs(posI, posJ) {
    for (var i = 0; i < gLevel.MINES; i++) {
        createBomb(posI, posJ)
    }
}

function createBomb(posI, posJ) {
    var newPosI = getRandomInt(1, gLevel.Size)
    var newPosJ = getRandomInt(1, gLevel.Size)
    if (gBoard[newPosI][newPosJ].isMine === true || (newPosI === posI && newPosJ === posJ)) createBomb(posI, posJ) //recursion to create in another spot if it's already occupied or if it's first click
    else gBoard[newPosI][newPosJ].isMine = true
}

function createNumbers() {
    for (var i = 0; i < gLevel.Size; i++) {
        for (var j = 0; j < gLevel.Size; j++) {
            if (gBoard[i][j].isMine === true) continue
            var num = setMinesNegsCount(gBoard, i, j)
            gBoard[i][j].minesAroundCount = num
        }
    }
}

function onCellClicked(elCell, posI, posJ) {
    if (!gGame.isOn) return
    var currCell = gBoard[posI][posJ]
    if (currCell.isShown || (currCell.isMarked && elCell.button === 0)) return
    if (elCell.button === 2) {    //make or break flag
        if (gGame.markedCount === gLevel.MINES && !currCell.isMarked) return
        currCell.isMarked = !currCell.isMarked
        gGame.markedCount = (currCell.isMarked) ? gGame.markedCount + 1 : gGame.markedCount - 1
        updateFlags()
        renderBoard(gBoard, '.board-container') //renders all board TODO: refactor to each cell
        return
    } else if (elCell.button !== 0) return //make it only work for the two mouse buttons and not the scrollwheel or other gaming mouse buttons

    if (!gGame.timerInterval) { //make board without bombs on the first cell, and start timer on firstclick
        firstClick(posI, posJ)
        startTimer()
    }
    if (gGame.isHint) {
        handleHint(posI, posJ)
        gGame.isHint = false
        return
    }
    if (currCell.isMine) {
        if (gGame.livesCount === 0) currCell.isShown = true
        checkGameOver(false)
    } else {
        currCell.isShown = true
        gGame.shownCount++
        playSound('correct')
        if (currCell.minesAroundCount === 0) expandShown(posI, posJ)
    }
    if (gGame.shownCount === (gLevel.Size ** 2 - gLevel.MINES)) checkGameOver(true)
    renderBoard(gBoard, '.board-container') //renders all board TODO: refactor to each cell
}

function onHintClick() {
    if (gGame.hintsCount === 0 || !gGame.isOn || !gGame.timerInterval || gGame.isHint) return
    gGame.hintsCount--
    gGame.isHint = true
    updateHints()
}

function handleHint(posI, posJ) {
    var negs = showHint(gBoard, posI, posJ)
    gGame.isOn = false
    setTimeout(() => { //restores
        for (var i = 0; i < negs.length; i++) {
            var posI = negs[i].posI
            var posJ = negs[i].posJ
            gBoard[posI][posJ].isShown = false
        }
        renderBoard(gBoard, '.board-container')
        gGame.isOn = true
    }, 1000);
}

function onSafeClick() {
    if (gGame.safeClickCount === 0 || !gGame.isOn || !gGame.timerInterval) return
    gGame.safeClickCount--
    handleSafeClick()
}
function handleSafeClick() {
    var emptyCell = getEmptyCell()
    var posI = emptyCell.i
    var posJ = emptyCell.j
    gBoard[posI][posJ].isShown = true
    renderBoard(gBoard, '.board-container')
    gGame.isOn = false
    setTimeout(() => { //restores
        gBoard[posI][posJ].isShown = false
        renderBoard(gBoard, '.board-container')
        gGame.isOn = true
    }, 1000);
}

function checkGameOver(isWin) {
    if (isWin) { //win
        clearInterval(gGame.timerInterval)
        showAllMines(isWin)
        gGame.markedCount = gLevel.MINES
        updateFlags()
        updateSmiley('😎')
        playSound('win')
        switch (gLevel.DIFFICULTY) {
            case 0:
                if (gGame.secsPassed < localStorage.scoreEasy) {
                    localStorage.scoreEasy = gGame.secsPassed
                    updateScore(localStorage.scoreEasy)
                }
                break
            case 1:
                if (gGame.secsPassed < localStorage.scoreMedium) {
                    localStorage.scoreMedium = gGame.secsPassed
                    updateScore(localStorage.scoreMedium)
                }
                break
            case 2:
                if (gGame.secsPassed < localStorage.scoreExpert) {
                    localStorage.scoreExpert = gGame.secsPassed
                    updateScore(localStorage.scoreExpert)
                }
                break
        }
        gGame.isOn = false
        return
    } else {
        if (gGame.livesCount > 0) { //lose life
            gGame.livesCount--
            updateLives()
            playSound('error')
        } else { //game over
            clearInterval(gGame.timerInterval)
            updateSmiley('🤯')
            showAllMines(isWin)
            playSound('game_lose')
            gGame.isOn = false
        }

    }
}

function expandShown(posI, posJ) { //why gBoard and elCell?
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (i === posI && j === posJ) continue
            if (j < 0 || j > gBoard[i].length - 1) continue
            var currCell = gBoard[i][j]
            if (currCell.isShown) continue
            if (currCell.isMarked) continue
            if (currCell.isMine === true) continue
            currCell.isShown = true //explodes for empty or num
            gGame.shownCount++
            if (!currCell.isMine && currCell.minesAroundCount === 0) expandShown(i, j) //recursion for empty ones
        }
    }
}

function showAllMines(isWin) { //all mines reveal or all flags reveal
    for (var i = 0; i < gLevel.Size; i++) {
        for (var j = 0; j < gLevel.Size; j++) {
            if (gBoard[i][j].isMine === true) {
                if (!isWin) gBoard[i][j].isShown = true
                else gBoard[i][j].isMarked = true
            }
        }
    }
    renderBoard(gBoard, '.board-container')
}

function firstClick(posI, posJ) {
    createBombs(posI, posJ)
    createNumbers()
}