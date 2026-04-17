import { Welcome } from "./welcome.js";

export const Home = () => {
  return (
    <div>
      <h1 data-testid="smoke-verify-marker">Kindling Smoke Verify OK</h1>
      <Welcome />
    </div>
  );
};
