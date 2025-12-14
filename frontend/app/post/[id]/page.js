'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Post from '../../components/Post';

export default function PostDetail({ params }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const postRefs = useRef({});
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // 1. Fetch the specific post to get context (like Username)
        fetch(`http://localhost:8000/api/posts/${id}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Post not found');
                return res.json();
            })
            .then(targetPost => {
                // 2. Fetch all posts by this user
                return fetch(`http://localhost:8000/api/posts/?username=${targetPost.username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(res => res.json())
                    .then(allPosts => {
                        const postsArray = Array.isArray(allPosts) ? allPosts : allPosts.results;
                        setPosts(postsArray);
                        setLoading(false);
                    });
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id, router]);

    useEffect(() => {
        // Scroll to the specific post once posts are loaded
        if (!loading && posts.length > 0 && postRefs.current[id]) {
            postRefs.current[id].scrollIntoView({ block: 'start' });
        }
    }, [loading, posts, id]);

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    return (
        <div className="flex-center" style={{ paddingTop: '20px', paddingBottom: '50px', flexDirection: 'column' }}>
            <div style={{ width: '100%', maxWidth: '470px' }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', fontSize: '16px', marginBottom: '15px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    &larr; Back
                </button>
                {posts.map(post => (
                    <div key={post.id} ref={el => postRefs.current[post.id] = el} style={{ marginBottom: '20px' }}>
                        <Post post={post} />
                    </div>
                ))}
            </div>
        </div>
    );
}
