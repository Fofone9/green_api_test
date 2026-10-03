import { AuthModule, useAuthorization } from "./modules/auth";
import { ChatModule } from "./modules/chat";

function App() {
  const { state, storageError, connect, clearError, disconnect } =
    useAuthorization();
  return state.status === "connected" ? (
    <ChatModule
      key={state.credentials.idInstance}
      credentials={state.credentials}
      authStorageError={storageError}
      onDisconnect={disconnect}
    />
  ) : (
    <AuthModule
      isLoading={state.status === "loading"}
      error={state.status === "error" ? state.message : ""}
      onConnect={connect}
      onEdit={clearError}
    />
  );
}

export default App;
