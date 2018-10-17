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

  // cria texto para o score e define as propriedades da fonte
  scoreLeft = draw.text(playerLeft+'').font({
    size: 32,
    family: 'Menlo, sans-serif',
    anchor: 'end',
    fill: '#fff'
  }).move(width/2-10, 10);

  // clonando
  scoreRight = scoreLeft.clone()
    .text(playerRight+'')
    .font('anchor', 'start')
    .x(width/2+10)

});

// define o tamanho da mesa do ping-pong
var width = 450, height = 300

// Cria o documento SVG setando o tamanho
var draw = SVG('pong').size(width, height)
draw.viewbox(0,0,450,300)

// desenha o background
var background = draw.rect(width, height).fill('#dde3e1')

// desenha linha
var line = draw.line(width/2, 0, width/2, height)
line.stroke({ width: 5, color: '#fff', dasharray: '5,5' })


// define o tamanho da barra dos jogadores
var paddleWidth = 15, paddleHeight = 80

// cria e posiciona a barra do jogador à esquerda
var paddleLeft = draw.rect(paddleWidth, paddleHeight)
paddleLeft.x(0).cy(height/2).fill('#00ff99')

// cria e posiciona a barra do jogador à direita
var paddleRight = paddleLeft.clone()
paddleRight.x(width-paddleWidth).fill('#ff0066')


// define o tamanho da bola
var ballSize = 10

// cria a bola
var ball = draw.circle(ballSize)
ball.center(width/2, height/2).fill('#7f7f7f')

// velocidade da bola
var vx = 0, vy = 0

// atualiza o movimento da bola
function update(dt) {
  socket.emit('move ball', dt);
}

socket.on('move ball', function(dt){
  // move a bola de acordo com a velocidade
  ball.dmove(vx*dt, vy*dt)

  // pega a posição da bola
  var cx = ball.cx()
    , cy = ball.cy()

  // pega a posição da bola e da barra esquerda
  var paddleLeftCy = paddleLeft.cy()

  // restringe o movimento para a área da lona
  paddleLeft.cy(Math.max(paddleHeight/2, Math.min(height-paddleHeight/2, paddleLeftCy)))

  // verifica se a bola atingiu a margem inferior/superior
  if ((vy < 0 && cy <= 0) || (vy > 0 && cy >= height)) {
    vy = -vy
  }

  var paddleLeftY = paddleLeft.y()
    , paddleRightY = paddleRight.y()

  // verifica se a barra foi atingida
  if((vx < 0 && cx <= paddleWidth && cy > paddleLeftY && cy < paddleLeftY + paddleHeight) ||
    (vx > 0 && cx >= width - paddleWidth && cy > paddleRightY && cy < paddleRightY + paddleHeight)) {
    // dependendo onde a bola bate, ajusta-se a velocidade y
    vy = (cy - ((vx < 0 ? paddleLeftY : paddleRightY) + paddleHeight/2)) * 7

    // torna bola mais rápida ao acertar
    vx = -vx * 1.05
  } else

  // verifica as bordas laterias foram atingidas (se foi feito ponto)
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

  // move o jogador da barra à direita
  var playerRightPaddleY = paddleRight.y()

  if (playerRightPaddleY <= 0 && paddleRightDirection == -1) {
    paddleRight.cy(paddleHeight/2)
  } else if (playerRightPaddleY >= height-paddleHeight && paddleRightDirection == 1) {
    paddleRight.y(height-paddleHeight)
  } else {
    paddleRight.dy(paddleRightDirection*paddleSpeed)
  }

  // move o jogador da barra à esquerda
  var playerLeftPaddleY = paddleLeft.y()

  if (playerLeftPaddleY <= 0 && paddleLeftDirection == -1) {
    paddleLeft.cy(paddleHeight/2)
  } else if (playerLeftPaddleY >= height-paddleHeight && paddleLeftDirection == 1) {
    paddleLeft.y(height-paddleHeight)
  } else {
    paddleLeft.dy(paddleLeftDirection*paddleSpeed)
  }

  // atualiza a cor da bola baseando na posição
  ball.fill(ballColor.at(1/width*ball.x()))
});

var lastTime, animFrame

function callback(ms) {
  // recebe-se um timestamp em milissegundos
  // usa-se para determinar quanto tempo passou desde a última chamada
  if (lastTime) {
    update((ms-lastTime)/1000) // chama a atualização e passa o tempo em segundos
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
  // chamada da animação boom
  boom()
  
  // reseta a velocidade
  vx = 0
  vy = 0

  // posiciona a bola no meio da mesa
  ball.animate(100).center(width/2, height/2)

  // reseta a posição das barras
  paddleLeft.animate(100).cy(height/2)
  paddleRight.animate(100).cy(height/2)
}

// reseta a cor da bola
var ballColor = new SVG.Color('#ff0066')
ballColor.morph('#00ff99')

// animação boom
function boom() {

  var paddle = ball.cx() > width/2 ? paddleLeft : paddleRight

  var gradient = draw.gradient('radial', function(stop) {
    stop.at(0, paddle.attr('fill'), 1)
    stop.at(1, paddle.attr('fill'), 0)
  })

  var blast = draw.circle(300)
  blast.center(ball.cx(), ball.cy()).fill(gradient)

  blast.animate(1000, '>').opacity(0).after(function() {
    blast.remove()
  });
}
