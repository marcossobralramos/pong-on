var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// variáveis para a lógica do game online
var players = new Array();
var players_adv = {};

// configuração para arquivos estáticos
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/static'));

// configuração da view
app.set('views', './views');
app.set('view engine', 'pug');

// configuração das rotas
app.get('/', function (req, res) {
	res.render('game', {});
});

app.get('/game', function(req, res) {
	// TODO: Renderizar para o game e passar as informações dos players
	let player_adver = players_adv[''+req.ip];
	let player_this = players_adv[''+player_adver["ip"]];

	context = {
		'player1_photo' : (player_this['num'] === 1) ? player_this.picture : player_adver.picture,
		'player2_photo' : (player_this['num'] === 1) ? player_adver.picture : player_this.picture,
		'player1_name' : (player_this['num'] === 1) ? player_this.name : player_adver.name,
		'player2_name' : (player_this['num'] === 1) ? player_adver.name : player_this.name,
		'player1_email' : (player_this['num'] === 1) ? player_this.email : player_adver.email,
		'player2_email' : (player_this['num'] === 1) ? player_adver.email : player_this.email,
	}

	res.render('game', context);
});

// tratando mensagens via socket
io.on('connection', function(socket) {
	socket.on('connect player', function(json){
		player = JSON.parse(json);
		player["socket"] = socket;
		player["ip"] = socket.handshake.address;
		player["points"] = 0;
		player["victories"] = 0;

		if(players.length == 0)
		{
			player["num"] = 1;
			players.push(player);
			socket.emit('waiting player', true);
		}
		else
		{
			player["num"] = 2;
			// Adicionando jogadores à lista de "in game"
			p = players.pop();
			players_adv[p["ip"]] = player;
			players_adv[player["ip"]] = p;

			p.socket.emit('players connected', null);
			player.socket.emit('players connected', null);
		}
	});

	// registrando uma nova instância de socket para um jogador
	socket.on('register new socket', function(){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv["ip"]];
		player_this['socket'] = socket;
	});

	socket.on('get num player', function(){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv["ip"]];
		player_this['socket'].emit('get num player', player_this['num'])
	});

	socket.on('get players points', function(){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv["ip"]];
		let points = JSON.stringify({
			"me" : player_this['points'],
			"adv" : player_adv['points']
		})
		player_this['socket'].emit('get players points', points);
	});

	socket.on('get players victories', function(){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv["ip"]];
		let victories = JSON.stringify({
			"me" : player_this['victories'],
			"adv" : player_adv['victories']
		})
		player_this['socket'].emit('get players victories', victories);
	});

	socket.on('up point', function(){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv["ip"]];
		player_this['points']++;

		if(player_this['points'] === 10)
		{
			console.log('win');
			player_this['points'] = 0;
			player_adv['points'] = 0;
			player_this['victories']++;
			player_this['socket'].emit('player win', player_this['num']);
			player_adv['socket'].emit('player win', player_this['num']);
		}

		let points = JSON.stringify({
			"player1" : (player_this['num'] === 1) ? player_this['points'] : player_adv['points'],
			"player2" : (player_this['num'] === 2) ? player_this['points'] : player_adv['points'],
		});

		player_this['socket'].emit('update score', points);
		player_adv['socket'].emit('update score', points);
	});

	socket.on('move ball', function(dt){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv['ip']];
		player_adv['socket'].emit('move ball', dt);
		player_this['socket'].emit('move ball', dt);
	});

	socket.on('move paddle', function(direction){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv['ip']];
		player_adv['socket'].emit('move paddle player-adv', direction);
		player_this['socket'].emit('move paddle', direction);
	});

	socket.on('draw click', function(data){
		let v = JSON.parse(data);
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv['ip']];

		if(v.x === 0 && v.y === 0) 
		{
			v.x = Math.random() * 500 - 150
			v.y = Math.random() * 500 - 150
			player_adv['socket'].emit('draw click', v);
			player_this['socket'].emit('draw click', v);
		}
	});

	socket.on('receive message', function(data){
		let ip = socket.handshake.address;
		let player_adv = players_adv[''+ip];
		let player_this = players_adv[''+player_adv['ip']];
		player_adv['socket'].emit('receive message', data);
		player_this['socket'].emit('receive message', data);
	});
});

http.listen(3001, function () {
	console.log('Ouvindo a porta 3001');
});
