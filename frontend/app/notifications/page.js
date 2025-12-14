'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        Promise.all([
            fetch('http://localhost:8000/api/notifications/', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:8000/api/users/requests/', { headers: { 'Authorization': `Bearer ${token}` } })
        ])
            .then(async ([notifRes, reqRes]) => {
                const notifData = await notifRes.json();
                const reqData = await reqRes.json();
                setNotifications(notifData);
                setRequests(reqData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleRequest = async (username, action) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/users/${username}/${action}_request/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }) // Backend expects username in body or URL? 
            // My backend implementation used request.data.get('username') or URL lookup. 
            // The view uses `get_object` (from URL username) AND `request.data.get('username')` in different spots.
            // Let's rely on the URL param primarily: `api/users/<sender_username>/accept_request/`
            // Wait, in my view logic I wrote: @action(detail=True...). So URL is `users/<pk>/accept_request`.
            // UserViewSet lookup is 'username'. So URL is `users/<username>/accept_request`.
        });

        if (res.ok) {
            setRequests(prev => prev.filter(req => req.sender_username !== username));
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {requests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>Follow Requests</h3>
                    {requests.map(req => (
                        <div key={req.id} style={{ padding: '10px', borderBottom: '1px solid #dbdbdb', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '10px', background: '#ccc' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {req.sender_profile_picture && (
                                    <img src={req.sender_profile_picture} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Link href={`/profile/${req.sender_username}`} style={{ fontWeight: 'bold' }}>
                                    {req.sender_username}
                                </Link>
                                <span style={{ color: '#8e8e8e', marginLeft: '5px' }}>wants to follow you.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleRequest(req.sender_username, 'accept')} className="btn" style={{ padding: '6px 12px', fontSize: '13px' }}>Confirm</button>
                                <button onClick={() => handleRequest(req.sender_username, 'decline')} className="btn" style={{ padding: '6px 12px', fontSize: '13px', background: 'transparent', color: 'black', border: '1px solid #dbdbdb' }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2>Notifications</h2>
            <div style={{ marginTop: '20px' }}>
                {notifications.length === 0 ? (
                    <p>No notifications yet.</p>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} style={{ padding: '10px', borderBottom: '1px solid #dbdbdb', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '10px', background: '#ccc' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {notif.sender_profile_picture && (
                                    <img src={notif.sender_profile_picture} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Link href={`/profile/${notif.sender_username}`} style={{ fontWeight: 'bold', marginRight: '5px' }}>
                                    {notif.sender_username}
                                </Link>
                                {notif.type === 'follow' && 'started following you.'}
                                {notif.type === 'like' && 'liked your post.'}
                                {notif.type === 'comment' && `commented: "${notif.text}"`}
                                {notif.type === 'request' && 'requested to follow you.'}
                            </div>
                            {notif.post_image && (
                                <Link href={`/post/${notif.post}`} style={{ width: '40px', height: '40px', display: 'block' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {notif.post_image.match(/\.(mp4|webm|ogg)/i) ? (
                                        <video src={notif.post_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src={notif.post_image} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </Link>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
