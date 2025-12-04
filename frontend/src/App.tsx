import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { useAutoRefreshToken } from './hooks/useAutoRefreshToken';

function App() {
  useAutoRefreshToken();

  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
  );
}

export default App;


