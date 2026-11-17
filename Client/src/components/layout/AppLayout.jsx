import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthContext } from '../../context/AuthContext';
import { getBuildings } from '../../services/api';

export const AppLayout = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  const refreshBuildings = useCallback(async (preferredId = null) => {
    try {
      const list = await getBuildings();
      setBuildings(list);
      if (preferredId) {
        setSelectedBuildingId(preferredId);
      } else if (list.length > 0) {
        setSelectedBuildingId((prev) => {
          const exists = list.some((b) => b.id === Number(prev));
          return exists ? prev : list[0].id;
        });
      } else {
        setSelectedBuildingId(null);
      }
    } catch (err) {
      console.error('Failed to load buildings', err);
    }
  }, []);

  useEffect(() => {
    refreshBuildings();
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
