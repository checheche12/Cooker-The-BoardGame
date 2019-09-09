var express = require('express');
var app = express();
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

// 현재 만들어주어야하는 방의 번호
var roomNumber = 10000;
// 방의 리스트
var roomList = {};
// 접속한 유저 리스트
var userList = {};
// 현재 게임이 실행되고 있는 방의 리스트
var nowPlayRoomList = {};

var roomState = ["waiting","playing","end"];

// 현재 방의 갯수와, 방의 리스트를 반환해주어야한다. 리스트에는 방의 고유번호와 방의 이름이 들어있다!
// 유저는 그 방의 고유번호로 들어오게 된다.
app.get('/', function(req, res) {
  res.render('main');
});

app.get('/lobby',function(req,res){
  res.render('lobby',{roomCount:Object.keys(roomList).length,roomList:roomList, nowPlayRoomCount:Object.keys(nowPlayRoomList).length });
});

app.get('/playgame',function(req,res){
  res.render('playgame');
});

app.get('/waitingroom',function(req,res){
  res.render('waitingroom',{roomNumber:req.query.roomnumber ,roomName:roomList[req.query.roomnumber]["roomName"],
   roomWaitingUser: Object.keys( roomList[req.query.roomnumber].roomReadyUserList  ).length,
 alluser: Object.keys( roomList[req.query.roomnumber].roomUserList  ).length  }  );
});

// 유저 객체
function userObject(_socketID, _userName){
  this.socketID=_socketID;
  this.userName=_userName;
  this.userRoom=null;
}

// 방의 객체
function roomObject(_roomName,_roomNumber){
  // 각각 방의 이름, 방의 고유 번호, 방에 접속중인 유저를 나타낸다.
  this.roomName = _roomName;
  this.roomNumber = _roomNumber;
  this.roomUserList = {};
  this.roomReadyUserList = {};
  this.roomState = roomState[0];
  this.gameBoard = null;
}

function gameBoard(_roomNumber ,_playUserCount){
  this.roomNumber = _roomNumber;
  this.playUserCount = _playUserCount;
  this.nowTurn = null;
  this.playGround = new Array();
  this.userOrder = null; // 유저가 배열로 저장되는데 소켓아이디와 기타 필요한 정보를 한번에 저장한다.
  // 소켓아이디는 socketID 로 저장이 되고, 임무 카드는 userMissionCard로 저장이 된다. 인벤토리는 userInventroy 로 저장된다.
  this.userOrderCount = 0;
}

// 게임판을 초기화 하는 함수
gameBoard.prototype.gameBoardInit = function(){
  // 게임 보드판을 12 * 12 로 초기화한다.
  // 아이템도 없고, 땅의 상태와 있는 유저도 모두 초기화한다.
  for(var i = 0; i<12;i++){
    this.playGround[i] = new Array();
    for(var j = 0; j<12; j++){
      this.playGround[i][j] = {item:"", stats:"", user:""};
    }
  }
  this.userOrder = new Array();
  // 순서를 기록할 리스트를 만든 뒤 소켓 아이디를 넣는다.
  for(sID in nowPlayRoomList[this.roomNumber]["roomUserList"]){
    var inventory = new Array();
    this.userOrder.push({socketID:sID,userMissionCard:{},userInventroy:inventory});
  }

  for(var i = 0; i<this.userOrder.length;i++){

  }

  this.gameBoardNoticePlayersTurn();
  // 게임 보드를 초기화하고 처음 유저에게 신호를 보낸다.
}

gameBoard.prototype.gameBoardNoticePlayersTurn = function(){
  // 현재 턴의 유저에게 신호를 보낸다.
  var playerSocketID = this.userOrder[this.userOrderCount]["socketID"];
  io.to(playerSocketID).emit('yourturn');
  //20초 뒤에 턴을 엔드하는 함수를 실행한다.
  //만일 먼저 턴 종료가 일어난다면...? 그건 좀 뒤에 생각하자. 지금은 턴을 바꾸는게 유일하게 시간만 있다고 가정
  var that = this;
  setTimeout(function(){
    that.gameBoardEndTurn();
  },16000);
};

