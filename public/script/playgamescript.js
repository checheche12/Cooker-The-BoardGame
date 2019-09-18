var timer, i = 0, divide = 100;

function timerStart(){
 timer = self.setInterval(increment, (1000 / divide));
};

function increment(){
 i++;
 $("#timertimer").text( String( (15.00 - (1000 / (divide*1000) * i)).toFixed(2) ));
 if(i>1500){
   reset();
 }
};

function stop(){
 clearInterval(timer);
 timer = null;
};

function reset(){
 stop();
 i = 0;
 $("#timertimer").text("15.00");
};

socket.on('yourturn', function (data) {
  timerStart();
});

socket.on('endturn', function (data) {
  reset();
});

function diceplay(){
  socket.emit("playgamemessage",{message:"2"});
}

socket.on('playgrounddata',function(data){
  var boardData = data["playgrounddata"];
  for(var i = 0;i<boardData.length;i++){
    for(var j = 0;j<boardData[i].length;j++){
      if(boardData[i][j].user != "" ){
        $("td[row="+i+"][col="+j+"]").text( boardData[i][j].user.substring(0,2) );
      }
    }
  }
});

socket.on('playerdata',function(data){
  console.log(data["player"]);
});
