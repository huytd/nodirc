var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var irc = require('irc');
var client = null;

var current = {
	password: '',
	channel: ''
};

app.use(express.static('www'));

app.get('/', function(req, res){
	res.sendFile('index.html')
});

http.listen(8080, function(){
	console.log('Server is listening at 8080');
});

io.on('connection', function(socket){
	socket.on('disconnect', function(){
		if (client != null) client.part(current.channel);
	});

	// login
	socket.on('login', function(data){
		current.password = data.password;
		current.channel = data.channel;

		client = new irc.Client(data.server, data.nickname, {
			channels: [ data.channel ],
			autoConnect: false
		});

		client.connect(function(c){
			socket.emit('loggedIn');
			client.addListener('message', onMessage);
			client.addListener('notice', onNotice);
		});

	});
	// message / notice
	function checkUsersList() {
		if (client.chans[current.channel] !== undefined) {
			if (client.chans[current.channel].users !== undefined) {
				socket.emit('usersList', client.chans[current.channel].users);
			}
			if (client.chans[current.channel].topic !== undefined) {
				socket.emit('setTopic', client.chans[current.channel].topic);
			}
		}
	}

	function onMessage(from, to, msg) {
		socket.emit('message', { from: from, to: to, msg: msg });
		checkUsersList();
	}

	function onNotice(nick, to, text, msg) {
		socket.emit('notice', { nick: nick, to: to, text: text });
		checkUsersList();
		// Send password to authorize
		if (text.indexOf('NickServ') != -1 && text.indexOf('identify') != -1) {
			client.send('/msg NickServ identify ' + current.password);
		}
	}

	// send message
	socket.on('send', function(msg){
		client.say(current.channel, msg);
	});
});
