let server = window.location.href;
let socket = io();

document.getElementById('btn-anonymous').addEventListener('click', () => 
{
    // info default
    json = JSON.stringify({
        'id' : '',
        'name' : 'Anônimo',
        'email' : 'anonimo@anonimo.com',
        'picture' : '/images/user-anonimo.jpg'
    });
    showMessage("Conectando ao servidor...");
    socket.emit("connect player", json);
});

/*
* Callback para autenticação de usuário via google api
* @params response : Objeto com informações do usuário autenticado
**/
onSignIn = (response) => 
{
    // Conseguindo as informações do usuário:
    let perfil = response.getBasicProfile();

    // Conseguindo o ID do Usuário
    let userID = perfil.getId();

    // Conseguindo o Nome do Usuário
    let userName = perfil.getName();

    // Conseguindo o E-mail do Usuário
    let userEmail = perfil.getEmail();

    // Conseguindo a URL da Foto do Perfil
    let userPicture = perfil.getImageUrl();

    document.getElementById('player-photo').setAttribute('src', userPicture);
    document.getElementById('player-name').innerHTML = userName;
    document.getElementById('player-email').innerHTML = userEmail;

    json = JSON.stringify({
        'id' : userID,
        'name' : userName,
        'email' : userEmail,
        'picture' : userPicture,
    });

    showMessage("Conectando ao servidor...");
    socket.emit("connect player", json);
};

socket.on('waiting player', function(data){
    showMessage("Aguardando um outro jogador...");
});

socket.on('players connected', function(){
    showMessage("Iniciando a partida...");
    setTimeout(() =>{
        window.location.href = server + "game";
    }, 2000);
});

showMessage = (msg) =>
{
    document.getElementById('message').innerHTML = msg;
}