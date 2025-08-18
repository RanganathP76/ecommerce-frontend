import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? (
        <div>
          <p>Welcome, <strong>{user.name}</strong></p>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Loading user info...</p>
      )}
    </div>
  );
}
