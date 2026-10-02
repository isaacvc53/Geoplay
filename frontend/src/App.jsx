import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import MenuPage from './pages/Menu/MenuPage';
import WorldQuizPage from './pages/WorldQuiz/WorldQuizPage';
import RegionCountriesPage from './pages/Regions/RegionCountriesPage';
import WorldMapPage from './pages/WorldMap/WorldMapPage';
import CountryGamePage from './pages/Country/CountryGamePage';
import ProfilePage from './pages/Profile/ProfilePage';
import ComparePage from './pages/Compare/ComparePage';
import MatchPage from './pages/Match/MatchPage';
import WorldRegionsPage from './pages/WorldRegions/WorldRegionsPage';
import WorldCountriesPage from './pages/WorldCountries/WorldCountriesPage';
import MultiplayerPage from './pages/Multiplayer/MultiplayerPage';
import MapsPage from './pages/Maps/MapsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<MenuPage />} />
          <Route path="/modo" element={<Navigate to="/mapas" replace />} />
          <Route path="/mapas" element={<MapsPage />} />
          <Route path="/multijugador" element={<MultiplayerPage />} />
          <Route path="/paises-del-mundo" element={<WorldQuizPage />} />
          <Route path="/paises" element={<RegionCountriesPage />} />
          <Route path="/mapa-mundial" element={<WorldMapPage />} />
          <Route path="/regiones-del-mundo" element={<WorldRegionsPage />} />
          <Route path="/mapa-de-paises" element={<WorldCountriesPage />} />
          <Route path="/pais" element={<CountryGamePage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/comparar" element={<ComparePage />} />
          <Route path="/partida/:id" element={<MatchPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
