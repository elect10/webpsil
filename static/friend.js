document.querySelector('.chat').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/chatroom';
});

document.querySelector('.login').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/';
});

document.querySelector('.addfriend').addEventListener('click', function(event) {
    event.preventDefault();
    openPopup();
});

document.querySelectorAll('.friendlist').forEach(function(button) {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        let friendUserId = event.target.value; // 친구의 ID를 가져옵니다.
        sessionStorage.setItem('friendUserId', friendUserId); // 세션 스토리지에 친구의 ID를 저장합니다.
        window.location.href = '/index';
    });
});
        


function openPopup() {
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}