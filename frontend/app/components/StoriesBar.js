'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function StoriesBar() {
    const [stories, setStories] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const user = localStorage.getItem('username');
        setCurrentUser(user);
        fetchStories();
    }, []);

    const fetchStories = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:8000/api/stories/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStories(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('http://localhost:8000/api/stories/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                fetchStories();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const groupedStories = stories.reduce((acc, story) => {
        if (!acc[story.username]) {
            acc[story.username] = [];
        }
        acc[story.username].push(story);
        return acc;
    }, {});

    const userStories = Object.entries(groupedStories).map(([username, userStories]) => ({
        username,
        profile_picture: userStories[0].user_profile_picture,
        stories: userStories
    }));

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px',
            marginBottom: '24px', padding: '16px', overflowX: 'auto', display: 'flex', gap: '16px'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '64px' }}>
                <div onClick={handleUploadClick} style={{
                    width: '64px', height: '64px', borderRadius: '50%', background: 'var(--secondary)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '4px',
                    border: '2px solid transparent', position: 'relative'
                }}>
                    <span style={{ fontSize: '24px', color: 'var(--primary)' }}>+</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>Your Story</div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,video/*" />
            </div>

            {userStories.map(u => (
                <div key={u.username} onClick={() => setSelectedStory(u)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '64px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', padding: '2px',
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '4px'
                    }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--card)', padding: '2px', overflow: 'hidden' }}>
                            {u.profile_picture ? (
                                <img src={u.profile_picture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#dbdbdb', borderRadius: '50%' }}></div>
                            )}
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>{u.username}</div>
                </div>
            ))}

            {selectedStory && (
                <StoryViewer
                    userStory={selectedStory}
                    currentUser={currentUser}
                    onClose={() => setSelectedStory(null)}
                    onDeleteSuccess={() => { setSelectedStory(null); fetchStories(); }}
                />
            )}
        </div>
    );
}

function StoryViewer({ userStory, currentUser, onClose, onDeleteSuccess }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const story = userStory.stories[currentIndex];

    if (!story) {
        onClose();
        return null;
    }

    const next = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex < userStory.stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const prev = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this story?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:8000/api/stories/${story.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onDeleteSuccess();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isOwner = currentUser === userStory.username;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#1a1a1a', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onClose}>
            <div style={{ position: 'relative', height: '80vh', aspectRatio: '9/16', background: 'black' }} onClick={e => e.stopPropagation()}>
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
                    {userStory.stories.map((s, idx) => (
                        <div key={`${s.id}-${idx}`} style={{ flex: 1, height: '2px', background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)' }}></div>
                    ))}
                </div>

                {story.image.match(/\.(mp4|webm|ogg)/i) ? (
                    <video src={story.image} autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <img src={story.image} alt="story" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}

                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 5 }} onClick={prev}></div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', zIndex: 5 }} onClick={next}></div>

                <div style={{ position: 'absolute', top: '20px', left: '15px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.5)', zIndex: 10 }}>
                    {userStory.profile_picture && <img src={userStory.profile_picture} style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px' }} />}
                    {userStory.username}
                </div>

                {isOwner && (
                    <button
                        onClick={handleDelete}
                        style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid white', borderRadius: '4px', color: 'white', cursor: 'pointer', zIndex: 20, fontSize: '12px', padding: '4px 8px' }}
                    >
                        Delete
                    </button>
                )}
            </div>
            <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        </div>
    );
}
