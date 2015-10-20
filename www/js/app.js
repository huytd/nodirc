var socket = io();
var local = window.localStorage;
var currentNick = '';
var currentChannel = '';
var hasTopic = false;

var $ = function(query) {
  var list = document.querySelectorAll(query);
  if (list.length > 0) {
    if (list.length > 1) {
      return list;
    } else {
      return list[0];
    }
  } else {
    return null;
  }
};

var addChatLine = function(from, message){
  var newline = document.createElement('li');
  var now = new Date();
  var min = now.getMinutes();
  if (min <= 9) {
    min = '0' + min;
  }
  var hrs = now.getHours();
  if (hrs <= 9) {
    hrs = '0' + hrs;
  }
  // color the chat input appropriately
  newline.innerHTML = '<div class="left">' +
                        '<div class="avatar">' +
                          '<i class="icon-emo-sunglasses"></i>' +
                        '</div>' +
                      '</div>' +
                      '<div class="right">' +
                        '<div class="sender">' + from + '</div>' +
                        '<div class="message">' + message + '</div>' +
                        '<span class="time">' + hrs + ':' + min + '</span>' +
                      '</div>';
  $('.chat').appendChild(newline);
  $('.chatbox').scrollTop = $('.chatbox').scrollHeight;
};

var clearUserList = function() {
  $('.listbox.users').innerHTML = '';
}

var addUser = function(name){
  var newline = document.createElement('li');
  newline.innerHTML = name;
  $('.listbox.users').appendChild(newline);
}

var addChannel = function(name){
  var newline = document.createElement('li');
  newline.innerHTML = name;
  $('.listbox.channel').appendChild(newline);
}

var onLoad = function() {
  $('#txtServer').value =  local.getItem('server') || '';
  $('#txtChannel').value =  local.getItem('channel') || '';
  $('#txtNickname').value =  local.getItem('nickname') || '';
  $('#txtPassword').value =  local.getItem('password') || '';
};

var onKeyPress = function() {
  var key = window.event.keyCode;
  // If the user has pressed enter
  if (key == 13) {
      //document.getElementById("txtArea").value =document.getElementById("txtArea").value + "\n*";
      var msg = $('#txtChat').value;
      socket.emit('send', msg);
      addChatLine(currentNick, msg);
      $('#txtChat').value = '';
      return false;
  }
  else {
      return true;
  }
};

var login = function() {
  var data = {
    server: $('#txtServer').value,
    channel: $('#txtChannel').value,
    nickname: $('#txtNickname').value,
    password: $('#txtPassword').value
  };

  socket.emit('login', data);

  local.setItem('server', data.server);
  local.setItem('channel', data.channel);
  local.setItem('nickname', data.nickname);
  local.setItem('password', data.password);

  currentNick = data.nickname;
  currentChannel = data.channel;

  $('.loginbox').innerHTML = '<div class="loading">Connecting...</div>';
};

socket.on('loggedIn', function(){
  addChannel(currentChannel.replace(/#/g,''));
});

socket.on('usersList', function(data){
  clearUserList();
  Object.keys(data).forEach(function (key) {
    addUser(key);
  });
});

socket.on('setTopic', function(topic){
  if (!hasTopic) {
    var newline = document.createElement('li');
    newline.innerHTML = '<div class="topic">' + topic + '</div>';
    $('.chat').appendChild(newline);
    hasTopic = true;
  }
});

socket.on('message', function(data){
  console.log("msg: ", data);
  addChatLine(data.from, data.msg);
});

socket.on('notice', function(data){
  console.log("notic: ", data);
  $('.loginoverlay').style.display = 'none';
  addChatLine(data.nick, data.text);
});
