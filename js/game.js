'use strict'

const EMPTY = ''
const BOMB = '💣'
const FLAG = '🚩'
const SMILEY = '😀'

var gBoard
const gGame = {}
const gLevel = { DIFFICULTY: 0, }
var isBgMusic = false

document.addEventListener('contextmenu', event => event.preventDefault()) //disable context menu

//make fully working game - V
//refactor variables and functions with CA verbiage, because I didn't have pdf - V
//first click isn't a mine - V
//3 lives - V
//smiley - V
//3 hints - V
//best score - V - couldn't make it array so split it into 3
//full expand - V
//safe click - V
//manually positioned mines - V
//undo - V - I don't need to undo after a game over right? or when I use the special features undo them right?
//Dark Mode - CBA
//mega Hint - V
//mine exterminator - V
//ITP - renderCell() instead of renderBoard()
//ITP - refactor things to use more functions and make it more readable, like left mouse click and right mouse click
//ITP - add comments everywhere
function init() {
    if (gGame.isMega) {
        playSound('error')
        return
    }
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
    gGame.MinesPlaced = 0
    gGame.isManualMines = false
    gGame.isHint = false
    gGame.undoPosArr = []
    gGame.undoPosCount = []
    gGame.exterminate = false
    gGame.mineArr = []
    gGame.isMega = false
    gGame.megaFirstPos = {}
    gGame.megaFirstPress = false
    // var score = JSON.parse(localStorage.getItem('score'))
    // if (!score) {
    //     localStorage.setItem('score',JSON.stringify([0,1,2])) //makes score array first time
    //     var score = JSON.parse(localStorage.getItem('score'))
    //     for (var i = 0; i < 3; i++) {
    //         score[i] = Infinity
    //     }
    //     console.log('score[i]',score[i])
    // }
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
    // var score = JSON.parse(localStorage.getItem('score'))[gLevel.DIFFICULTY]
    // updateScore(score)
    updateScore(getScore())
    updateSafeClicks()
    updateMines('')
    toggleMegaBtn(false)
    updateMegaBtn('darkblue')
    var elExterminate = document.querySelector('#exterminator')
    elExterminate.classList.remove('hide')
    if (!isBgMusic) {
        playSound('bg_music', 0.25, true)
        isBgMusic = true
    }
}

