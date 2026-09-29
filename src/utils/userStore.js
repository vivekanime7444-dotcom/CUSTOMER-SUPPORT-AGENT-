// Centralized User Management Store for Customer Accounts & Administrator Roles

export const DEFAULT_USERS = [
  {
    id: 'CUST-1',
    name: 'Alex Morgan',
    email: 'customer@vmart.com',
    password: 'password123',
    role: 'user',
    status: 'active', // 'active' or 'suspended'
    phone: '+1 (555) 234-5678',
    joinedDate: '2026-08-15',
    lastLogin: '2026-09-29'
  },
  {
    id: 'CUST-2',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    phone: '+1 (555) 876-5432',
    joinedDate: '2026-09-02',
    lastLogin: '2026-09-28'
  },
  {
    id: 'CUST-3',
    name: 'David Chen',
    email: 'david.chen@techmail.io',
    password: 'password123',
    role: 'user',
    status: 'active',
    phone: '+1 (555) 456-7890',
    joinedDate: '2026-09-12',
    lastLogin: '2026-09-25'
  },
  {
    id: 'ADMIN-1',
    name: 'Chief Administrator',
    email: 'admin@vmart.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    phone: '+1 (555) 000-1111',
    joinedDate: '2026-01-01',
    lastLogin: '2026-09-29'
  }
];

export const getUsers = () => {
  try {
    const saved = localStorage.getItem('vmart_registered_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading users:", e);
  }
  return DEFAULT_USERS;
};

export const saveUsers = (users) => {
  try {
    localStorage.setItem('vmart_registered_users', JSON.stringify(users));
    window.dispatchEvent(new Event('vmart_users_updated'));
  } catch (e) {
    console.error("Error saving users:", e);
  }
};

export const addUser = (userData) => {
  const users = getUsers();
  const isCust = userData.role === 'user';
  const prefix = isCust ? 'CUST' : 'ADMIN';
  const nextNum = users.filter(u => u.role === userData.role).length + 1;
  const newId = `${prefix}-${nextNum}-${Math.floor(100 + Math.random() * 900)}`;

  const newUser = {
    id: newId,
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    password: userData.password || 'password123',
    role: userData.role || 'user',
    status: userData.status || 'active',
    phone: userData.phone || 'N/A',
    joinedDate: new Date().toLocaleDateString(),
    lastLogin: 'Never'
  };

  const updated = [newUser, ...users];
  saveUsers(updated);
  return newUser;
};

export const updateUser = (userId, updates) => {
  const users = getUsers();
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  saveUsers(updated);
  return updated.find(u => u.id === userId);
};

export const deleteUser = (userId) => {
  const users = getUsers();
  const updated = users.filter(u => u.id !== userId);
  saveUsers(updated);
  return updated;
};

export const toggleUserStatus = (userId) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const newStatus = user.status === 'active' ? 'suspended' : 'active';
  return updateUser(userId, { status: newStatus });
};

export const resetUserPassword = (userId, newPassword) => {
  return updateUser(userId, { password: newPassword });
};
