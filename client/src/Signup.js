import axios from 'axios';
import React, { useState } from 'react';

const Signup = ({ setToken, setUsername }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/register', formData);
            // Assuming your API returns the token upon successful registration
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUsername(formData.username);
        } catch (error) {
            console.log('Error registering', error);
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
                Email:
                <input type="email" name="email" onChange={handleChange} />
            </label>
            <label>
                Password:
                <input type="password" name="password" onChange={handleChange} />
            </label>
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default Signup;