function getScore() { //wish I can make it an array instead of this **** thing
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

function setDifficulty(diffLevel) { //should I rename it to onClickDifficulty? can't get used to naming conventions
    if (gGame.isMega) return
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

function createBomb(posI, posJ) { //I chose recursion because I think it's cheaper complexity in our use case
    var newPosI = getRandomInt(1, gLevel.Size)
    var newPosJ = getRandomInt(1, gLevel.Size)
    if (gBoard[newPosI][newPosJ].isMine === true || (newPosI === posI && newPosJ === posJ)) createBomb(posI, posJ) //recursion to create in another spot if it's already occupied or if it's first click
    else {
        gBoard[newPosI][newPosJ].isMine = true
        var posObj = {i:newPosI,j:newPosJ}
        gGame.mineArr.push(posObj)
    }
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
    if (gGame.isHint && elCell.button === 0) {
        handleHint(posI, posJ)
        gGame.isHint = false
        return
    } else if (gGame.isMega && elCell.button === 0) {
        if (!gGame.megaFirstPress) {
            var posObj = {i:posI, j:posJ}
            gGame.megaFirstPos = posObj
            gGame.megaFirstPress = true
            updateMegaBtn('orange')
        } else {
            var firstPos = gGame.megaFirstPos
            var lastPos = {i: posI, j: posJ}
            if (firstPos.i > lastPos.i || firstPos.j > lastPos.j) {
                playSound('error')
                return
            }
            updateMegaBtn('yellowgreen')
            var oldShown = toggleMega(gBoard, firstPos, lastPos, true, [])
            setTimeout(() => {
                toggleMega(gBoard, firstPos, lastPos, false, oldShown)
                toggleMegaBtn(true)
                gGame.isOn = true
                gGame.isMega = false
            }, 2000);
        }
        return
    }
    if (!gGame.isOn) return
    var currCell = gBoard[posI][posJ]
    if (currCell.isShown || (currCell.isMarked && elCell.button === 0)) return
    if (elCell.button === 2) { //make or break flag
        if (gGame.markedCount >= gLevel.MINES && !currCell.isMarked) return
        currCell.isMarked = !currCell.isMarked
        gGame.markedCount = (currCell.isMarked) ? gGame.markedCount + 1 : gGame.markedCount - 1
        updateFlags()
        renderBoard(gBoard, '.board-container') //renders all board TODO: refactor to each cell
        return
    } else if (elCell.button !== 0) return //make it only work for the two mouse buttons and not the scrollwheel or other gaming mouse buttons

    if (gGame.isManualMines) {
        if (currCell.isMine) return
        if (gGame.MinesPlaced !== gLevel.MINES) {
            currCell.isMine = true
            gGame.MinesPlaced++
            updateMines(gLevel.MINES - gGame.MinesPlaced)
            return
        } else {
            createNumbers()
            startTimer()
            gGame.isManualMines = false
        }
    } else if (!gGame.timerInterval) { //make board without bombs on the first cell, and start timer on firstclick
        handleFirstClick(posI, posJ)
        startTimer()
    }

    if (currCell.isMine) {
        if (gGame.livesCount === 0) currCell.isShown = true
        checkGameOver(false)
    } else {
        currCell.isShown = true
        gGame.shownCount++
        playSound('correct')
        var posObj = { i: posI, j: posJ }
        gGame.undoPosArr.unshift(posObj)
        gGame.undoPosCount.unshift(1)
        if (currCell.minesAroundCount === 0) expandShown(posI, posJ)
    }
    if (gGame.shownCount === (gLevel.Size ** 2 - gLevel.MINES)) checkGameOver(true)
    renderBoard(gBoard, '.board-container') //renders all board TODO: refactor to each cell
}

function onUndoClick() {
    if (!gGame.timerInterval) return
    if (!gGame.undoPosArr[0]) return
    for (var i = 0; i < gGame.undoPosCount[0]; i++) {
        var pos = gGame.undoPosArr.shift()
        gBoard[pos.i][pos.j].isShown = false
        gGame.shownCount--
    }
    gGame.undoPosCount.shift()
    renderBoard(gBoard, '.board-container')
}

function onHintClick() {
    if (gGame.hintsCount === 0 || !gGame.isOn || !gGame.timerInterval || gGame.isHint || gGame.isMega) return
    gGame.hintsCount--
    gGame.isHint = true
    updateHints()
}

function onManualMinesClick() {
    if (gGame.isManualMines) {
        init()
    } else {
        init()
        gGame.isManualMines = true
        updateMines(gLevel.MINES)
    }
}

function onSafeClick() {
    if (gGame.safeClickCount === 0 || !gGame.isOn || !gGame.timerInterval) return
    gGame.safeClickCount--
    updateSafeClicks()
    handleSafeClick()
}

function onExterminateClick() {
    if (gGame.exterminate || !gGame.timerInterval || gLevel.DIFFICULTY === 0) return
    playSound('exterminate')
    gGame.exterminate = true
    for (var i = 0; i < 3; i++) {
        var pos = gGame.mineArr[getRandomInt(0,gGame.mineArr.length)]
        gBoard[pos.i][pos.j].isMine = false
    }
    createNumbers()
    renderBoard(gBoard, '.board-container')
    gGame.markedCount += 3
    updateFlags()
    var elExterminate = document.querySelector('#exterminator')
    elExterminate.classList.add('hide')
}

function onMegaHint() {
    if (!gGame.timerInterval || !gGame.isOn || gGame.isHint || gGame.isMega) return
    if (!gGame.megaFirstPos.i) gGame.isMega = !gGame.isMega
    if (gGame.isMega) {
        updateMegaBtn('lightblue')
        playSound('mega')
        gGame.isOn = false
    }
}

function handleFirstClick(posI, posJ) {
    createBombs(posI, posJ)
    createNumbers()
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
        
        // var score = JSON.parse(localStorage.getItem('score'))
        // console.log('score',score[gLevel.DIFFICULTY])
        // console.log('gGame.secsPassed',gGame.secsPassed)
        // if (gGame.secsPassed < score[gLevel.DIFFICULTY]) score[gLevel.DIFFICULTY] = gGame.secsPassed
        switch (gLevel.DIFFICULTY) { //hope to make this an array
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
            var posObj = { i, j }
            gGame.undoPosArr.unshift(posObj)
            gGame.undoPosCount[0]++
            if (!currCell.isMine && currCell.minesAroundCount === 0) expandShown(i, j) //recursion for empty ones
        }
    }
}

function showAllMines(isWin) { //all mines reveal or all flags reveal
    for (var i = 0; i < gLevel.Size; i++) {
        for (var j = 0; j < gLevel.Size; j++) {
            if (gBoard[i][j].isMine === true) {
                if (!isWin) {
                    gBoard[i][j].isShown = true
                    gBoard[i][j].isMarked = false
                }
                else gBoard[i][j].isMarked = true
            }
        }
    }
    renderBoard(gBoard, '.board-container')
}
