import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Validation from './Validation';
import axios from 'axios';
import { SERVER_URL } from '../../config'; // Imported from central config

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        
        const errors = Validation({ username, email, password, confirmPassword });
        if (Object.keys(errors).length > 0) {
            setErrorMessage(Object.values(errors)[0]);
            return;
        }
        
        axios.post(`${SERVER_URL}/register`, { // Use the server URL variable
            username: username.trim(),
            email: email.trim(),
            password: password.trim()
        })
        .then(result => {
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            navigate('/login', { state: { successMessage: 'Registration successful! You can now log in.' } });
        })
        .catch(err => {
            console.error('Registration error:', err);
            if (err.code === 'ERR_NETWORK') {
                setErrorMessage('Cannot connect to server. Please check if the server is running.');
            } else if (err.response && err.response.data && err.response.data.message) {
                setErrorMessage(err.response.data.message);
            } else {
                setErrorMessage('Registration failed. Please try again later.');
            }
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-6 text-center">Register</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <label htmlFor="username" className="block text-left mb-2">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                    />
                    <label htmlFor="email" className="block text-left mb-2">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                    />
                    <label htmlFor="password" className="block text-left mb-2">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                    />
                    <label htmlFor="confirmPassword" className="block text-left mb-2">Confirm Password:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                    />
                    <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700">Register</button>
                </form>
                {errorMessage && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-red-500">{errorMessage}</p>
                            <button onClick={() => setErrorMessage('')} className="mt-4 p-2 bg-blue-500 text-white rounded">Close</button>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-green-500">{successMessage}</p>
                            <button onClick={() => setSuccessMessage('')} className="mt-4 p-2 bg-blue-500 text-white rounded">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
