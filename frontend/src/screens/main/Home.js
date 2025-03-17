import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    fetchUserData, 
    initializeSocket, 
    fetchMessageHistory, 
    fetchAllUsers, 
    fetchFriends, 
    sendFriendRequest, 
    respondToFriendRequest 
} from './backend';
import 'tailwindcss/tailwind.css';
import { UserList, ChatWindow, Notification } from './UIComponents'; // Import UI components

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState('');
    const [onlineUsers, setOnlineUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'friends', 'requests'
    const [isMobile, setIsMobile] = useState(false);
    const token = localStorage.getItem('token');
    const messagesRef = useRef(null);

    // Detect mobile screen size
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIsMobile(); // Check on initial load
        window.addEventListener('resize', checkIsMobile);
        
        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    // Fix viewport height on mobile - enhanced version
    useEffect(() => {
        const setViewportHeight = () => {
            // Calculate viewport height accounting for address bar
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Also set a class on body to prevent scrolling
            document.body.style.height = `${window.innerHeight}px`;
            document.body.style.overflow = 'hidden';
        };

        setViewportHeight();
        
        // Handle various events that might change the viewport
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);
        window.addEventListener('load', setViewportHeight);
        
        // Add scroll prevention for iOS Safari
        document.addEventListener('touchmove', function(e) {
            if(e.target.closest('.scrollable-area')) return;
            e.preventDefault();
        }, { passive: false });
        
        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('orientationchange', setViewportHeight);
            window.removeEventListener('load', setViewportHeight);
            document.removeEventListener('touchmove', function(){}, { passive: false });
        };
    }, []);

    // Load user data and authentication
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        fetchUserData(token, navigate, setUser);
    }, [token, navigate]);

    // Initialize socket connection
    useEffect(() => {
        if (user) {
            const newSocket = initializeSocket(token, user, setSocket, setOnlineUsers, setMessages);
            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, token]);

    // Fetch all users and friends list
    useEffect(() => {
        if (user) {
            const loadData = async () => {
                const users = await fetchAllUsers(token);
                setAllUsers(users.filter(u => u.username !== user.username));
                
                const friendsList = await fetchFriends(token);
                setFriends(friendsList);
            };
            
            loadData();
            
            // Refresh friends list every 30 seconds
            const interval = setInterval(async () => {
                const friendsList = await fetchFriends(token);
                setFriends(friendsList);
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [user, token]);

    // Auto scroll messages to bottom
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch message history when selecting a user
    useEffect(() => {
        if (user && selectedUser) {
            fetchMessageHistory(user.username, selectedUser, token, setMessages);
        }
    }, [user, selectedUser, token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/logout');
    };

    const sendMessage = () => {
        if (messageContent && selectedUser) {
            const isFriend = friends.some(f => 
                (f.status === 'accepted' && 
                ((f.user1 === user.username && f.user2 === selectedUser) || 
                 (f.user2 === user.username && f.user1 === selectedUser)))
            );
            
            if (!isFriend) {
                setNotification({
                    type: 'error',
                    message: 'You can only message your friends'
                });
                return;
            }
            
            const message = {
                content: messageContent,
                fromUser: user.username,
                toUser: selectedUser,
                timestamp: new Date().toISOString()
            };
            socket.emit('private message', message);
            setMessages(prevMessages => [...prevMessages, message]);
            setMessageContent('');
        }
    };
    
    const handleSendFriendRequest = async (username) => {
        const result = await sendFriendRequest(token, username);
        setNotification({
            type: result.success ? 'success' : 'error',
            message: result.message
        });
        
        if (result.success) {
            const friendsList = await fetchFriends(token);
            setFriends(friendsList);
        }
    };

    const handleFriendResponse = async (requestId, action) => {
        const result = await respondToFriendRequest(token, requestId, action);
        setNotification({
            type: result.success ? 'success' : 'error',
            message: result.message
        });
        
        if (result.success) {
            const friendsList = await fetchFriends(token);
            setFriends(friendsList);
        }
    };
    
    const isOnline = (username) => {
        return Object.values(onlineUsers).includes(username);
    };
    
    const getFriendshipStatus = (username) => {
        const friendship = friends.find(f => 
            (f.user1 === username && f.user2 === user.username) || 
            (f.user2 === username && f.user1 === user.username)
        );
        
        if (!friendship) return null;
        
        if (friendship.status === 'accepted') return 'accepted';
        if (friendship.status === 'pending' && friendship.user1 === user.username) return 'sent';
        if (friendship.status === 'pending' && friendship.user2 === user.username) return 'received';
        
        return null;
    };

    if (!user) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <div className="h-screen max-h-screen bg-gray-900 text-white flex flex-col overflow-hidden" 
             style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
            <nav className="bg-gray-800 p-2 flex justify-between items-center shadow-lg">
                <div className="text-white text-lg sm:text-xl font-bold truncate pr-2">Welcome, {user.username}!</div>
                <div>
                    <button onClick={handleLogout} className="text-white bg-red-600 p-1.5 rounded hover:bg-red-700 text-sm">Logout</button>
                </div>
            </nav>
            <div className="flex-1 overflow-hidden p-2 sm:p-2">
            
                <div className="h-full flex flex-col md:flex-row">
                    <UserList 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                        allUsers={allUsers} 
                        friends={friends} 
                        user={user} 
                        selectedUser={selectedUser} 
                        setSelectedUser={setSelectedUser} 
                        isOnline={isOnline} 
                        getFriendshipStatus={getFriendshipStatus} 
                        handleSendFriendRequest={handleSendFriendRequest} 
                        handleFriendResponse={handleFriendResponse} 
                        isMobile={isMobile}
                    />
                    <ChatWindow 
                        selectedUser={selectedUser} 
                        user={user} 
                        messages={messages} 
                        messagesRef={messagesRef} 
                        messageContent={messageContent} 
                        setMessageContent={setMessageContent} 
                        sendMessage={sendMessage} 
                        isOnline={isOnline}
                        isMobile={isMobile}
                        setSelectedUser={setSelectedUser}
                    />
                </div>
            </div>
            
            {notification && (
                <Notification 
                    notification={notification} 
                    setNotification={setNotification} 
                />
            )}
        </div>
    );
};

export default Home;
