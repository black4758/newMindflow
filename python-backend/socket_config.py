# socket_config.py
from flask import Flask
from flask_socketio import SocketIO
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key_change_me')
socketio = SocketIO(app, cors_allowed_origins="*", host='0.0.0.0', message_queue=os.getenv('REDIS_URL', 'redis://redis:6379/0'))