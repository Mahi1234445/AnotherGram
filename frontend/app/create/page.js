'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePost() {
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('image', image);
        formData.append('caption', caption);

        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:8000/api/posts/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Failed to create post');
            }

            router.push('/');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ marginTop: '40px' }}>
            <div className="card" style={{ padding: '20px', width: '100%', maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '20px' }}>Create New Post</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Upload Image or Video</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => setImage(e.target.files[0])}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <textarea
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="input-field"
                            rows="4"
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Sharing...' : 'Share'}
                    </button>
                </form>
            </div>
        </div>
    );
}
