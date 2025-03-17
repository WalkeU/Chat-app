const express = require('express');
const cors = require('cors');
const { registerUser, loginUser, verifyToken } = require('./auth');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db'); // Import the database connection

const app = express();
app.use(cors());
app.use(express.json());

const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected users
let connectedUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.userId = decoded.id;
        socket.username = decoded.username;
        socket.email = decoded.email;
        next();
    });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.username);
    connectedUsers[socket.userId] = socket.username;

    // Send updated online status to all clients
    io.emit('onlineStatus', connectedUsers);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.username);
        delete connectedUsers[socket.userId];
        io.emit('onlineStatus', connectedUsers);
    });

    socket.on('private message', (data) => {
        const { content, toUser } = data;
        const fromUser = socket.username;

        if (!toUser) {
            console.error('Error: toUser is null');
            return;
        }

        // Check if users are friends before allowing message
        db.query(
            'SELECT * FROM friends WHERE (user1 = ? AND user2 = ? AND status = "accepted") OR (user1 = ? AND user2 = ? AND status = "accepted")',
            [fromUser, toUser, toUser, fromUser],
            (err, results) => {
                if (err) {
                    console.error('Error checking friendship:', err);
                    return;
                }

                // Only allow messages if users are friends
                if (results.length === 0) {
                    console.log('Not friends, message rejected');
                    socket.emit('error', { message: 'You can only message friends' });
                    return;
                }

                // Store the message in the database
                db.query(
                    'INSERT INTO messages (fromUser, toUser, content) VALUES (?, ?, ?)',
                    [fromUser, toUser, content],
                    (err, result) => {
                        if (err) {
                            console.error('Error saving message:', err);
                            return;
                        }

                        // Broadcast the message to the recipient with a consistent structure
                        const message = {
                            content,
                            fromUser,
                            toUser,
                            timestamp: new Date().toISOString()
                        };
                        io.to(toUser).emit('private message', message);
                        console.log('Message sent:', message);
                    }
                );
            }
        );
    });

    socket.on('join', (username) => {
        socket.join(username);
    });
});

// User registration endpoint
app.post('/register', registerUser);

// User login endpoint
app.post('/login', loginUser);

// Example protected route
app.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({ message: 'This is a protected route', user: { id: req.userId, username: req.username, email: req.email } });
});

// Get all users
app.get('/users', verifyToken, (req, res) => {
    db.query('SELECT id, username, email FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }
        res.status(200).json(results);
    });
});

// Get user's friends list with status
app.get('/friends', verifyToken, (req, res) => {
    const username = req.username;
    
    db.query(
        `SELECT f.*, 
        CASE 
            WHEN f.user1 = ? THEN f.user2 
            ELSE f.user1 
        END AS friendName
        FROM friends f
        WHERE (f.user1 = ? OR f.user2 = ?)`,
        [username, username, username],
        (err, results) => {
            if (err) {
                console.error('Error fetching friends:', err);
                return res.status(500).json({ message: 'Error fetching friends' });
            }
            res.status(200).json(results);
        }
    );
});

// Send friend request
app.post('/friends/request', verifyToken, (req, res) => {
    const { toUser } = req.body;
    const fromUser = req.username;
    
    // Check if request already exists
    db.query(
        'SELECT * FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)',
        [fromUser, toUser, toUser, fromUser],
        (err, results) => {
            if (err) {
                console.error('Error checking friend request:', err);
                return res.status(500).json({ message: 'Error checking friend request' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ message: 'Friend request already exists' });
            }
            
            // Create new friend request
            db.query(
                'INSERT INTO friends (user1, user2, status) VALUES (?, ?, "pending")',
                [fromUser, toUser],
                (err, result) => {
                    if (err) {
                        console.error('Error creating friend request:', err);
                        return res.status(500).json({ message: 'Error creating friend request' });
                    }
                    
                    res.status(201).json({ message: 'Friend request sent' });
                }
            );
        }
    );
});

// Accept or reject friend request
app.put('/friends/:requestId', verifyToken, (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const username = req.username;
    
    // Verify user is the recipient of the request
    db.query(
        'SELECT * FROM friends WHERE id = ? AND user2 = ? AND status = "pending"',
        [requestId, username],
        (err, results) => {
            if (err) {
                console.error('Error checking friend request:', err);
                return res.status(500).json({ message: 'Error checking friend request' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'Friend request not found or not authorized' });
            }
            
            if (action === 'accept') {
                db.query(
                    'UPDATE friends SET status = "accepted" WHERE id = ?',
                    [requestId],
                    (err, result) => {
                        if (err) {
                            console.error('Error accepting friend request:', err);
                            return res.status(500).json({ message: 'Error accepting friend request' });
                        }
                        
                        res.status(200).json({ message: 'Friend request accepted' });
                    }
                );
            } else if (action === 'reject') {
                db.query(
                    'DELETE FROM friends WHERE id = ?',
                    [requestId],
                    (err, result) => {
                        if (err) {
                            console.error('Error rejecting friend request:', err);
                            return res.status(500).json({ message: 'Error rejecting friend request' });
                        }
                        
                        res.status(200).json({ message: 'Friend request rejected' });
                    }
                );
            } else {
                res.status(400).json({ message: 'Invalid action' });
            }
        }
    );
});

// API endpoint to fetch message history
app.get('/messages/:user1/:user2', verifyToken, (req, res) => {
    const user1 = req.params.user1;
    const user2 = req.params.user2;
    const username = req.username;
    
    // Verify the requesting user is part of the conversation
    if (username !== user1 && username !== user2) {
        return res.status(403).json({ message: 'Unauthorized access to messages' });
    }

    // Check if users are friends
    db.query(
        'SELECT * FROM friends WHERE (user1 = ? AND user2 = ? AND status = "accepted") OR (user1 = ? AND user2 = ? AND status = "accepted")',
        [user1, user2, user2, user1],
        (err, friendResults) => {
            if (err) {
                console.error('Error checking friendship:', err);
                return res.status(500).json({ message: 'Error checking friendship' });
            }

            if (friendResults.length === 0) {
                return res.status(403).json({ message: 'You can only view messages with friends' });
            }

            db.query(
                'SELECT * FROM messages WHERE (fromUser = ? AND toUser = ?) OR (fromUser = ? AND toUser = ?) ORDER BY timestamp',
                [user1, user2, user2, user1],
                (err, results) => {
                    if (err) {
                        console.error('Error fetching messages:', err);
                        return res.status(500).json({ message: 'Error fetching messages' });
                    }
                    res.status(200).json(results);
                }
            );
        }
    );
});

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});