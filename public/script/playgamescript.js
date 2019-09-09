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
