'use strict';

const WALL = 'WALL';
const FLOOR = 'FLOOR';
const CRATE = 'CRATE';
const GAMER = 'GAMER';
const TARGET = 'TARGET';
const CLOCK = 'CLOCK';
const GOLD = 'GOLD';
const MAGNET = 'MAGNET';
const WATER = 'WATER';
const GLUE = 'GLUE';

const GAMER_IMG = '🚶‍♂️';
const CRATE_IMG = '📦';
const TARGET_IMG = '🔴';
const CLOCK_IMG = '🕑';
const GOLD_IMG = '🏆';
const MAGNET_IMG = '🧲';
const WATER_IMG = '💦';
const GLUE_IMG = '🍯';

var gBoard;
var gGamerPos;
var gGamerPrevPos;
var gScore = 100;
var gStepsCount = 0;
var gIsGameOver = false;
var gIsMagnet = false;
var gMagnetInterval;
var gIsWater = false;
var gIsGlued = false;
var gWinCount = 0;
var gGoldInterval;
var gClockInterval;
var gUndoStore = [];
var gUndoPlayer = [];

function initGame() {
  gIsGameOver = false;
  gGamerPos = { i: 4, j: 4 };
  gBoard = buildBoard();
  renderBoard(gBoard);
  hideModal();
  placeElements(GLUE, GLUE_IMG);
  placeElements(GLUE, GLUE_IMG);
  placeElements(WATER, WATER_IMG);
  placeElements(WATER, WATER_IMG);
  setTimeout(function () {
    gGoldInterval = setInterval(function () {
      placeElements(GOLD, GOLD_IMG);
    }, 10000);
  }, 5000);
  setTimeout(function () {
    gClockInterval = setInterval(function () {
      placeElements(CLOCK, CLOCK_IMG);
    }, 10000);
  }, 5000);
  setTimeout(function () {
    gMagnetInterval = setInterval(function () {
      placeElements(MAGNET, MAGNET_IMG);
    }, 10000);
  }, 5000);
  gUndoStore = [];
  gStepsCount = 0;
  gScore = 100;
}

function hideModal() {
  var elRestart = document.querySelector('.restart');
  elRestart.style.display = 'none';
}

function buildBoard() {
  var board = createMat(10, 10);

  // Put FLOOR everywhere and WALL at edges
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      var cell = { type: FLOOR, gameElement: null };

      // var cellPos = { i: i, j: j };

      // Place Walls at edges
      if (
        i === 0 ||
        i === board.length - 1 ||
        j === 0 ||
        j === board[0].length - 1 ||
        (i === 2 && j === 1) ||
        (i === 2 && j === 2) ||
        (i === 3 && j === 2) ||
        (i === 3 && j === 3) ||
        (i === 1 && j === board.length - 2) ||
        (i === 2 && j === board.length - 2) ||
        (i === 3 && j === board.length - 2) ||
        (i === 4 && j === board.length - 2) ||
        (i === board.length - 2 && j === 4) ||
        (i === board.length - 2 && j === 5) ||
        (i === board.length - 2 && j === 6) ||
        (i === board.length - 3 && j === 5)
      ) {
        cell.type = WALL;
      } else if (
        (i === 5 && j === 5) ||
        (i === 2 && j === 4) ||
        (i === 8 && j === 8)
      ) {
        cell.type = TARGET;
      }
      board[i][j] = cell;
    }
  }

  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

  board[4][5].gameElement = CRATE;
  board[7][3].gameElement = CRATE;
  board[5][2].gameElement = CRATE;
  board[5][5].gameElement = TARGET;
  board[2][4].gameElement = TARGET;
  board[8][8].gameElement = TARGET;
  return board;
}

function placeElements(element, img) {
  var randomCell = getEmptyLocation(gBoard);
  if (!randomCell) return;
  gBoard[randomCell.i][randomCell.j].gameElement = element;
  if (element === TARGET) {
    gBoard[randomCell.i][randomCell.j].isTarget = true;
  } else if (element === CLOCK || element === MAGNET || element === GOLD) {
    setTimeout(function () {
      if (gBoard[randomCell.i][randomCell.j].gameElement !== GAMER) {
        gBoard[randomCell.i][randomCell.j].gameElement = null;
        renderCell(randomCell, '');
      }
    }, 5000);
  }
  renderCell(randomCell, img);
}

