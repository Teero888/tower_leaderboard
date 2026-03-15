import { useState, useEffect } from 'react'
import './App.css'

interface Player {
  playerName: string;
  floorReached: number;
  rank?: number;
}

function App() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch('/leaderboard.json')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: Player, b: Player) => b.floorReached - a.floorReached);
        
        // Calculate ranks with ties
        let currentRank = 1;
        const ranked = sorted.map((player: Player, index: number) => {
          if (index > 0 && player.floorReached < sorted[index - 1].floorReached) {
            currentRank = index + 1;
          }
          return { ...player, rank: currentRank };
        });

        setPlayers(ranked);
      })
      .catch(err => console.error("Failed to load leaderboard:", err));
  }, []);

  const topThree = players.slice(0, 3);
  const rest = players.slice(3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], displayRank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], displayRank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], displayRank: 3 });

  const getPlayerLink = (name: string) => `https://kog.tw/index.php#p=players&player=${encodeURIComponent(name)}`;

  return (
    <div className="container">
      <div className="background-overlay"></div>
      
      <div className="discord-notice">
        <span>Missing or incorrect rank? Contact <strong>teero777</strong> on Discord</span>
      </div>

      <header>
        <h1>Tower Event Leaderboard</h1>
      </header>

      <main>
        {players.length > 0 && (
          <section className="podium-section">
            <div className="podium">
              {podiumOrder.map((player) => (
                <div key={player.playerName} className={`podium-item rank-${player.displayRank}`}>
                  <div className={`medal medal-${player.displayRank}`}>
                    <span className="medal-rank">{player.rank}</span>
                  </div>
                  <div className="podium-pillar">
                    <a href={getPlayerLink(player.playerName)} target="_blank" rel="noreferrer" className="player-name">
                      {player.playerName}
                    </a>
                    <div className="floor-count">Floor {player.floorReached}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="list-section">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Floor</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((player) => (
                <tr key={player.playerName}>
                  <td>{player.rank}</td>
                  <td>
                    <a href={getPlayerLink(player.playerName)} target="_blank" rel="noreferrer">
                      {player.playerName}
                    </a>
                  </td>
                  <td>{player.floorReached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

export default App
