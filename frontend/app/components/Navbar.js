'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [auth, setAuth] = useState(false);
    const [user, setUser] = useState('');
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (token) {
            setAuth(true);
            setUser(username || 'me');
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const submitSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/profile/${search}`);
            setSearch('');
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-content">
                <Link href="/" className="logo">
                    AnotherGram
                </Link>

                {auth && (
                    <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--secondary)', padding: '5px 12px', borderRadius: '20px' }}>
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--foreground)', width: '200px' }}
                        />
                    </form>
                )}

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {auth ? (
                        <>
                            <Link href="/">Feed</Link>
                            <Link href="/explore">Explore</Link>
                            <Link href="/create">Create</Link>
                            <Link href="/notifications">Notifications</Link>
                            <Link href={`/profile/${user}`}>Profile</Link>
                            <button onClick={logout} className="btn" style={{ background: 'transparent', color: 'var(--error)', border: '1px solid var(--border)' }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn">Login</Link>
                            <Link href="/signup" style={{ color: 'var(--primary)' }}>Signup</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
