document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // 폼의 기본 제출 동작 방지

    // 폼 데이터 가져오기
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // fetch API를 사용하여 서버에 POST 요청 보내기
    try {
        const response = await fetch('/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        // 서버의 응답 처리
        if (response.ok) {
            // 로그인 성공 시, 다른 페이지로 리디렉션
            window.location.href = '/friend';
        } else {
            // 로그인 실패 시, 오류 메시지 표시
            alert('Login failed!');
        }
    } catch (error) {
        // 네트워크 오류나 요청 오류 발생 시
        console.error('Error during login:', error);
    }
});
