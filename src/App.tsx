import { useState, useEffect } from "react";
import axios from "axios";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";
import "./App.css";

interface Live {
  id: string;
  meetingNumber: string;
  topic: string;
  agenda: string | null;
  finished: boolean;
  status: "ENABLED" | "DISABLED";
}

function App() {
  const client = ZoomMtgEmbedded.createClient();
  const authEndpoint = "http://localhost:8080/lives/?withDeleted=true";

  const [lives, setLives] = useState<Live[]>([]);
  const [inMeeting, setInMeeting] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Live | null>(null);

  useEffect(() => {
    fetchLives();
  }, []);

  const fetchLives = async () => {
    try {
      const res = await axios.get(authEndpoint, {
        headers: { "X-Platform-Id": "alfahibrid.io" },
      });
      setLives(res.data.data);
    } catch (err) {
      console.error("Erro ao buscar lives:", err);
    }
  };

  const joinLive = async (live: Live) => {
    if (live.status === "DISABLED" || live.finished) {
      alert("Essa live ainda não está disponível ou já terminou.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8080/lives/by?id=${live.id}&withDeleted=true&join=true`,
        { headers: { "X-Platform-Id": "alfahibrid.io" } }
      );

      const { meetingNumber, signature, password } = res.data.data;

      startMeeting({ meetingNumber, signature, password, userName: "Aluno" });
      setCurrentMeeting(live);
    } catch (err) {
      console.error("Erro ao entrar na live:", err);
    }
  };

  function startMeeting({
    meetingNumber,
    signature,
    password,
    userName,
  }: {
    meetingNumber: string;
    signature: string;
    password: string;
    userName: string;
  }) {
    const meetingSDKElement = document.getElementById("meetingSDKElement")!;

    client
      .init({
        zoomAppRoot: meetingSDKElement,
        language: "en-US",
      })
      .then(() =>
        client.join({
          signature,
          meetingNumber,
          password,
          userName,
        })
      )
      .then(() => {
        console.log("Entrou na reunião com sucesso 🚀");
        setInMeeting(true);
      })
      .catch((error: any) => {
        console.error("Erro ao entrar na reunião:", error);
      });
  }

  const leaveMeeting = async () => {
    try {
      await client.leaveMeeting(); // apenas sai da live
      setInMeeting(false);
      setCurrentMeeting(null);
      fetchLives(); // atualiza a lista de lives
      console.log("Você saiu da live 🚪");
    } catch (err) {
      console.error("Erro ao sair da live:", err);
    }
  };

  return (
    <div className="App" style={{ width: "80vw" }}>
      <main>
        <h1>Zoom Meeting SDK Sample React</h1>
        <h2>Área do Aluno</h2>

        {!inMeeting ? (
          <div className="live-buttons">
            {lives.map((live) => {
              let bgColor = "green"; // ENABLED
              if (live.finished) bgColor = "red";
              if (live.status === "DISABLED") bgColor = "gray";

              return (
                <button
                  key={live.id}
                  onClick={() => joinLive(live)}
                  style={{
                    margin: "5px",
                    padding: "10px 20px",
                    background: bgColor,
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor:
                      live.status === "DISABLED" || live.finished
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={live.status === "DISABLED" || live.finished}
                >
                  {live.topic} - {live.status}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <p>Você está participando da live: {currentMeeting?.topic}</p>
            <button
              onClick={leaveMeeting}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: "orange",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sair da Live
            </button>
          </>
        )}

        <div
          id="meetingSDKElement"
          style={{
            width: "auto",
            height: "60vh",
            margin: "20px auto",
            border: "2px solid #ccc",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        />
      </main>
    </div>
  );
}

export default App;
