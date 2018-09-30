let player1 = {};
player1.avatar = document.getElementById('player1-photo').getAttribute('src');
player1.name = document.getElementById('player1-name').innerHTML;

let player2 = {};
player2.avatar = document.getElementById('player2-photo').getAttribute('src');
player2.name = document.getElementById('player2-name').innerHTML;

document.getElementById('view-chat').addEventListener('click', () => {
    document.getElementById('chat-message-count').innerHTML = "";
});

formatAMPM = (date) => 
{
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}            

insertChat = (who, text, time) =>
{
    if (time === undefined)
        time = 0;

    let control = "";
    let date = formatAMPM(new Date());
    let player = (who != 1) ? player2 : player1;

    if (who === numPlayer)
    {
        control = '<li>' +
                        '<div class="msj macro">' +
                            '<div class="avatar">' +
                                '<img class="rounded-circle" style="width:50px;height:50px;" src="'+ player.avatar +'" />' +
                            '</div>' +
                            '<div class="text text-l">' +
                                '<p>Você disse:</p>' +
                                '<p class="pl-2">'+ text +'</p>' +
                                '<p><small>'+date+'</small></p>' +
                            '</div>' +
                        '</div>' +
                    '</li>';
    }
    else
    {
        if($("#modal-chat").hasClass("show") === false)
        {
            let qtde = document.getElementById('chat-message-count').innerHTML;
            document.getElementById('chat-message-count').innerHTML = ++qtde;
        }

        control = '<li>' +
                        '<div class="msj-rta macro">' +
                            '<div class="text text-r">' +
                                '<p>' + player.name +' disse:</p>' +
                                '<p class="pl-2">'+text+'</p>' +
                                '<p><small>'+date+'</small></p>' +
                            '</div>' +
                        '<div class="avatar" style="padding:0px 0px 0px 10px !important"><img class="rounded-circle" style="width:50px;height:50px;" src="'+player.avatar+'" /></div>' +                                
                  '</li>';
    }
    setTimeout( () => {
        $("ul#chat").append(control).scrollTop($("ul#chat").prop('scrollHeight'));
    }, time);
    
}

resetChat = () => 
{
    $("ul").empty();
}

sendMessage = () => 
{
    let text = $("#mytext").val();
    if (text !== ""){
        data = JSON.stringify({
            "num_player" : numPlayer,
            "text" : text
        });
        socket.emit('receive message', data);           
        $("#mytext").val('');
    }
}

$("#btn-send").click(sendMessage);

$("#mytext").on("keydown", (e) => 
{
    if (e.which == 13)
        sendMessage();
});

$('body > div > div > div:nth-child(2) > span').click(() => {
    $(".mytext").trigger({type: 'keydown', which: 13, keyCode: 13});
});

socket.on('receive message', (data) => {
    let message = JSON.parse(data);
    insertChat(message.num_player, message.text);
});