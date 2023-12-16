document.querySelector('.friend').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/friend';
});

document.querySelector('.login').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/';
});