import React, { useState, useEffect, useRef } from 'react';
import { Scrollbar } from 'react-scrollbars-custom';

export const UserList = ({ activeTab, setActiveTab, allUsers, friends, user, selectedUser, setSelectedUser, isOnline, getFriendshipStatus, handleSendFriendRequest, handleFriendResponse, isMobile }) => {
    const renderUserActionButton = (username) => {
        const status = getFriendshipStatus(username);
        
        if (status === 'accepted') {
            return (
                <button 
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg" 
                    onClick={() => setSelectedUser(username)}
                >
                    Message
                </button>
            );
        }
        
        if (status === 'sent') {
            return <span className="text-xs text-yellow-500">Request sent</span>;
        }
        
        if (status === 'received') {
            const request = friends.find(f => 
                f.status === 'pending' && f.user1 === username && f.user2 === user.username
            );
            
            return (
                <div className="flex space-x-1">
                    <button 
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg" 
                        onClick={() => handleFriendResponse(request.id, 'accept')}
                    >
                        Accept
                    </button>
                    <button 
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg" 
                        onClick={() => handleFriendResponse(request.id, 'reject')}
                    >
                        Reject
                    </button>
                </div>
            );
        }
        
        return (
            <button 
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg" 
                onClick={() => handleSendFriendRequest(username)}
            >
                Add friend
            </button>
        );
    };

    const renderUsersList = () => {
        if (activeTab === 'all') {
            return allUsers.map(userItem => (
                <li key={userItem.id} className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-gray-700">
                    <div className="flex items-center">
                        <div className="relative">
                            {isOnline(userItem.username) && (
                                <span className="absolute top-1/2 left-0 transform -translate-y-1/2 h-2 w-2 bg-green-500 rounded-full"></span>
                            )}
                            <span className="ml-3">{userItem.username}</span>
                        </div>
                    </div>
                    {renderUserActionButton(userItem.username)}
                </li>
            ));
        }
        
        if (activeTab === 'friends') {
            return friends
                .filter(f => f.status === 'accepted')
                .map(friend => {
                    const friendName = friend.user1 === user.username ? friend.user2 : friend.user1;
                    return (
                        <li 
                            key={friend.id} 
                            className={`flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-gray-700 ${selectedUser === friendName ? 'bg-gray-700' : ''}`}
                            onClick={() => setSelectedUser(friendName)}
                        >
                            <div className="flex items-center">
                                <div className="relative">
                                    {isOnline(friendName) && (
                                        <span className="absolute top-1/2 left-0 transform -translate-y-1/2 h-2 w-2 bg-green-500 rounded-full"></span>
                                    )}
                                    <span className="ml-3">{friendName}</span>
                                </div>
                            </div>
                            <button 
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg"
                            >
                                Message
                            </button>
                        </li>
                    );
                });
        }
        
        if (activeTab === 'requests') {
            return friends
                .filter(f => f.status === 'pending' && f.user2 === user.username)
                .map(request => (
                    <li key={request.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700">
                        <div className="flex items-center">
                            <div className="relative">
                                {isOnline(request.user1) && (
                                    <span className="absolute top-1/2 left-0 transform -translate-y-1/2 h-2 w-2 bg-green-500 rounded-full"></span>
                                )}
                                <span className="ml-3">{request.user1}</span>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button 
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg" 
                                onClick={() => handleFriendResponse(request.id, 'accept')}
                            >
                                Accept
                            </button>
                            <button 
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg" 
                                onClick={() => handleFriendResponse(request.id, 'reject')}
                            >
                                Reject
                            </button>
                        </div>
                    </li>
                ));
        }
        
        return null;
    };

    return (
        // <div className={`${isMobile && selectedUser ? 'hidden' : 'block'} w-full ml-4 md:ml-0 md:w-1/4 p-2 bg-gray-800 rounded-lg shadow-lg h-full overflow-hidden flex flex-col`}>
        <div className={`${isMobile && selectedUser ? 'hidden' : 'block'} w-full ${isMobile ? '' : 'ml-4'} md:ml-0 md:w-1/4 p-2 bg-gray-800 rounded-lg shadow-lg h-full overflow-hidden flex flex-col`}>
            <div className="flex mb-2 border-b border-gray-700 pb-2">
                <button 
                    className={`flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg mr-1 ${activeTab === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Users
                </button>
                <button 
                    className={`flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg mr-1 ${activeTab === 'friends' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button 
                    className={`flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg ${activeTab === 'requests' ? 'bg-blue-600' : 'bg-gray-700'} flex items-center justify-center`}
                    onClick={() => setActiveTab('requests')}
                >
                    Requests
                    {friends.filter(f => f.status === 'pending' && f.user2 === user.username).length > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                            {friends.filter(f => f.status === 'pending' && f.user2 === user.username).length}
                        </span>
                    )}
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                <Scrollbar style={{ width: '100%', height: '100%' }} className="scrollable-area">
                    <ul className="space-y-1 p-1">
                        {renderUsersList()}
                    </ul>
                </Scrollbar>
            </div>
        </div>
    );
};

export const ChatWindow = ({ selectedUser, user, messages, messagesRef, messageContent, setMessageContent, sendMessage, isOnline, isMobile, setSelectedUser }) => {
    const scrollbarRef = useRef(null);
    
    // Ensure scrolling to bottom when messages change
    useEffect(() => {
        if (scrollbarRef.current) {
            scrollbarRef.current.scrollToBottom();
        }
    }, [messages]);
    
    // Use different layouts based on mobile/desktop
    const getContainerClasses = () => {
        if (isMobile) {
            return `${!selectedUser ? 'hidden' : 'block'} w-full p-2 h-full`;
        } else {
            // Original desktop layout
            return "w-full md:w-3/4 px-4";
        }
    };
    
    return (
        <div className={getContainerClasses() + " flex flex-col"}>
            {selectedUser ? (
                <div className={isMobile ? "h-full flex flex-col" : "flex flex-col h-full"}>
                    <div className="bg-gray-800 p-2 rounded-lg shadow-lg mb-2 flex items-center">
                        {isMobile && (
                            <button 
                                onClick={() => setSelectedUser(null)} 
                                className="py-1 px-2 mr-2 bg-gray-700 hover:bg-gray-600 rounded-lg inline-flex items-center transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold">Chatting with: {selectedUser}</h2>
                            <div className="text-xs text-gray-400">
                                {isOnline(selectedUser) ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                    {isMobile ? (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-2">
                                <Scrollbar
                                    ref={scrollbarRef}
                                    style={{ width: '100%', height: '100%' }}
                                    className="scrollable-area"
                                >   
                                    <div className="p-3 space-y-2">
                                        {messages.map((message, index) => (
                                            <div key={index} className={`p-2 rounded-lg ${message.fromUser === user.username ? 'bg-blue-600 text-right' : 'bg-gray-700 text-left'}`}>
                                                <span className="font-bold">{message.fromUser === user.username ? 'You' : message.fromUser}:</span> {message.content}
                                            </div>
                                        ))}
                                    </div>
                                </Scrollbar>
                            </div>
                            <div className="mt-auto">
                                <div className="flex">
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg mr-2 bg-gray-800 text-white"
                                        placeholder="Message"
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Send</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-grow bg-gray-800 rounded-lg shadow-lg overflow-y-auto p-4" ref={messagesRef}>
                                <Scrollbar style={{ width: '100%', height: '100%' }} ref={scrollbarRef}>   
                                    {messages.map((message, index) => (
                                        <div key={index} className={`mb-2 p-2 rounded-lg ${message.fromUser === user.username ? 'bg-blue-600 text-right' : 'bg-gray-700 text-left'}`}>
                                            <span className="font-bold">{message.fromUser === user.username ? 'You' : message.fromUser}:</span> {message.content}
                                        </div>
                                    ))}
                                </Scrollbar>
                            </div>
                            <div className="py-2 mt-auto">
                                <div className="flex">
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg mr-2 bg-gray-800 text-white"
                                        placeholder="Enter your message"
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Send</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className={isMobile ? "h-full flex flex-col" : "flex flex-col h-full"}>
                    <div className="bg-gray-800 p-3 rounded-lg shadow-lg mb-2">
                        <h2 className="text-lg font-bold">Welcome, {user.username}!</h2>
                    </div>
                    {isMobile ? (
                        <div className="flex-1 p-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <Scrollbar style={{ width: '100%', height: '100%' }} className="scrollable-area">
                                <div className="p-2">
                                    <p className="text-gray-400">Select a user to start chatting or explore the features of the app.</p>
                                    <p className="text-gray-400 mt-2">
                                        <strong>How to use the chat app:</strong>
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 text-gray-400">
                                        <li>Browse the "All Users" tab to see all registered users</li>
                                        <li>Send friend requests by clicking "Add friend"</li>
                                        <li>Accept or reject incoming requests in the "Requests" tab</li>
                                        <li>Chat with your accepted friends from the "Friends" tab</li>
                                        <li>Green dots indicate users who are currently online</li>
                                    </ul>
                                </div>
                            </Scrollbar>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 bg-gray-800 rounded-lg shadow-lg overflow-y-auto">
                            <p className="text-gray-400">Select a user to start chatting or explore the features of the app.</p>
                            <p className="text-gray-400 mt-2">
                                <strong>How to use the chat app:</strong>
                            </p>
                            <ul className="list-disc pl-5 mt-2 text-gray-400">
                                <li>Browse the "All Users" tab to see all registered users</li>
                                <li>Send friend requests by clicking "Add friend"</li>
                                <li>Accept or reject incoming requests in the "Requests" tab</li>
                                <li>Chat with your accepted friends from the "Friends" tab</li>
                                <li>Green dots indicate users who are currently online</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const Notification = ({ notification, setNotification }) => (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs sm:max-w-sm">
        <div className={`p-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex justify-between">
                <p className="text-white text-sm sm:text-base">{notification.message}</p>
                <button onClick={() => setNotification(null)} className="text-white ml-4">&times;</button>
            </div>
        </div>
    </div>
);
