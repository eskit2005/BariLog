import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthContext } from '../../context/AuthContext';
import { getBuildings, getDirectoryBuildings } from '../../services/api';

export const AppLayout = () => {
  const location = useLocation();
  const isDirectory = location.pathname === '/directory';
  const { user, logoutUser } = useContext(AuthContext);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  const refreshBuildings = useCallback(async (preferredId = null, signal = undefined) => {
    try {
      const list = await (isDirectory ? getDirectoryBuildings({signal}) : getBuildings());
      if (signal?.aborted) return;
      setBuildings(list);
      if (preferredId) {
        setSelectedBuildingId(preferredId);
      } else if (list.length > 0) {
        setSelectedBuildingId((prev) => {
          const exists = list.some((b) => b.id === Number(prev));
          if (exists) return prev;
          if (user?.role === 'MANAGER') {
            const managed = list.find((b) => b.managerId === user?.id);
            if (managed) return managed.id;
          }
          return list[0].id;
        });
      } else {
        setSelectedBuildingId(null);
      }
    } catch (err) {
      console.error('Failed to load buildings', err);
    }
  }, [isDirectory, user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    setBuildings([]);
    setSelectedBuildingId(null);
    refreshBuildings(null, controller.signal);
    return () => controller.abort();
  }, [refreshBuildings]);

  return (
    <div style={styles.container}>
      <Sidebar user={user} onLogout={logoutUser} />
      <div style={styles.mainWrapper}>
        <Header
          buildings={buildings}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={setSelectedBuildingId}
          user={user}
        />
        <main style={styles.content}>
          <Outlet
            context={{
              selectedBuildingId,
              setSelectedBuildingId,
              buildings,
              setBuildings,
              refreshBuildings,
              user,
            }}
          />
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-canvas)',
  },
  mainWrapper: {
    marginLeft: '240px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  content: {
    padding: '24px 28px',
    flex: 1,
  },
};

export default AppLayout;
