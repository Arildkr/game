// game/src/components/Home.jsx
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Klassespill</h1>
        <p>Interaktive spill for hele klassen</p>
      </header>

      <div className="home-buttons">
        <button
          className="btn btn-host"
          onClick={() => navigate('/host')}
        >
          <span className="btn-text">Jeg er lærer</span>
        </button>

        <button
          className="btn btn-join"
          onClick={() => navigate('/join')}
        >
          <span className="btn-text">Jeg er elev</span>
        </button>
      </div>

      <footer className="home-footer">
        <a href="https://www.ak-kreativ.no/aktiviteter" className="back-link">
          Tilbake til Aktiviteter
        </a>
      </footer>
    </div>
  );
}

export default Home;
