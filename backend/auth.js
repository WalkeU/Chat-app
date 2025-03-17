const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const registerUser = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error. Please try again.' });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: 'User already exists with this email or username' });
            }

            // Password hashing
            const salt = await bcrypt.genSalt(10); // Increased salt rounds for better security
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // No password hashing
            // const hashedPassword = password;

            db.query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Error registering user:', err);
                        return res.status(500).json({ message: 'Error registering user' });
                    }

                    return res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error. Please try again.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            const user = results[0];
            
            // Password hashing
            const isPasswordValid = await bcrypt.compare(password, user.password);

            // No password hashing
            // const isPasswordValid = password === user.password;

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // JWT token
            const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            return res.status(200).json({ message: 'Login successful', token });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        req.username = decoded.username;
        req.email = decoded.email;
        next();
    });
};

module.exports = { registerUser, loginUser, verifyToken };
