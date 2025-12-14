'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Post from './components/Post';
import StoriesBar from './components/StoriesBar';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('http://localhost:8000/api/posts/feed/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          router.push('/login');
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else if (data && data.results) {
          setPosts(data.results);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <div className="flex-center" style={{ flexDirection: 'column' }}>
      <div style={{ width: '100%', maxWidth: '470px' }}>
        <StoriesBar />
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p style={{ marginBottom: '20px' }}>Welcome to Instagram!</p>
            <p style={{ marginBottom: '20px' }}>Follow users to see photos in your feed.</p>
            <Link href="/explore" className="btn">Find People to Follow</Link>
          </div>
        ) : (
          posts.map(post => (
            <Post key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
