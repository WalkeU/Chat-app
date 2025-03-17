import React, { useState, useEffect } from 'react';
import Validation from './Validation.js';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../../config'; // Imported from central config

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state && location.state.successMessage) {
            setSuccessMessage(location.state.successMessage);
        }
    }, [location.state]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const validationErrors = Validation({ username, password });
        if (validationErrors.length > 0) {
            setErrorMessage(validationErrors.join(', '));
            return;
        }

        axios.post(`${SERVER_URL}/login`, { // Use the server URL variable
            username: username.trim(),
            password: password.trim()
        })
            .then(result => {
                setSuccessMessage('Login successful!');
                localStorage.setItem('token', result.data.token);
                setUsername('');
                setPassword('');
                navigate('/');
            })
            .catch(err => {
                console.error('Login error:', err);
                if (err.code === 'ERR_NETWORK') {
                    setErrorMessage('Cannot connect to server. Please check if the server is running.');
                } else if (err.response && err.response.data && err.response.data.message) {
                    setErrorMessage(err.response.data.message);
                } else {
                    setErrorMessage('Login failed. Please try again later.');
                }
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-6 text-center">Login</h2>
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
                    <label htmlFor="password" className="block text-left mb-2">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                    />
                    <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700">Login</button>
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

export default Login;