function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[0].length; j++) {
      var currCell = board[i][j];

      var cellClass = getClassName({ i: i, j: j });

      if (currCell.type === FLOOR || currCell.type === TARGET) {
        cellClass += ' floor';
      } else {
        cellClass += ' wall';
      }

      strHTML += `<td class="cell ${cellClass}" onclick="moveTo(${i},${j})" >`;

      switch (currCell.gameElement) {
        case GAMER:
          strHTML += GAMER_IMG;
          break;
        case CRATE:
          strHTML += CRATE_IMG;
          break;
        case TARGET:
          strHTML += TARGET_IMG;
          break;
      }
      strHTML += '</td>';
    }
    strHTML += '</tr>';
  }

  var elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

function moveTo(i, j) {
  if (gIsGameOver) return;
  if (gIsGlued) return;

  var gGamerPrevPos = { i: i, j: j };
  gUndoPlayer.push(gGamerPrevPos);

  var nextCell = gBoard[i][j];
  // console.log(nextCell);

  var iAbsDiff = Math.abs(i - gGamerPos.i);
  var jAbsDiff = Math.abs(j - gGamerPos.j);

  if (
    (iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0)
  ) {
    //update score with every movement
    if (
      nextCell.type === FLOOR ||
      nextCell.type === TARGET ||
      nextCell.type === WATER
    ) {
      gStepsCount--;
      updateScore(-1);
    }

    if (nextCell.type === WALL) return;
    if (nextCell.gameElement === WATER) {
      gStepsCount += 1;
      updateScore(1);
      return;
    }
    if (nextCell.gameElement === MAGNET) gIsMagnet = true;
    if (nextCell.gameElement === CLOCK) {
      gStepsCount += 11;
      updateScore(11);
    }
    if (nextCell.gameElement === GOLD) {
      gScore + 101;
      updateScore(101);
    }
    if (nextCell.gameElement === GLUE) {
      gIsGlued = true;
      gStepsCount -= 5;
      updateScore(-5);
      setTimeout(function () {
        gIsGlued = false;
      }, 5000);
    }

    // Movements with Crates
    if (nextCell.gameElement === CRATE) {
      var diffI;
      var diffJ;
      var crateDiffI;
      var crateDiffJ;
      //Move left
      if (j < gGamerPos.j) {
        diffI = 0;
        diffJ = -2;
        crateDiffI = 0;
        crateDiffJ = -1;
        return moveWithCrate(diffI, diffJ, crateDiffI, crateDiffJ, i, j);
        //   if (gBoard[gGamerPos.i][gGamerPos.j - 2].type === WALL) {
        //     //Keep Score if next cell is wall
        //     gStepsCount++;
        //     updateScore(+1);
        //     if (gIsMagnet) {
        //       i = i; //+ diffI;
        //       j += 2; // j+diffJ
        //       renderCell(gGamerPos, '');
        //       gGamerPos.i = i;
        //       gGamerPos.j = j;
        //       gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
        //       renderCell(gGamerPos, GAMER);
        //       gBoard[i][j - 1].gameElement = CRATE;
        //       renderCell({ i: i, j: j - 1 }, CRATE_IMG);
        //       gBoard[i][j - 2].gameElement = null;
        //       renderCell({ i, j: j - 2 }, '');
        //       gIsMagnet = false;
        //     } else {
        //       return;
        //     }
        //   }
        //   if (gBoard[gGamerPos.i][gGamerPos.j - 2].gameElement === CRATE) {
        //     //Keep Score if next two cells are crates
        //     gStepsCount++;
        //     updateScore(+1);
        //     return;
        //   }

        //   if (gBoard[gGamerPos.i][gGamerPos.j - 2].gameElement === WATER) {
        //     while (gBoard[i][j - 2].type !== WALL) {
        //       i = i;
        //       j = j - 1;
        //       gStepsCount--;
        //       updateScore(-1);
        //       if (gBoard[i][j - 1].gameElement === CRATE) {
        //         return;
        //       }

        //       renderCell(gGamerPos, '');
        //       gGamerPos.i = i;
        //       gGamerPos.j = j;
        //       gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
        //       renderCell(gGamerPos, GAMER_IMG);
        //       gBoard[i][j - 1].gameElement = CRATE;
        //       renderCell({ i: i, j: j - 1 }, CRATE_IMG);
        //       gBoard[i][j + 1].gameElement = null;
        //       renderCell({ i, j: j + 1 }, '');
        //     }
        //   }

        //   gBoard[i][j - 1].gameElement = CRATE;
        //   renderCell({ i: i, j: j - 1 }, CRATE_IMG);
      }
      // Move right
      if (j > gGamerPos.j) {
        diffI = 0;
        diffJ = +2;
        if (gBoard[gGamerPos.i][gGamerPos.j + 2].type === WALL) {
          gStepsCount--;
          updateScore(+1);
          if (gIsMagnet) {
            i = i;
            j -= 2;
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER);
            gBoard[i][j + 1].gameElement = CRATE;
            renderCell({ i: i, j: j + 1 }, CRATE_IMG);
            gBoard[i][j + 2].gameElement = null;
            renderCell({ i, j: j + 2 }, '');
            gIsMagnet = false;
          } else {
            return;
          }
        }
        if (gBoard[gGamerPos.i][gGamerPos.j + 2].gameElement === CRATE) {
          gStepsCount++;
          updateScore(+1);
          return;
        }

        if (gBoard[gGamerPos.i][gGamerPos.j + 2].gameElement === WATER) {
          while (gBoard[i][j + 2].type !== WALL) {
            i = i;
            j = j + 1;
            gStepsCount--;
            updateScore(-1);
            if (gBoard[i][j + 1].gameElement === CRATE) {
              return;
            }
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER_IMG);
            gBoard[i][j + 1].gameElement = CRATE;
            renderCell({ i: i, j: j + 1 }, CRATE_IMG);
            gBoard[i][j - 1].gameElement = null;
            renderCell({ i: i, j: j - 1 }, '');
          }
        }

        gBoard[i][j + 1].gameElement = CRATE;
        renderCell({ i: i, j: j + 1 }, CRATE_IMG);
      }
      //Move up
      if (i < gGamerPos.i) {
        diffI = -2;
        diffJ = 0;
        if (gBoard[gGamerPos.i - 2][gGamerPos.j].type === WALL) {
          gStepsCount++;
          updateScore(+1);
          if (gIsMagnet) {
            i += 2;
            j = j;
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER_IMG);
            gBoard[i - 1][j].gameElement = CRATE;
            renderCell({ i: i - 1, j: j }, CRATE_IMG);
            gBoard[i - 2][j].gameElement = null;
            renderCell({ i: i - 2, j: j }, '');
            gIsMagnet = false;
          } else {
            return;
          }
        }
        if (gBoard[gGamerPos.i - 2][gGamerPos.j].gameElement === CRATE) {
          gStepsCount++;
          updateScore(+1);
          return;
        }

        if (gBoard[gGamerPos.i - 2][gGamerPos.j].gameElement === WATER) {
          while (gBoard[i - 2][j].type !== WALL) {
            i = i - 1;
            j = j;
            gStepsCount--;
            updateScore(-1);
            if (gBoard[i - 1][j].gameElement === CRATE) {
              return;
            }
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER_IMG);
            gBoard[i - 1][j].gameElement = CRATE;
            renderCell({ i: i - 1, j: j }, CRATE_IMG);
            gBoard[i + 1][j].gameElement = null;
            renderCell({ i: i + 1, j: j }, '');
          }
        }

        gBoard[i - 1][j].gameElement = CRATE;
        renderCell({ i: i - 1, j: j }, CRATE_IMG);
      }
      //Move down
      if (i > gGamerPos.i) {
        diffI = +2;
        diffJ = 0;
        if (gBoard[gGamerPos.i + 2][gGamerPos.j].type === WALL) {
          gStepsCount++;
          updateScore(+1);
          if (gIsMagnet) {
            i -= 2;
            j = j;
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER_IMG);
            gBoard[i + 1][j].gameElement = CRATE;
            renderCell({ i: i + 1, j: j }, CRATE_IMG);
            gBoard[i + 2][j].gameElement = null;
            renderCell({ i: i + 2, j: j }, '');
            gIsMagnet = false;
          } else {
            return;
          }
        }

        if (gBoard[gGamerPos.i + 2][gGamerPos.j].gameElement === CRATE) {
          gStepsCount++;
          updateScore(+1);
          return;
        }

        if (gBoard[gGamerPos.i + 2][gGamerPos.j].gameElement === WATER) {
          while (gBoard[i + 2][j].type !== WALL) {
            i = i + 1;
            j = j;
            gStepsCount--;
            updateScore(-1);
            if (gBoard[i + 1][j].gameElement === CRATE) {
              return;
            }
            renderCell(gGamerPos, '');
            gGamerPos.i = i;
            gGamerPos.j = j;
            gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
            renderCell(gGamerPos, GAMER_IMG);
            gBoard[i + 1][j].gameElement = CRATE;
            renderCell({ i: i + 1, j: j }, CRATE_IMG);
            gBoard[i - 1][j].gameElement = null;
            renderCell({ i: i - 1, j: j }, '');
          }
        }

        gBoard[i + 1][j].gameElement = CRATE;
        renderCell({ i: i + 1, j: j }, CRATE_IMG);
      }
    }

    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
    renderCell(gGamerPos, '');
    var elCell = document.querySelector(`.cell-${gGamerPos.i}-${gGamerPos.j}`);
    elCell.style.border = 'none';

    if (
      gBoard[gGamerPos.i][gGamerPos.j].gameElement === null &&
      gBoard[gGamerPos.i][gGamerPos.j].type === TARGET
    ) {
      gBoard[gGamerPos.i][gGamerPos.j].gameElement = TARGET;
      renderCell(gGamerPos, TARGET_IMG);
    }

    gGamerPos.i = i;
    gGamerPos.j = j;
    var elGamer = document.querySelector(`.cell-${i}-${j}`);
    elGamer.style.border = `1px black solid`;
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
    renderCell(gGamerPos, GAMER_IMG);

    if (gScore === 0) gameOver();

    if (
      gBoard[5][5].gameElement === CRATE &&
      gBoard[2][4].gameElement === CRATE &&
      gBoard[8][8].gameElement === CRATE
    )
      gameOver(true);
  }
}

