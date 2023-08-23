import React, { useEffect, useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import TechTree from './TechTree';
const TokenContext = React.createContext();
const Home = () => {
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            // Decode the token
            const payload = JSON.parse(atob(storedToken.split('.')[1]));

            // Get the expiration date
            const exp = new Date(payload.exp * 1000); // Convert to milliseconds

            // Get the current date
            const now = new Date();

            if (now < exp) {
                // Token is still valid
                setToken(storedToken);
                setUsername(payload.username);
            } else {
                setToken(null);
            }
        }
    }, []);

    return (

        <div>
            <TokenContext.Provider value={token}>
                {token ? (
                    <h1>{username} logged in</h1>
                ) : (
                    <>
                        <Login setToken={setToken} setUsername={setUsername} />
                        <Signup setToken={setToken} setUsername={setUsername} />

                    </>
                )}
                <TechTree />
            </TokenContext.Provider>
        </div>
    );
};

export default Home;

export { TokenContext };
