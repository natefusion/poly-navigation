from flask import Flask, request, jsonify, make_response
import sqlite3
import json
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'supersecret'

DB_PATH = 'users.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            bookmarks TEXT DEFAULT '[]',
            recent_searches TEXT DEFAULT '[]'
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def verify_user_from_cookie(req):
    username = req.cookies.get('username')
    password = req.cookies.get('password')

    if not username or not password:
        return None, None, 'Missing credentials in cookie'

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()

    if not row or row[0] != password:
        return None, None, 'Invalid credentials'
    return username, password, None

@app.route('/auth/signup', methods=['POST'])
def signup():
    username = request.args.get('username')
    password = request.args.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT 1 FROM users WHERE username = ?', (username,))
    if c.fetchone():
        conn.close()
        return jsonify({'error': 'Username already exists'}), 409

    c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
    conn.commit()
    conn.close()

    resp = make_response(jsonify({'message': 'ok'}), 200)
    resp.set_cookie('username', username)
    resp.set_cookie('password', password)
    return resp

@app.route('/auth/login', methods=['POST'])
def login():
    username = request.args.get('username')
    password = request.args.get('password')


    if not username or not password:
        username, password, error = verify_user_from_cookie(request)
        if error:
            return jsonify({'error': 'Missing username or password'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()

    if not row or row[0] != password:
        return jsonify({'error': 'Invalid username or password'}), 401

    resp = make_response(jsonify({'message': 'ok'}), 200)
    resp.set_cookie('username', username)
    resp.set_cookie('password', password)
    return resp


@app.route('/auth/bookmarks', methods=['GET', 'POST'])
def handle_bookmarks():
    username, password, error = verify_user_from_cookie(request)
    if error:
        return jsonify({'error': error}), 401

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if request.method == 'GET':
        c.execute('SELECT bookmarks FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        conn.close()
        return jsonify({'bookmarks': json.loads(row[0]) if row else []}), 200

    elif request.method == 'POST':
        try:
            bookmarks = json.loads(request.args.get('bookmarks', '[]'))
            c.execute('UPDATE users SET bookmarks = ? WHERE username = ?', (json.dumps(bookmarks), username))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Bookmarks updated'}), 200
        except Exception:
            conn.close()
            return jsonify({'error': 'Invalid JSON'}), 400


@app.route('/auth/recent_searches', methods=['GET', 'POST'])
def handle_recent_searches():
    username, password, error = verify_user_from_cookie(request)
    if error:
        return jsonify({'error': error}), 401

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if request.method == 'GET':
        c.execute('SELECT recent_searches FROM users WHERE username = ?', (username,))
        row = c.fetchone()
        conn.close()
        return jsonify({'recent_searches': json.loads(row[0]) if row else []}), 200

    elif request.method == 'POST':
        try:
            recent_searches = json.loads(request.args.get('recent_searches', '[]'))
            c.execute('UPDATE users SET recent_searches = ? WHERE username = ?', (json.dumps(recent_searches), username))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Recent searches updated'}), 200
        except Exception:
            conn.close()
            return jsonify({'error': 'Invalid JSON'}), 400


@app.route('/auth/logout', methods=['POST'])
def logout():
    resp = make_response(jsonify({'message': 'Logged out'}))
    resp.set_cookie('username', '', expires=0)
    resp.set_cookie('password', '', expires=0)
    return resp

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8443)

