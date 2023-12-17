document.querySelector('.friend').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/friend';
});

document.querySelector('.login').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/';
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