function checkGamerOver() {}

function moveWithCrate(diffI, diffJ, crateDiffI, crateDiffJ, i, j) {
  if (gBoard[gGamerPos.i][gGamerPos.j - 2].type === WALL) {
    //Keep Score if next cell is wall
    gStepsCount++;
    updateScore(+1);
    if (gIsMagnet) {
      i = i; //+ diffI;
      j += 2; // j+diffJ
      renderCell(gGamerPos, '');
      gGamerPos.i = i;
      gGamerPos.j = j;
      gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
      renderCell(gGamerPos, GAMER);
      gBoard[i][j - 1].gameElement = CRATE;
      renderCell({ i: i, j: j - 1 }, CRATE_IMG);
      gBoard[i][j - 2].gameElement = null;
      renderCell({ i, j: j - 2 }, '');
      gIsMagnet = false;
    } else {
      return;
    }
  }
  if (gBoard[gGamerPos.i][gGamerPos.j - 2].gameElement === CRATE) {
    //Keep Score if next two cells are crates
    gStepsCount++;
    updateScore(+1);
    return;
  }

  if (gBoard[gGamerPos.i][gGamerPos.j - 2].gameElement === WATER) {
    while (gBoard[i][j - 2].type !== WALL) {
      i = i;
      j = j - 1;
      gStepsCount--;
      updateScore(-1);
      if (gBoard[i][j - 1].gameElement === CRATE) {
        return;
      }

      renderCell(gGamerPos, '');
      gGamerPos.i = i;
      gGamerPos.j = j;
      gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
      renderCell(gGamerPos, GAMER_IMG);
      gBoard[i][j - 1].gameElement = CRATE;
      renderCell({ i: i, j: j - 1 }, CRATE_IMG);
      gBoard[i][j + 1].gameElement = null;
      renderCell({ i, j: j + 1 }, '');
    }
  }

  gBoard[i][j - 1].gameElement = CRATE;
  renderCell({ i: i, j: j - 1 }, CRATE_IMG);
}

