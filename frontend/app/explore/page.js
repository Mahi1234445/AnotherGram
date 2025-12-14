'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Explore() {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const currentUsername = localStorage.getItem('username');

        fetch('http://localhost:8000/api/users/', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(data => {
                let userList = [];
                if (Array.isArray(data)) userList = data;
                else if (data.results) userList = data.results;

                setUsers(userList.filter(u => u.username !== currentUsername));
            });

        fetch('http://localhost:8000/api/posts/', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPosts(data);
                else if (data.results) setPosts(data.results);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    return (
        <div className="container">
            <h2 style={{ marginBottom: '20px' }}>Discover People</h2>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '40px' }}>
                {users.map(user => (
                    <div key={user.id} className="card" style={{ minWidth: '150px', padding: '15px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dbdbdb', margin: '0 auto 10px', overflow: 'hidden', position: 'relative' }}>
                            {user.profile_picture && (
                                <img
                                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt="profile"
                                />
                            )}
                        </div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{user.username}</div>
                        <Link href={`/profile/${user.username}`} className="btn" style={{ fontSize: '12px', display: 'block' }}>
                            View Profile
                        </Link>
                    </div>
                ))}
            </div>

            <h2 style={{ marginBottom: '20px' }}>Explore Posts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ position: 'relative', aspectRatio: '1/1', background: '#efefef' }}>
                        <Link href={`/post/${post.id}`}>
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
        </div>
    );
}
