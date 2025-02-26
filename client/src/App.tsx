import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import { ConnectionStatus } from "@/components/connection-status";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/chat/:uuid" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ConnectionStatus />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;