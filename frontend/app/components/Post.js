'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Post({ post }) {
    const [liked, setLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    const toggleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const action = liked ? 'unlike' : 'like';
        const originalLiked = liked;
        const originalCount = likesCount;

        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);

        try {
            const res = await fetch(`http://localhost:8000/api/posts/${post.id}/${action}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error();
        } catch {
            setLiked(originalLiked);
            setLikesCount(originalCount);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !commentText.trim()) return;

        try {
            const res = await fetch(`http://localhost:8000/api/posts/${post.id}/comment/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: commentText })
            });
            if (res.ok) {
                setCommentText('');
                if (showComments) fetchComments();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchComments = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/posts/${post.id}/comments/`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setComments(data);
            } else if (data.results) {
                setComments(data.results);
            } else {
                setComments([]);
            }
        }
    };

    const isVideo = (url) => {
        return url && url.match(/\.(mp4|webm|ogg)/i);
    };

    return (
        <div className="card">
            <div style={{ padding: '14px', alignItems: 'center', display: 'flex' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbdbdb', marginRight: '10px', overflow: 'hidden' }}>
                </div>
                <Link href={`/profile/${post.username}`} style={{ fontWeight: 'bold' }}>{post.username}</Link>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                {isVideo(post.image) ? (
                    <video
                        src={post.image.startsWith('http') ? post.image : `http://localhost:8000${post.image}`}
                        controls
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                ) : (
                    <img
                        src={post.image.startsWith('http') ? post.image : `http://localhost:8000${post.image}`}
                        alt="Post"
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                )}
            </div>

            <div style={{ padding: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                    <button onClick={toggleLike} style={{ background: 'none', border: 'none', fontSize: '24px', marginRight: '16px', color: 'var(--foreground)' }}>
                        {liked ? '❤️' : '♡'}
                    </button>
                    <button onClick={() => { setShowComments(!showComments); if (!showComments) fetchComments(); }} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--foreground)' }}>
                        💬
                    </button>
                </div>

                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {likesCount} likes
                </div>

                <div>
                    <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{post.username}</span>
                    {post.caption}
                </div>

                <div style={{ color: '#8e8e8e', fontSize: '12px', marginTop: '8px', textTransform: 'uppercase' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                </div>

                {showComments && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        {Array.isArray(comments) && comments.map(c => (
                            <div key={c.id} style={{ marginBottom: '4px' }}>
                                <b>{c.username}</b> {c.text}
                            </div>
                        ))}

                        <form onSubmit={handleComment} style={{ display: 'flex', marginTop: '10px' }}>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                style={{ border: 'none', flexGrow: 1, outline: 'none', background: 'transparent', color: 'var(--foreground)' }}
                            />
                            <button type="submit" style={{ color: 'var(--primary)', border: 'none', background: 'none', fontWeight: 'bold' }}>Post</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