gameBoard.prototype.gameBoardDicePlay = function(){
  // 주사위 처리를 하는 부분
};

gameBoard.prototype.gameBoardMovePlay = function(){
  // 주사위 결과를 반환 한 후 이동 처리
};

gameBoard.prototype.gameBoardEndTurn = function(){
  var playerSocketID = this.userOrder[this.userOrderCount]["socketID"];
  io.to(playerSocketID).emit('endturn');
  this.userOrderCount = (this.userOrderCount+1)%this.playUserCount;
  if(nowPlayRoomList[this.roomNumber]["roomState"] == roomState[1]){
    this.gameBoardNoticePlayersTurn();
  }
};

// 현재 접속해있는 유저를 보여주는 함수.
function lookUserObjectList(userList){
  console.log("User List!");
  for (socketID in userList){
    console.log(socketID);
  }
}

function lookRoomUserObjectList(roomObject){
  console.log(roomObject["roomName"] + " User");
  for(socketID in roomObject.roomUserList){
    console.log(socketID);
  }
}


var roomName;

io.on('connection', function (socket) {
    var socketID = socket.id;
    userList[socket.id] = new userObject(socketID, socketID); // 두번째 매개변수는 원래 아이디를 넣어야한다!
    io.to(socketID).emit('connectlobby');
    /*
    console.log('connect user ' + socket.id );
    lookUserObjectList(userList);
    */

    socket.on('ready', function(data){
      roomList[userList[socket.id].userRoom].roomReadyUserList[socket.id] = userList[socket.id];
      var roomName = userList[socket.id].userRoom;
      io.sockets.in(roomName).emit('oneuserready', {readyuser: Object.keys(roomList[roomName].roomReadyUserList  ).length, alluser:Object.keys(roomList[roomName].roomUserList  ).length } );
      if( Object.keys(roomList[roomName].roomReadyUserList  ).length == Object.keys(roomList[roomName].roomUserList  ).length ){
        if(Object.keys(roomList[roomName].roomReadyUserList  ).length > 1){
          // 방에 있는 모든 사람이 레디 상태이면서 2명 이상 일 때
          io.sockets.in(roomName).emit('gamestart', {readyuser: Object.keys(roomList[roomName].roomReadyUserList  ).length } );
          nowPlayRoomList[roomName] = roomList[roomName];
          nowPlayRoomList[roomName].roomState = roomState[1];
          // 게임을 시작하면 방의 게임 보드를 초기화 할 필요가 있다.
          nowPlayRoomList[roomName].gameBoard = new gameBoard(roomName,  Object.keys(nowPlayRoomList[roomName].roomUserList  ).length );
          nowPlayRoomList[roomName].gameBoard.gameBoardInit();
          delete roomList[roomName];
        }
      }
    });

    socket.on('readycancle', function(data){
      var roomName = userList[socket.id].userRoom;
      delete roomList[userList[socket.id].userRoom].roomReadyUserList[socket.id];
      io.sockets.in(roomName).emit('oneuserready', {readyuser: Object.keys(roomList[roomName].roomReadyUserList  ).length , alluser:Object.keys(roomList[roomName].roomUserList  ).length  } );
    });

    socket.on('reqMsg', function (data) {
        /* console.log(data); */
        var roomName = userList[socket.id].userRoom;
        io.sockets.in(roomName).emit('recMsg', {comment: socketID + " : " + data.comment+'\n'});
    });

    socket.on('joinroom',function (data) {
      var roomNumber = data["roomNumber"];
      socket.join(roomNumber);
      roomList[roomNumber]["roomUserList"][socket.id] = userList[socket.id];
      userList[socket.id].userRoom = roomNumber;
      io.sockets.in(roomNumber).emit('oneuserready', {readyuser: Object.keys(roomList[roomNumber].roomReadyUserList  ).length , alluser:Object.keys(roomList[roomNumber].roomUserList  ).length  } );
      //lookRoomUserObjectList(roomList[roomNumber]);
    });

    socket.on('makeroom', function(data){
      // 방을 만들 때 방 리스트에 새 방을 만들어 넣는다.
      roomList[roomNumber] = new roomObject( data["roomName"], roomNumber);
      // 방을 만든 사람을 첫번째 유저로써 넣고 방에도 접속 시킨다.
      socket.join(roomNumber);
      roomList[roomNumber]["roomUserList"][socket.id] = userList[socket.id];
      userList[socket.id].userRoom = roomNumber;
      io.to(socket.id).emit('connectroom', roomNumber);
      io.sockets.in(roomNumber).emit('oneuserready', {readyuser: Object.keys(roomList[roomNumber].roomReadyUserList  ).length , alluser:Object.keys(roomList[roomNumber].roomUserList  ).length  } );
      roomNumber+=1;
    });

    socket.on('playgamemessage', function(data){
      // 게임 진행에 관련한 로직을 모두 담는다.
      // 1. 대화(감정 표현만)
      // 2. 주사위 굴리기
      // 3. 캐릭터 이동
      // 그 외에 어떤 것이 있을까... 고민을 좀 해봐야겠다.
      // 모든 처리는 서버에서 담당하며 클라이언트에게는 메세지만 보낸다. 렌더링만 맡기고 모든 처리는 서버에서...
      // 로직은 유저의 roomNumber 를 가지고 와서 nowPlayRoomList 에서 해당하는 방을 찾는다
      if(data["message"]=="1"){

      }else if(data["message"]=="2"){
        // 이 메세지를 보낸 사람이 현재 턴을 가진 유저인지 확인한다.
        // 맞다면 주사위 두개의 값을 랜덤으로 생성해서 리턴한다.
      }else if(data["message"]=="3"){

      }else{
        //...
      }
    });

    socket.on('deleteroom',function(data){
      // 방이 없어지는 경우. 게임이 시작했을 때 호출해야한다.
      // 사람이 모두 나가더라도 만들었던 방은 유지하도록 하자.
      //delete roomList[/* 삭제할 roomNumber 를 구해서 넣는다.*/]
      // roomNumber 는 빼지 않는다. 방의 고유 번호는 계속 늘어나야만 한다. 줄어드는건 방의 갯수만.
    });

    socket.on('exitroom',function(data){
      // 유저가 방을 나가는 경우에 대해서 서술
      if(userList[socket.id].userRoom != null){
        var roomName = userList[socket.id].userRoom;
        delete roomList[roomName].roomUserList[socket.id];
        delete roomList[roomName].roomReadyUserList[socket.id];
        io.sockets.in(roomName).emit('oneuserready', {readyuser: Object.keys(roomList[roomName].roomReadyUserList  ).length , alluser:Object.keys(roomList[roomName].roomUserList  ).length  } );
      }
      userList[socket.id].userRoom = null;
      io.to(socket.id).emit('connectlobby', roomNumber);
    });

    socket.on('disconnect', function(){
      if(userList[socket.id].userRoom != null){
        try{
          var roomName = userList[socket.id].userRoom;
          delete roomList[roomName].roomUserList[socket.id];
          delete roomList[roomName].roomReadyUserList[socket.id];
          io.sockets.in(roomName).emit('oneuserready', {readyuser: Object.keys(roomList[roomName].roomReadyUserList  ).length , alluser:Object.keys(roomList[roomName].roomUserList  ).length  } );
        }catch(e){
          console.log("while playing game exit user");
          // 이 경우는 유저가 플레이 도중에 게임을 나간 것인데 어떻게 처리할 까 추후 고민해보자
        }
      }
      delete userList[socket.id];
      //console.log('disconnect user ' + socket.id );
      /*
      lookUserObjectList(userList);
      */
    });
});


server.listen(8085, function() {
  console.log('Board Game Server listening on port 8085');
});