function gameOver(isWin = false) {
  gIsGameOver = true;
  clearInterval(gGoldInterval);
  clearInterval(gClockInterval);
  clearInterval(gMagnetInterval);
  var elRestart = document.querySelector('.restart');
  elRestart.style.display = 'block';
  var elLost = document.querySelector('.modal');
  elLost.innerText = isWin
    ? 'You won! press Restart to play again'
    : 'Game Over! press Restart to play again';
}

function renderCell(location, value) {
  var cellSelector = '.' + getClassName(location);
  var elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

function updateScore(diff) {
  gScore += diff;
  document.querySelector('.counter').innerText = gScore;
}

function renderScore() {
  var elScore = document.querySelector('.counter');
  elScore.innerHTML = gScore;
}

function handleKey(event) {
  var i = gGamerPos.i;
  var j = gGamerPos.j;

  switch (event.key) {
    case 'ArrowLeft':
      moveTo(i, j - 1);
      break;
    case 'ArrowRight':
      moveTo(i, j + 1);
      break;
    case 'ArrowUp':
      moveTo(i - 1, j);
      break;
    case 'ArrowDown':
      moveTo(i + 1, j);
      break;
  }
}

function getClassName(location) {
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function undo() {
  if (!gUndoPlayer.length) return;

  var prevPos;
  for (var k = 0; k < gUndoPlayer.length; k++) {
    gScore++;
    updateScore(1);
    prevPos = gUndoPlayer[k];
    gUndoPlayer.shift(1);
    console.log(gUndoPlayer[k - 1]);

    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
    renderCell(gGamerPos, '');

    gBoard[prevPos.i][prevPos.j].gameElement = GAMER;
    renderCell(prevPos, GAMER_IMG);
  }
}
