'use strict'

function renderBoard(board, selector) {

    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            var className = `cell`
            const cell = board[i][j]
            var cellType = (cell.isMine) ? BOMB : EMPTY
            var innerText = ' '
            if (i % 2 === 0 && cellType !== BOMB) className += ' oddRow' //add relevant alternating colors to each row
            else if (i % 2 !== 0 && cellType !== BOMB) className += ' evenRow' //I tried with child of and stuff, but it didn't work 😢
            if (cell.isShown) {
                if (cellType === BOMB) className += ' bomb'
                else if (cellType === EMPTY && cell.minesAroundCount > 0) {
                    className += ` num${cell.minesAroundCount}`
                    cellType = cell.minesAroundCount
                }
                innerText = cellType
            } else className += ' isntClicked'
            if (cell.isMarked) innerText = FLAG

            strHTML += `<td class="${className}" onmousedown="onCellClicked(event,${i},${j})">${innerText}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

function getEmptyCell() {
    var emptyCells = []
    for (var i = 0; i < gLevel.Size; i++) {
        for (var j = 0; j < gLevel.Size; j++) {
            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) emptyCells.push({ i, j })
        }
    }
    return emptyCells[getRandomInt(0, emptyCells.length)]
}

function showHint(board, posI, posJ) { //can refactor with expand with a 3rd function to get negs
    var posArr = []
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            // if (i === posI && j === posJ) continue
            if (j < 0 || j > board[i].length - 1) continue
            if (board[i][j].isShown) continue
            var currPos = { posI: i, posJ: j }
            posArr.push(currPos)
            board[i][j].isShown = true
            if (board[i][j].isMarked) {
                gGame.markedCount--
                board[i][j].isMarked = false
                updateFlags()
            }
        }
    }
    renderBoard(board, '.board-container')
    return posArr
}

function setMinesNegsCount(board, posI, posJ) {
    var sum = 0
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (i === posI && j === posJ) continue
            if (j < 0 || j > board[0].length - 1) continue
            if (board[i][j].isMine) sum++
        }
    }
    return sum
}

function updateHints() {
    var elHints = document.querySelector('#hints')
    var hints = ''
    if (gGame.hintsCount === 0) hints = '0 Hints.'
    else for (var i = 0; i < gGame.hintsCount; i++) {
        hints += '💡'
    }
    elHints.innerText = hints
}

function updateTimer(time) {
    var elTime = document.querySelector('#time')
    elTime.innerText = time
}

function updateSmiley(emoji) {
    var elSmiley = document.querySelector('#smiley')
    elSmiley.innerText = emoji
}

function updateFlags() {
    var elFlags = document.querySelector('#flags')
    elFlags.innerText = (gLevel.MINES - gGame.markedCount)
}

function updateSafeClicks() {
    var elSafeText = document.querySelector('#safe-click-text')
    elSafeText.innerText = gGame.safeClickCount
}

function updateMines(minesToPlace) {
    if (!minesToPlace) {
        var text = ''
    } else {
        var text = `: ${minesToPlace}`
    }
    var elMines = document.querySelector('#manual-mines span')
    elMines.innerText = text
}

function updateLives() {
    var elLives = document.querySelector('#lives')
    var lives = ''
    for (var i = 0; i < gGame.livesCount; i++) {
        lives += '♥'
    }
    elLives.innerText = lives
}

function updateScore(score) {
    var elScore = document.querySelector('#best-score')
    if (score >= 10000) elScore.innerText = '∞'
    else elScore.innerText = score
}

function updateMegaBtn(color) {
    var elMegaBtn = document.querySelector('#mega-hint')
    elMegaBtn.style.backgroundColor = color
}

function toggleMegaBtn(isHide) {
    var elBtn = document.querySelector('#mega-hint')
    if (isHide) elBtn.classList.add('hide')
    else elBtn.classList.remove('hide')
}

function toggleMegaView(firstPos, lastPos, show) {

    for (var i = firstPos.i; i <= lastPos.i; i++) {
        for (var j = firstPos.j; j <= lastPos.j; j++) {
            gBoard[i][j].isShown = show
            if (gBoard[i][j].isMarked) {
                gGame.markedCount--
                gBoard[i][j].isMarked = false
                updateFlags()
            }
        }
    }
    renderBoard(gBoard, '.board-container')
}

function startTimer() {
    var startTime = new Date().getTime()
    gGame.timerInterval = setInterval(function () {
        var currentTime = new Date().getTime()
        var elapsedTime = currentTime - startTime
        var seconds = Math.floor(elapsedTime / 1)
        gGame.secsPassed = parseInt(seconds / 1000)
        updateTimer(`${gGame.secsPassed}`)
    }, 1000)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

function playSound(fileName) {
    var audio = new Audio(`sounds/${fileName}.mp3`)
    audio.volume = 0.01
    audio.play()
}


//todo: use this
// location is an object like this - { i: 2, j: 7 }
// function renderCell(location, value) {
//     // Select the elCell and set the value
//     const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
//     elCell.innerHTML = value
// }