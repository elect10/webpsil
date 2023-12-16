// document.addEventListener('DOMContentLoaded', function() {
//     const loginForm = document.getElementById('login-form');
//     const userIdInput = document.getElementById('user-id');

//     loginForm.addEventListener('submit', function(event) {
//         event.preventDefault(); 
//         currentUserId = userIdInput.value.trim(); 
//         loadMessages(currentUserId); 
//     });
   
// });






document.addEventListener('DOMContentLoaded', function() {
    let currentUserId = sessionStorage.getItem('currentUserId');
    let friendUserId = sessionStorage.getItem('friendUserId');

    loadMessages(currentUserId, friendUserId);


    let messageInput1 = document.getElementById('message-input');
    let sendButton1 = document.querySelector('.chat-container .send-button'); 

    loadMessages(currentUserId, friendUserId);
    let messageInput2 = document.getElementById('message-input2');
    let sendButton2 = document.querySelectorAll('.chat-container .send-button')[1];

    messageInput1.addEventListener('keyup', function(event) {
        
        if (event.key === 'Enter' && event.shiftKey) {
       
            
           
        }
        else if (event.key === 'Enter') {
            event.preventDefault();
            sendButton1.click();}
        });

    sendButton1.addEventListener('click', function() {
        sendMessage(messageInput1.value, 1);
    });

    messageInput2.addEventListener('keyup', function(event) {
        
        if (event.key === 'Enter' && event.shiftKey) {
        
        
        }
        else if (event.key === 'Enter') {
         event.preventDefault();
         sendButton2.click();
        }
    });

    sendButton2.addEventListener('click', function() {
        sendMessage(messageInput2.value, 2);
    });
});


let socket = new WebSocket("ws://localhost:8000/ws");

socket.onopen = function(e) {
    console.log("[open] Connection established");
};

socket.onmessage = function(event) {
   
    const data = JSON.parse(event.data);
    if(data.user_id === currentUserId) {
        addUserMessage(document.getElementById('chat-container1'), data.content);
    } else {
        addOppMessage(document.getElementById('chat-container1'), data.content, data.user_id);
    }
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



async function sendToServer(message, userId, messageType) {
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
                message_type: messageType
            })
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}



async function loadMessages(currentUserId, friendUserId) {
    try {
        const response = await fetch(`/messages/`);
        const data = await response.json();
        if (data.messages) {
            clearMessages(); 
            data.messages.forEach(message => {
                const userContainer = document.getElementById('chat-container1');
                
                if(message[1] === currentUserId && message[3] === friendUserId) {
                    addUserMessage(userContainer, message[2]);
                } else if(message[1] === friendUserId && message[3] === currentUserId) {
                    addOppMessage(userContainer, message[2], message[1]);
                }
            });
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}





function sendMessage(message, inputNumber) {    
    let userId = document.getElementById('user-id').value;
    let messageType = inputNumber === 1 ? 'user' : 'opp'; 
    sendToServer(message, userId, messageType);
    message = message.trim();
    if(message !== "") {
        let userContainer = document.querySelectorAll('.chat-container')[inputNumber - 1]; // 보낸 메시지를 추가할 컨테이너
        let oppContainer = document.querySelectorAll('.chat-container')[inputNumber % 2]; // 받은 메시지를 추가할 컨테이너

        // 보낸 메시지 처리
        //addUserMessage(userContainer, message);

        // 받은 메시지 처리
        //addOppMessage(oppContainer, message, userId);

        
        document.getElementById(inputNumber === 1 ? 'message-input' : 'message-input2').value = '';
    }
    let data = JSON.stringify({
        user_id: currentUserId,
        content: message,
        timestamp: new Date(),
        message_type: messageType
    });

    socket.send(data);

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
