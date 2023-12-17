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
        let friendUserId = event.target.innerText.trim(); 

        // friendUserId를 쿼리 파라미터로 추가
        let url = new URL('/set_friend_id', window.location.origin);
        url.searchParams.append('friendId', friendUserId);

        fetch(url, {
            method: 'GET',
        }).then(response => response.json())
          .then(data => console.log(data.message))
          .catch(error => console.error('에러:', error));
          window.location.href = '/index';
    });
});


function openPopup() {
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}