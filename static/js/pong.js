var socket = io();

$("#modal-info").modal();

socket.emit('register new socket', null);

var numPlayer;
var playerLeft, playerRight;
var scoreLeft, scoreRight;

socket.emit('get num player', null);

socket.on('get num player', (num) => {
  numPlayer = num;
  socket.emit('get players points', null);
  socket.emit('get players victories', null);
});

socket.on('get players victories', (data) => {
  let victories = JSON.parse(data);
  document.getElementById('player1-victories')
    .innerHTML = (numPlayer === 1) ? victories.me : victories.adv;
  document.getElementById('player2-victories')
    .innerHTML = (numPlayer === 2) ? victories.me : victories.adv;
});

socket.on('get players points', (data) => {
  let points = JSON.parse(data);
  playerLeft = (numPlayer === 1) ? points.me : points.adv;
  playerRight = (numPlayer === 2) ? points.me : points.adv;

  // create text for the score, set font properties
  scoreLeft = draw.text(playerLeft+'').font({
    size: 32,
    family: 'Menlo, sans-serif',
    anchor: 'end',
    fill: '#fff'
  }).move(width/2-10, 10);

  // cloning rocks!
  scoreRight = scoreLeft.clone()
    .text(playerRight+'')
    .font('anchor', 'start')
    .x(width/2+10)

});

// define document width and height
var width = 450, height = 300

// create SVG document and set its size
var draw = SVG('pong').size(width, height)
draw.viewbox(0,0,450,300)

// draw background
var background = draw.rect(width, height).fill('#dde3e1')

// draw line
var line = draw.line(width/2, 0, width/2, height)
line.stroke({ width: 5, color: '#fff', dasharray: '5,5' })


// define paddle width and height
var paddleWidth = 15, paddleHeight = 80

// create and position left paddle
var paddleLeft = draw.rect(paddleWidth, paddleHeight)
paddleLeft.x(0).cy(height/2).fill('#00ff99')

// create and position right paddle
var paddleRight = paddleLeft.clone()
paddleRight.x(width-paddleWidth).fill('#ff0066')


// define ball size
var ballSize = 10

// create ball
var ball = draw.circle(ballSize)
ball.center(width/2, height/2).fill('#7f7f7f')

// random velocity for the ball at start
var vx = 0, vy = 0

// AI difficulty
var difficulty = 2

// update is called on every animation step
function update(dt) {
  socket.emit('move ball', dt);
}

