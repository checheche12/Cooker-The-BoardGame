var socket = io.connect('http://13.209.99.0:8085');

socket.on('connectroom', function(data){
  $.ajax({
    url:'/waitingroom?roomnumber='+data,
    type:'GET',
    dataType:'text',
    success: function(data){
      $("body").empty();
      $("body").append(data);
    }
  });
});

socket.on('connectlobby', function(data){
  $.ajax({
    url:'/lobby',
    type:'GET',
    dataType:'text',
    success: function(data){
      $("body").empty();
      $("body").append(data);
    }
  });
});

function jointhisroom(id){
  $.ajax({
    url:'/waitingroom?roomnumber='+id,
    type:'GET',
    dataType:'text',
    success: function(data){
      $("body").empty();
      $("body").append(data);
      socket.emit("joinroom",{roomNumber:id});
    }
  });
}

function makeroom(){
  var roomName = prompt("Please Write Room Name!");
  if(roomName != null){
    socket.emit("makeroom", {roomName:roomName});
  }else{
    makeroom();
  }
}
