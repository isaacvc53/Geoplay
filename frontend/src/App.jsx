import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import MenuPage from './pages/Menu/MenuPage';
import ModePage from './pages/Mode/ModePage';
import WorldQuizPage from './pages/WorldQuiz/WorldQuizPage';
import RegionCountriesPage from './pages/Regions/RegionCountriesPage';
import WorldMapPage from './pages/WorldMap/WorldMapPage';
import CountryGamePage from './pages/Country/CountryGamePage';
import ProfilePage from './pages/Profile/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<MenuPage />} />
          <Route path="/modo" element={<ModePage />} />
          <Route path="/paises-del-mundo" element={<WorldQuizPage />} />
          <Route path="/paises" element={<RegionCountriesPage />} />
          <Route path="/mapa-mundial" element={<WorldMapPage />} />
          <Route path="/pais" element={<CountryGamePage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
