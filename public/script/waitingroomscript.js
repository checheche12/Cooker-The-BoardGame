socket.on('recMsg', function (data) {
        console.log(data.comment)
        $('#chat').append(data.comment);
});

socket.on('oneuserready', function (data) {
      $("#readyuser").text(data["readyuser"]);
      $("#alluser").text(data["alluser"]);
});

socket.on('gamestart', function (data) {
  $.ajax({
    url:'/playgame',
    type:'GET',
    dataType:'text',
    success: function(data){
      $("body").empty();
      $("body").append(data);
    }
  });
});


function sendMessage() {
    socket.emit("reqMsg", {comment: $('#user').val()});
    $('#user').val('');
}

function back(){
    socket.emit("exitroom");
}

function readyorcancle(){
  if($("#readybutton").attr("state") == "notready"){
    socket.emit("ready");
    $("#readybutton").attr("state","ready");
    $("#readybutton").attr("value","I'm ready!");
    $("#readybutton").attr("class","btn btn-danger");
  }else if($("#readybutton").attr("state") == "ready"){
    socket.emit("readycancle");
    $("#readybutton").attr("state","notready");
    $("#readybutton").attr("value","I'm not ready");
    $("#readybutton").attr("class","btn btn-dark");
  }
}