socket.on('move ball', function(dt){
  // move the ball by its velocity
  ball.dmove(vx*dt, vy*dt)

  // get position of ball
  var cx = ball.cx()
    , cy = ball.cy()

  // get position of ball and paddle
  var paddleLeftCy = paddleLeft.cy()

  // move the left paddle in the direction of the ball
  /*var dy = Math.min(difficulty, Math.abs(cy - paddleLeftCy))
  paddleLeftCy += cy > paddleLeftCy ? dy : -dy*/

  // constraint the move to the canvas area
  paddleLeft.cy(Math.max(paddleHeight/2, Math.min(height-paddleHeight/2, paddleLeftCy)))

  // check if we hit top/bottom borders
  if ((vy < 0 && cy <= 0) || (vy > 0 && cy >= height)) {
    vy = -vy
  }

  var paddleLeftY = paddleLeft.y()
    , paddleRightY = paddleRight.y()

  // check if we hit the paddle
  if((vx < 0 && cx <= paddleWidth && cy > paddleLeftY && cy < paddleLeftY + paddleHeight) ||
    (vx > 0 && cx >= width - paddleWidth && cy > paddleRightY && cy < paddleRightY + paddleHeight)) {
    // depending on where the ball hit we adjust y velocity
    // for more realistic control we would need a bit more math here
    // just keep it simple
    vy = (cy - ((vx < 0 ? paddleLeftY : paddleRightY) + paddleHeight/2)) * 7 // magic factor

    // make the ball faster on hit
    vx = -vx * 1.05
  } else

  // check if we hit left/right borders
  if ((vx < 0 && cx <= 0) || (vx > 0 && cx >= width)) {
    // O player 2 informará para o servidor que marcou ponto, da mesma for fará o player 1 quando marcar
    if(vx < 0 && numPlayer === 2) 
      socket.emit('up point', null);
    else if(vx >= 0 && numPlayer === 1) 
      socket.emit('up point', null);
    
    reset()

  }

  socket.on('update score', (data) =>
  {
    let score = JSON.parse(data);
    scoreLeft.text(score.player1+'');
    scoreRight.text(score.player2+'');
  });

  socket.on('player win', (winner) => 
  {
    console.log('aqui');
    let titleMsg = (winner === numPlayer) ? "Aêeeeeeeeeee!" : "Poxaaa!";
    let bodyMsg = (winner === numPlayer) 
      ? "Hahaha! Você venceu nessa partida. :D" : "Não foi dessa vez. Você perdeu :(";
    document.getElementById('title-msg-player').innerHTML = titleMsg;
    document.getElementById('body-msg-player').innerHTML = bodyMsg;
    $("#modal-player-win").modal();
    socket.emit('get players victories', null);
  });

  // move player right paddle
  var playerRightPaddleY = paddleRight.y()

  if (playerRightPaddleY <= 0 && paddleRightDirection == -1) {
    paddleRight.cy(paddleHeight/2)
  } else if (playerRightPaddleY >= height-paddleHeight && paddleRightDirection == 1) {
    paddleRight.y(height-paddleHeight)
  } else {
    paddleRight.dy(paddleRightDirection*paddleSpeed)
  }

  // move player left paddle
  var playerLeftPaddleY = paddleLeft.y()

  if (playerLeftPaddleY <= 0 && paddleLeftDirection == -1) {
    paddleLeft.cy(paddleHeight/2)
  } else if (playerLeftPaddleY >= height-paddleHeight && paddleLeftDirection == 1) {
    paddleLeft.y(height-paddleHeight)
  } else {
    paddleLeft.dy(paddleLeftDirection*paddleSpeed)
  }

  // update ball color based on position
  ball.fill(ballColor.at(1/width*ball.x()))
});

var lastTime, animFrame

function callback(ms) {
  // we get passed a timestamp in milliseconds
  // we use it to determine how much time has passed since the last call
  if (lastTime) {
    update((ms-lastTime)/1000) // call update and pass delta time in seconds
  }

  lastTime = ms
  animFrame = requestAnimationFrame(callback)
}

callback()

var paddleRightDirection = 0
  , paddleSpeed = 5, paddleLeftDirection = 0

SVG.on(document, 'keydown', function(e) {
  if(e.keyCode == 40 || e.keyCode == 38)
    socket.emit('move paddle', e.keyCode == 40 ? 1 : e.keyCode == 38 ? -1 : 0);
});

SVG.on(document, 'keyup', function(e) {
  if(e.keyCode == 40 || e.keyCode == 38)
    socket.emit('move paddle', 0);
});

socket.on('move paddle', function(direction){
  if(numPlayer === 1)
    paddleLeftDirection = direction;
  else
    paddleRightDirection = direction;
});

socket.on('move paddle player-adv', function(direction){
  if(numPlayer === 1)
    paddleRightDirection = direction;
  else
    paddleLeftDirection = direction;
});

socket.on('draw click', function(v){
  vx = v.x;
  vy = v.y;
});

draw.on('click', function() {
  let v = JSON.stringify({"x" : vx, "y" : vx});
  socket.emit('draw click', v);
})

function reset() {
  // visualize boom
  boom()
  
  // reset speed values
  vx = 0
  vy = 0

  // position the ball back in the middle
  ball.animate(100).center(width/2, height/2)

  // reset the position of the paddles
  paddleLeft.animate(100).cy(height/2)
  paddleRight.animate(100).cy(height/2)
}

// ball color update
var ballColor = new SVG.Color('#ff0066')
ballColor.morph('#00ff99')

// show visual explosion 
function boom() {
  // detect winning player
  var paddle = ball.cx() > width/2 ? paddleLeft : paddleRight

  // create the gradient
  var gradient = draw.gradient('radial', function(stop) {
    stop.at(0, paddle.attr('fill'), 1)
    stop.at(1, paddle.attr('fill'), 0)
  })

  // create circle to carry the gradient
  var blast = draw.circle(300)
  blast.center(ball.cx(), ball.cy()).fill(gradient)

  // animate to invisibility
  blast.animate(1000, '>').opacity(0).after(function() {
    blast.remove()
  });
}