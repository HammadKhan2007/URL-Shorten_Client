import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
    const [longUrl, setLongUrl] = useState('');
    const [customAlias, setCustomAlias] = useState('');
    const [shortenedUrl, setShortenedUrl] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [error, setError] = useState('');
    const [allUrls, setAllUrls] = useState([]);
    const [loading, setLoading] = useState(false); // To show loading state

    // Backend API ka base URL
    const API_BASE_URL = 'https://urlshortenbackend-production.up.railway.app/api'; // Dhyan dein /api prefix par
    const REDIRECT_BASE_URL = 'https://urlshortenbackend-production.up.railway.app'; // Redirect URLs ke liye base

    // Component load hone par saare URLs fetch karein
    useEffect(() => {
        fetchUrls();
    }, []);

    const fetchUrls = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/urls`); // Backend route /api/urls
            setAllUrls(response.data);
        } catch (err) {
            console.error('Error fetching URLs:', err);
            setError('Failed to load recent links.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShortenedUrl(null);
        setQrCode(null);
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/shorten`, {
                longUrl,
                customAlias: customAlias || undefined, // Sirf tab bhejein jab custom alias ho
            });
            // Backend se aane wala data { longUrl, shortUrl, urlCode, date, clicks } hoga
            setShortenedUrl(response.data);
            setLongUrl('');
            setCustomAlias('');
            fetchUrls(); // Naya URL shorten hone ke baad list refresh karein
        } catch (err) {
            console.error('Error shortening URL:', err);
            // Error message backend se lein
            setError(err.response?.data?.error || 'Something went wrong while shortening the URL.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQrCode = async (url) => {
        setQrCode(null); // Clear previous QR
        try {
            const response = await axios.post(`${API_BASE_URL}/qrcode`, { shortUrl: url });
            setQrCode(response.data.qrCode);
        } catch (err) {
            console.error('Error generating QR code:', err);
            setError('Failed to generate QR code.');
        }
    };

    // `Visit URL` button ke liye
    const handleVisitUrl = (shortUrl) => {
        window.open(shortUrl, '_blank'); // Naye tab mein open karein
    };

    // `Copy` button ke liye
    const handleCopyUrl = (urlToCopy) => {
        navigator.clipboard.writeText(urlToCopy)
            .then(() => alert('URL copied to clipboard!'))
            .catch((err) => console.error('Failed to copy URL:', err));
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="logo">TINYURL</div>
                <nav className="nav">
                    <a href="#">Plans</a>
                    <a href="#">Features</a>
                    <a href="#">Domains</a>
                    <a href="#">Resources</a>
                </nav>
                <div className="auth-buttons">
                    <button className="login">Log In</button>
                    <button className="signup">Sign Up</button>
                </div>
            </header>

            <main className="main-content">
                <div className="left-panel">
                    <h1>URL Shortener, Branded Short Links & Analytics</h1>
                    <p>Welcome to the original link shortener — simplifying the Internet through the power of the URL since 2002.</p>
                    <p>You can use branded domains for fully custom links, track link analytics, and enjoy other powerful features with our paid plans.</p>
                    <div className="action-buttons">
                        <button className="view-plans">View Plans</button>
                        <button className="create-free-account">Create Free Account</button>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="tab-buttons">
                        <button className="tab active">Shorten a Link</button>
                        {/* <button className="tab">Generate QR Code</button> */}
                    </div>
                    <form onSubmit={handleSubmit} className="shorten-form">
                        <label htmlFor="destination-url">Destination URL *</label>
                        <input
                            id="destination-url"
                            type="text"
                            placeholder="Paste long URL here (e.g., https://example.com/very/long/url)"
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            required
                        />
                        <div className="domain-alias">
                            <label htmlFor="domain">Domain</label>
                            <select id="domain" disabled> {/* Abhi ke liye disabled, baad mein custom domain option add kar sakte hain */}
                                <option value="localhost:5000">localhost:5000</option>
                            </select>
                            <span className="slash">/</span>
                            <input
                                type="text"
                                placeholder="Add alias here (optional)"
                                value={customAlias}
                                onChange={(e) => setCustomAlias(e.target.value)}
                                minLength="5" // Frontend validation for custom alias
                            />
                        </div>
                        <p className="alias-note">Must be at least 5 characters if custom alias is used.</p>
                        <button type="submit" className="generate-qr-button" disabled={loading}>
                            {loading ? 'Shortening...' : 'Shorten Link'}
                        </button>
                        <p className="terms">By clicking Shorten Link, you agree with our Terms of Service, Privacy Policy, and Use of Cookies.</p>
                    </form>
                </div>
            </main>

            <section className="recent-links-section">
                <h2>Your Recent Links</h2>
                {allUrls.length === 0 ? (
                    <p>No links shortened yet. Try shortening one!</p>
                ) : (
                    <ul>
                        {allUrls.map((url) => (
                            <li key={url._id}>
                                <div className="link-info">
                                    <p className="original-link">Original: {url.longUrl}</p>
                                    <p className="short-link">
                                        Short: <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">{url.shortUrl}</a>
                                    </p>
                                    <p className="clicks-info">Clicks: {url.clicks}</p>
                                </div>
                                <div className="link-actions">
                                    <button className="action-button" onClick={() => handleVisitUrl(url.shortUrl)}>Visit URL</button>
                                    <button className="action-button" onClick={() => handleGenerateQrCode(url.shortUrl)}>QR</button>
                                    <button className="action-button">Share</button>
                                    <button className="action-button" onClick={() => handleCopyUrl(url.shortUrl)}>Copy</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Popup for shortened URL result */}
            {shortenedUrl && (
                <div className="result-popup">
                    <h3>Link Shortened!</h3>
                    <p>Original: {shortenedUrl.longUrl}</p>
                    <p>Short: <a href={shortenedUrl.shortUrl} target="_blank" rel="noopener noreferrer">{shortenedUrl.shortUrl}</a></p>
                    <button onClick={() => handleCopyUrl(shortenedUrl.shortUrl)}>Copy</button>
                    <button onClick={() => handleGenerateQrCode(shortenedUrl.shortUrl)}>Generate QR</button>
                    {qrCode && <img src={qrCode} alt="QR Code" style={{ maxWidth: '100px', marginTop: '10px' }} />}
                    <button onClick={() => { setShortenedUrl(null); setQrCode(null); }}>Close</button>
                </div>
            )}
            {/* Popup for error messages */}
            {error && <div className="error-popup">{error} <button onClick={() => setError('')}>Close</button></div>}
        </div>
    );
};

export default App;
