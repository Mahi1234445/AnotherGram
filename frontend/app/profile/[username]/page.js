'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTheme } from '../../components/ThemeProvider';

function UserListModal({ title, users, onClose }) {
    if (!users) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--card)', width: '400px', maxHeight: '400px',
                borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                color: 'var(--foreground)'
            }}>
                <div style={{
                    padding: '10px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'center', position: 'relative', fontWeight: 'bold'
                }}>
                    {title}
                    <button onClick={onClose} style={{
                        position: 'absolute', right: '10px', top: '10px',
                        background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer',
                        color: 'inherit'
                    }}>
                        &times;
                    </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {users.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#8e8e8e' }}>No users found.</div>
                    ) : (
                        users.map(u => (
                            <div key={u.username} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbdbdb', marginRight: '12px', overflow: 'hidden' }}>
                                    {u.profile_picture && <img src={u.profile_picture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div>
                                    <Link href={`/profile/${u.username}`} onClick={onClose} style={{ fontWeight: 'bold', display: 'block' }}>
                                        {u.username}
                                    </Link>
                                    <div style={{ color: '#8e8e8e', fontSize: '14px' }}>{u.first_name} {u.last_name}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SettingsModal({ isPrivate, onTogglePrivacy, onClose, onDeleteAccount }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.65)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card)', borderRadius: '12px', width: '300px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                color: 'var(--foreground)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ borderBottom: '1px solid var(--border)' }}>
                    <button style={{
                        width: '100%', padding: '14px', background: 'transparent', border: 'none',
                        fontSize: '14px', cursor: 'pointer', textAlign: 'center', color: 'inherit'
                    }} onClick={() => { onTogglePrivacy(); onClose(); }}>
                        {isPrivate ? 'Switch to Public' : 'Switch to Private'}
                    </button>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }}>
                    <button style={{
                        width: '100%', padding: '14px', background: 'transparent', border: 'none',
                        fontSize: '14px', cursor: 'pointer', textAlign: 'center', color: 'inherit'
                    }} onClick={() => { toggleTheme(); onClose(); }}>
                        Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                    </button>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }}>
                    <Link href="/notifications" style={{
                        display: 'block', width: '100%', padding: '14px', background: 'transparent',
                        textDecoration: 'none', color: 'inherit',
                        fontSize: '14px', cursor: 'pointer', textAlign: 'center'
                    }}>
                        Follow Requests
                    </Link>
                </div>
                <div>
                    <button style={{
                        width: '100%', padding: '14px', background: 'transparent', border: 'none',
                        fontSize: '14px', cursor: 'pointer', textAlign: 'center', color: 'inherit'
                    }} onClick={onClose}>
                        Cancel
                    </button>
                </div>
                <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button style={{
                        width: '100%', padding: '14px', background: 'transparent', border: 'none',
                        fontSize: '14px', cursor: 'pointer', textAlign: 'center', color: 'red', fontWeight: 'bold'
                    }} onClick={onDeleteAccount}>
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Profile({ params }) {
    const { username } = use(params);

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);
    const [currentUser, setCurrentUser] = useState('');
    const [isOwner, setIsOwner] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('username');
        setCurrentUser(user);
        setIsOwner(user === username);

        fetch(`http://localhost:8000/api/users/${username}/`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setIsFollowing(data.is_following);
                setHasRequested(data.has_requested);
            });

        fetch(`http://localhost:8000/api/posts/?username=${username}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.results;
                setPosts(list || []);
            });

    }, [username]);

    const handleFollow = async () => {
        const token = localStorage.getItem('token');
        let action = isFollowing || hasRequested ? 'unfollow' : 'follow';

        const res = await fetch(`http://localhost:8000/api/users/${username}/${action}/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            if (data.status === 'followed') {
                setIsFollowing(true);
                setHasRequested(false);
                setProfile(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
            } else if (data.status === 'unfollowed') {
                if (isFollowing) setProfile(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
                setIsFollowing(false);
                setHasRequested(false);
            } else if (data.status === 'requested') {
                setHasRequested(true);
                setIsFollowing(false);
            }
        }
    };

    const togglePrivacy = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/users/toggle_privacy/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            setProfile(prev => ({ ...prev, is_private: data.is_private }));
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:8000/api/users/${username}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.clear();
                window.location.href = '/signup';
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Connection error.');
        }
    };

    const openFollowers = async () => {
        if (!currentUser) return;
        if (!isOwner && profile.is_private && !isFollowing) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/users/${username}/followers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setModalTitle('Followers');
        setModalUsers(data);
        setShowModal(true);
    };

    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const res = await fetch(`http://localhost:8000/api/users/${username}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(prev => ({ ...prev, profile_picture: data.profile_picture }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openFollowing = async () => {
        if (!currentUser) return;
        if (!isOwner && profile.is_private && !isFollowing) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/users/${username}/following/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setModalTitle('Following');
        setModalUsers(data);
        setShowModal(true);
    };

    if (!profile) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    const showPosts = isOwner || !profile.is_private || isFollowing;

    return (
        <div style={{ maxWidth: '935px', margin: '0 auto', padding: '30px 20px' }}>
            {showModal && <UserListModal title={modalTitle} users={modalUsers} onClose={() => setShowModal(false)} />}
            {showSettings && (
                <SettingsModal
                    isPrivate={profile.is_private}
                    onTogglePrivacy={togglePrivacy}
                    onClose={() => setShowSettings(false)}
                    onDeleteAccount={handleDeleteAccount}
                />
            )}

            <div style={{ display: 'flex', marginBottom: '44px', alignItems: 'center' }}>
                <div style={{ marginRight: '30px' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#dbdbdb', overflow: 'hidden', position: 'relative' }}>
                        {profile.profile_picture ? (
                            <img
                                src={profile.profile_picture.startsWith('http') ? profile.profile_picture : `http://localhost:8000${profile.profile_picture}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt="profile"
                            />
                        ) : null}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '300', marginRight: '20px' }}>{profile.username}</h2>
                        {isOwner ? (
                            <>
                                <button className="btn" onClick={() => document.getElementById('profilePicInput').click()} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', marginRight: '10px' }}>
                                    Edit Profile
                                </button>
                                <input id="profilePicInput" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleProfilePicChange} />
                                <button className="btn" onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                                    Settings
                                </button>
                            </>
                        ) : (
                            <button className="btn" onClick={handleFollow}>
                                {isFollowing ? 'Unfollow' : hasRequested ? 'Requested' : 'Follow'}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '40px', fontSize: '16px' }}>
                        <span><b>{posts.length}</b> posts</span>
                        <span onClick={openFollowers} style={{ cursor: 'pointer' }}><b>{profile.followers_count}</b> followers</span>
                        <span onClick={openFollowing} style={{ cursor: 'pointer' }}><b>{profile.following_count}</b> following</span>
                    </div>

                    <div style={{ marginTop: '20px', fontWeight: '600' }}>
                        {profile.first_name} {profile.last_name}
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                {showPosts ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
                        {posts.map(post => (
                            <div key={post.id} style={{ position: 'relative', aspectRatio: '1/1', background: '#efefef' }}>
                                <Link href={`/post/${post.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                    {post.image.match(/\.(mp4|webm|ogg)/i) ? (
                                        <video
                                            src={post.image.startsWith('http') ? post.image : `http://localhost:8000${post.image}`}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={post.image.startsWith('http') ? post.image : `http://localhost:8000${post.image}`}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            alt="post"
                                        />
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>This Account is Private</div>
                        <div style={{ color: '#8e8e8e' }}>Follow to see their photos and videos.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
