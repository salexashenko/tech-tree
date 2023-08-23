import axios from 'axios';
import React, { useState } from 'react';

const Login = ({ setToken, setUsername }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', formData);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUsername(formData.username);
        } catch (error) {
            console.log('Error logging in', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Username:
                <input type="text" name="username" onChange={handleChange} />
            </label>
            <label>
                Password:
                <input type="password" name="password" onChange={handleChange} />
            </label>
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;
