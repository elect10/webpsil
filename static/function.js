
document.addEventListener('DOMContentLoaded', function() {
    

    loadMessages();

    let messageInput = document.getElementById('message-input');
    let sendButton = document.querySelector('.chat-container .send-button'); 

    messageInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener('click', function() {
        sendMessage(messageInput.value);
    });
});


let socket = new WebSocket("ws://localhost:8000/ws");

socket.onopen = function(e) {
    console.log("[open] Connection established");
};

socket.onmessage = function(event) {
    console.log("Received message: ", event.data);  // 로그 추가



    fetch('/get_ids')
    .then(response => response.json())
    .then(iddata => {
        

        let userId = iddata.userId;
        let friendId = iddata.friendId;

        console.log("userId: ", userId);
        console.log("friendId: ", friendId);

        const data = JSON.parse(event.data);
    if(data.user_id === userId) {
        addUserMessage(document.getElementById('chat-container1'), data.content);
    } else if(data.user_id === friendId) {
        addOppMessage(document.getElementById('chat-container1'), data.content, friendId);
    }
        
    });
    
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
       
        console.log('[close] Connection died');
    }
};

socket.onerror = function(error) {
    console.error(`[error] ${error.message}`);
};

async function sendToServer(message, userId, friendId) {
    try {
        await fetch('/messages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                content: message,
                timestamp: new Date(),
                friend_id: friendId
            })
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function loadMessages() {





    try {
        const response = await fetch(`/messages/`);
        const data = await response.json();
        fetch('/get_ids')
        .then(response => response.json())
        .then(iddata => {
        

            let userId = iddata.userId;
            let friendId = iddata.friendId;
            if (data.messages) {
                clearMessages(); 
                data.messages.forEach(message => {
                    const userContainer = document.getElementById('chat-container1');
                    
                    if(message[1] === userId && message[4] === friendId) {
                        addUserMessage(userContainer, message[2]);
                    } else if(message[1] === friendId && message[4] === userId) {
                        addOppMessage(userContainer, message[2], friendId);
                    }
                });
            }
        
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function sendMessage(message) {   
    fetch('/get_ids')
    .then(response => response.json())
    .then(data => {
        

        let userId = data.userId;
        let friendId = data.friendId;

        console.log("userId: ", userId);
        console.log("friendId: ", friendId);
        
        sendToServer(message, userId, friendId);
        message = message.trim();
        if(message !== "") {
            document.getElementById('message-input').value = '';
        }
        let messageData = JSON.stringify({
            user_id: userId,
            content: message,
            timestamp: new Date(),
            friend_id: friendId
        });

        

        socket.send(messageData);
    });
}



function addUserMessage(container, message) {
    
    

    let newMessageDiv = document.createElement('div');
    newMessageDiv.classList.add('user-message');

    let newChatBubble = document.createElement('div');
    newChatBubble.classList.add('chat-bubble', 'user');

    let newChatContent = document.createElement('div');
    newChatContent.classList.add('chat-content');
    newChatContent.textContent = message;

    let newChatTime = document.createElement('span');
    newChatTime.classList.add('chat-time');
    newChatTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


    
    newChatBubble.appendChild(newChatContent);
    newMessageDiv.appendChild(newChatBubble);
    newMessageDiv.appendChild(newChatTime);

    container.appendChild(newMessageDiv);
    newMessageDiv.scrollIntoView({ behavior: 'smooth' });
}

function clearMessages() {
    
    const userMessages = document.querySelectorAll('.user-message, .opp-message, .user-idbox');
    
    userMessages.forEach(message => {
        message.remove();
    });
}

function addOppMessage(container, message, userid) {

    
    let newidDiv = document.createElement('div');
    newidDiv.classList.add('user-idbox');
    newidDiv.textContent = userid; 

    let newMessageDiv = document.createElement('div');
    newMessageDiv.classList.add('opp-message');

    let newChatBubble = document.createElement('div');
    newChatBubble.classList.add('chat-bubble', 'opp');

    let newChatContent = document.createElement('div');
    newChatContent.classList.add('chat-content');
    newChatContent.textContent = message;

    let newChatTime = document.createElement('span');
    newChatTime.classList.add('chat-time');
    newChatTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    newidDiv;
    newChatBubble.appendChild(newChatContent);
    newMessageDiv.appendChild(newChatBubble);
    newMessageDiv.appendChild(newChatTime);

    container.appendChild(newidDiv);
    container.appendChild(newMessageDiv);
    
newMessageDiv.scrollIntoView({ behavior: 'smooth' });

}


document.querySelector('.exit').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/chatroom';
});