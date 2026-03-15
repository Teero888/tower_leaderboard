import { useState, useEffect, useMemo } from 'react'
import './App.css'

interface Player {
  playerName: string;
  floorReached: number;
  rank?: number;
}

function App() {
  const [realPlayers, setRealPlayers] = useState<Player[]>([]);
  const [startTile, setStartTile] = useState(120.7);
  const [tileIncrement, setTileIncrement] = useState(17.998);
  const [boxOffset, setBoxOffset] = useState(23.0);
  const [lineWidth, setLineWidth] = useState(25.0);
  const [podiumOffset, setPodiumOffset] = useState(1.155);
  const [debug, setDebug] = useState(false);

  // Expose toggle to console
  useEffect(() => {
    (window as any).toggleDebug = () => setDebug((prev: boolean) => !prev);
    console.log("Dev Mode: Type 'toggleDebug()' to show alignment controls and test players.");
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}leaderboard.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRealPlayers(data);
      })
      .catch(err => console.error("Failed to load leaderboard:", err));
  }, []);

  // Compute final player list with optional test players
  const players = useMemo(() => {
    let combined = [...realPlayers];
    if (debug) {
      const testPlayers = Array.from({ length: 100 }, (_, i) => ({
        playerName: `test${i + 1}`,
        floorReached: i + 1
      }));
      combined = [...combined, ...testPlayers];
    }

    const sorted = combined.sort((a, b) => b.floorReached - a.floorReached);
    
    // Calculate ranks with ties
    let currentRank = 1;
    return sorted.map((player, index) => {
      if (index > 0 && player.floorReached < sorted[index - 1].floorReached) {
        currentRank = index + 1;
      }
      return { ...player, rank: currentRank };
    });
  }, [realPlayers, debug]);

  const topThree = players.slice(0, 3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree.length >= 2) podiumOrder.push({ ...topThree[1], displayRank: 2 });
  if (topThree.length >= 1) podiumOrder.push({ ...topThree[0], displayRank: 1 });
  if (topThree.length >= 3) podiumOrder.push({ ...topThree[2], displayRank: 3 });

  const getPlayerLink = (name: string) => `https://kog.tw/index.php#p=players&player=${encodeURIComponent(name)}`;

  // Group ALL players by floor for the map markers
  const playersByFloor = players.reduce((acc, player) => {
    const floor = player.floorReached;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(player);
    return acc;
  }, {} as Record<number, Player[]>);

  const sortedFloors = Array.from({ length: 100 }, (_, i) => 100 - i);

  const TOTAL_MAP_TILES = 2001;

  const calculateFloorTop = (floor: number) => {
    const tileHeight = startTile + (floor - 1) * tileIncrement;
    return ((TOTAL_MAP_TILES - tileHeight) / TOTAL_MAP_TILES) * 100;
  };

  return (
    <div className={`container ${debug ? 'debug-mode' : ''}`}>
      {debug && (
        <div className="controls-panel">
          <div className="control-group">
            <label>Start Tile: {startTile.toFixed(1)}</label>
            <input 
              type="range" min="0" max="500" step="0.1" 
              value={startTile} 
              onChange={(e) => setStartTile(Number(e.target.value))} 
            />
          </div>
          <div className="control-group">
            <label>Increment: {tileIncrement.toFixed(3)}</label>
            <input 
              type="range" min="10" max="30" step="0.001" 
              value={tileIncrement} 
              onChange={(e) => setTileIncrement(Number(e.target.value))} 
            />
          </div>
          <div className="control-group">
            <label>Box Offset: {boxOffset.toFixed(1)}</label>
            <input 
              type="range" min="0" max="100" step="0.1" 
              value={boxOffset} 
              onChange={(e) => setBoxOffset(Number(e.target.value))} 
            />
          </div>
          <div className="control-group">
            <label>Line Width: {lineWidth.toFixed(1)}</label>
            <input 
              type="range" min="0" max="50" step="0.1" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))} 
            />
          </div>
          <div className="control-group">
            <label>Podium Y: {podiumOffset.toFixed(3)}%</label>
            <input 
              type="range" min="0" max="10" step="0.001" 
              value={podiumOffset} 
              onChange={(e) => setPodiumOffset(Number(e.target.value))} 
            />
          </div>
          <div className="control-info">
            Debug Mode Active
          </div>
        </div>
      )}

      <div className="tower-section" style={{ 
        '--line-width': `${lineWidth}%`,
        '--podium-offset': `${podiumOffset}%`
      } as any}>
        <div className="background-overlay"></div>
        
        <header>
          <h1>Tower Event Leaderboard</h1>
        </header>

        <main className="podium-area">
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
        </main>

        <div className="tower-markers">
          {sortedFloors.map((floor) => {
            const isLeft = floor % 2 !== 0;
            return (
              <div 
                key={floor} 
                className={`floor-marker ${isLeft ? 'left' : 'right'}`}
                style={{ 
                  top: `${calculateFloorTop(floor)}%`,
                  left: isLeft ? `calc(50% - ${boxOffset}%)` : `calc(50% + ${boxOffset}%)`,
                  transform: `translate(${isLeft ? '-100%' : '0'}, -50%)`
                } as any}
              >
                <div className="floor-box">
                  <div className="floor-label">Floor {floor}</div>
                  <div className="floor-players">
                    {playersByFloor[floor] && playersByFloor[floor].map(player => (
                      <div key={player.playerName} className="floor-player">
                        <span className="player-rank">#{player.rank}</span>
                        <a href={getPlayerLink(player.playerName)} target="_blank" rel="noreferrer">
                          {player.playerName}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="discord-notice">
        <span>Missing or incorrect rank? Contact <strong>teero777</strong> on Discord</span>
      </div>
    </div>
  )
}

export default App
