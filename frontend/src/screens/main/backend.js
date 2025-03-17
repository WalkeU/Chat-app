import axios from 'axios';
import io from 'socket.io-client';
import { SERVER_URL } from '../../config'; // Import from central config

export const fetchUserData = (token, navigate, setUser) => {
    axios.get(`${SERVER_URL}/protected`, {
        headers: { Authorization: token }
    })
    .then(response => {
        setUser(response.data.user);
    })
    .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
    });
};

export const fetchAllUsers = async (token) => {
    try {
        const response = await axios.get(`${SERVER_URL}/users`, {
            headers: { Authorization: token }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const fetchFriends = async (token) => {
    try {
        const response = await axios.get(`${SERVER_URL}/friends`, {
            headers: { Authorization: token }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching friends:', error);
        return [];
    }
};

export const sendFriendRequest = async (token, toUser) => {
    try {
        const response = await axios.post(`${SERVER_URL}/friends/request`, 
            { toUser },
            { headers: { Authorization: token } }
        );
        return { success: true, message: response.data.message };
    } catch (error) {
        console.error('Error sending friend request:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Failed to send friend request' 
        };
    }
};

export const respondToFriendRequest = async (token, requestId, action) => {
    try {
        const response = await axios.put(`${SERVER_URL}/friends/${requestId}`,
            { action },
            { headers: { Authorization: token } }
        );
        return { success: true, message: response.data.message };
    } catch (error) {
        console.error('Error responding to friend request:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Failed to process friend request' 
        };
    }
};

export const initializeSocket = (token, user, setSocket, setOnlineUsers, setMessages) => {
    const newSocket = io(SERVER_URL, {
        auth: {
            token: token
        }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        newSocket.emit('join', user.username);
    });

    newSocket.on('onlineStatus', (onlineStatuses) => {
        setOnlineUsers(onlineStatuses);
    });

    newSocket.on('private message', (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
    });

    newSocket.on('error', (error) => {
        console.error('Socket error:', error.message);
        alert(error.message);
    });

    return newSocket;
};

export const fetchMessageHistory = async (user1, user2, token, setMessages) => {
    try {
        const response = await axios.get(`${SERVER_URL}/messages/${user1}/${user2}`, {
            headers: {
                Authorization: token
            }
        });
        setMessages(response.data.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp).toISOString()
        })));
    } catch (error) {
        console.error('Error fetching message history:', error);
        if (error.response?.status === 403) {
            alert('You can only message users who are your friends');
            setMessages([]);
        }
    }
};
