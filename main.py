from typing import Union
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect, Form, status, Cookie, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import sqlite3
from datetime import datetime
from typing import List
from starlette.middleware.sessions import SessionMiddleware
from flask import jsonify



app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your-secret-key")

app.mount("/static",StaticFiles(directory="static",html = True), name="static")
templates = Jinja2Templates(directory="templates")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

class Friend(BaseModel):
    name: str
# 데이터 모델 정의
class LoginRequest(BaseModel):
    username: str
    password: str
    friends: List[Friend]

# SQLite 데이터베이스 연결 및 테이블 생성
def getuser_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    
    return conn


        

class Message(BaseModel):
    user_id: str
    content: str
    timestamp: datetime
    friend_id: str  




def get_db_connection():
    conn = sqlite3.connect('chat.db')
    conn.execute('''CREATE TABLE IF NOT EXISTS messages
             (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, content TEXT, timestamp TEXT, friend_id TEXT)''')

    return conn

@app.get("/")
def read_root(req: Request):
    return templates.TemplateResponse("login.html",{"request": req})

# 로그인 처리 라우트
@app.post("/users/")
async def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    conn = getuser_db_connection()
    
    try:
        
        user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password)).fetchone()
        
        if user is None:
            # 사용자가 존재하지 않으면 새로운 사용자 생성
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password, friends) VALUES (?, ?, ?)", (username, password, ""))
            conn.commit()
            request.session["username"] = username
            print("New user added")  # 디버깅 메시지
            return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        elif user['password'] != password:
            print("Invalid password")  # 디버깅 메시지
            # 비밀번호가 일치하지 않는 경우
            return RedirectResponse(url="/?error=invalid_password", status_code=status.HTTP_302_FOUND)
        
        
        request.session["username"] = username
        

        return RedirectResponse(url="/friend", status_code=status.HTTP_302_FOUND)
    except Exception as e:
        print("Error:", e)  # 오류 출력
    finally:
            
        
        conn.close()

def get_last_message(conn, user_id, friend_id):
    last_message = conn.execute('''
        SELECT * FROM messages
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (user_id, friend_id, friend_id, user_id)).fetchone()
    return last_message[2] if last_message else None

@app.get("/friend")
async def friend(request: Request):
    current_username = request.session.get("username")
    if current_username is None:
        print("No username in session")  # 디버깅 메시지
        return
    conn = getuser_db_connection()
    
    try:
        current_user = conn.execute('SELECT * FROM users WHERE username = ?', (current_username,)).fetchone()
        friends = list(set(current_user['friends'].split(','))) if current_user['friends'] else []
      
        
    finally:
        conn.close()
    return templates.TemplateResponse("friend.html", {"request": request, "friends": friends})




@app.get("/index")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 메시지 저장 API


@app.get("/chatroom")
async def friend(request: Request):
    current_username = request.session.get("username")
    if current_username is None:
        print("No username in session")  # 디버깅 메시지
        return
    conn = getuser_db_connection()
    temp = get_db_connection()
    try:
        current_user = conn.execute('SELECT * FROM users WHERE username = ?', (current_username,)).fetchone()
        friends = list(set(current_user['friends'].split(','))) if current_user['friends'] else []
        friends_with_last_message = []
        for friend in friends:
            last_message = get_last_message(temp, current_username, friend)
            if last_message is not None:  # 채팅 내용이 None이 아닌 경우에만 추가
                friends_with_last_message.append((friend, last_message))
    finally:
        conn.close()
    return templates.TemplateResponse("chatroom.html", {"request": request, "friends": friends_with_last_message})

@app.get("/set_friend_id")
async def set_friend_id(request: Request):
    friendId = request.query_params.get('friendId')
    if friendId is None:
        raise HTTPException(status_code=400, detail="friendId is required")

    request.session['friendId'] = friendId  
    return {"message": "Friend ID received successfully"}


@app.get("/get_ids")
def get_ids(request: Request):
    userId = request.session.get('username')
    friendId = request.session.get('friendId')

    print("userId from session: ", userId) 
    print("friendId from session: ", friendId)

    return {
        "userId": userId,
        "friendId": friendId
    }


@app.post("/messages/")
async def create_message(request: Request, message: Message):
    current_username = request.session.get("username")
    current_friendId = request.session.get("friendId")
    conn = get_db_connection()
    cursor = conn.cursor()
    # message_type 필드를 INSERT 쿼리에 추가
    cursor.execute("INSERT INTO messages (user_id, content, timestamp, friend_id) VALUES (?, ?, ?, ?)",
                   (current_username, message.content, str(message.timestamp), current_friendId))
    conn.commit()
    conn.close()
    return {"message": "Message saved successfully" }


# 특정 사용자의 메시지 검색 API
@app.get("/messages/{user_id}/{message_type}")
async def read_messages(user_id: str, message_type: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE user_id = ? AND message_type = ?", (user_id, message_type))
    messages = cursor.fetchall()
    conn.close()
    if not messages:
        raise HTTPException(status_code=404, detail="Messages not found")
    return {"messages": messages}


# 모든 메시지 검색 API
@app.get("/messages/")
async def read_all_messages():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    conn.close()
    return {"messages": messages}




@app.post("/addfriend")
async def add_friend(request: Request, friendname: str = Form(...)):
    conn = getuser_db_connection()
    try:
        # friendname 값과 일치하는 사용자를 찾습니다.
        friend = conn.execute('SELECT * FROM users WHERE username = ?', (friendname,)).fetchone()
        
        if friend is not None:
            # 현재 사용자의 friends 칼럼을 가져옵니다.
            current_username = request.session.get("username")
            if current_username is None:
                print("No username in session")  # 디버깅 메시지
                return
            current_user = conn.execute('SELECT * FROM users WHERE username = ?', (current_username,)).fetchone()
            friends = current_user['friends'] if current_user['friends'] else ''

            # friends 칼럼에 friendname 값을 추가합니다.
            if friends:
                friends = friends + ',' + friendname
            else:
                friends = friendname

            conn.execute('UPDATE users SET friends = ? WHERE username = ?', (friends, current_username))
            conn.commit()

            print(f"Added {friendname} to friends")  # 디버깅 메시지
        else:
            print(f"No user with username {friendname}")  # 디버깅 메시지

    except Exception as e:
        print("Error:", e)  # 오류 출력
    finally:
        conn.close()
    return RedirectResponse(url="/friend", status_code=status.HTTP_302_FOUND)

