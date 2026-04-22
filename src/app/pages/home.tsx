export const Home = () => {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      background: "#fffbe6",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h1 data-testid="smoke-verify-marker" style={{ fontSize: "3rem", margin: 0 }}>
        KINDLING SMOKE VERIFY OK
      </h1>
      <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
        This page replaces the starter homepage. If you are a verify agent, this is your manual-verification target.
      </p>
    </main>
  );
};
