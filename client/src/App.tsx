import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CloudLayout } from "./components/CloudLayout";
import { AlertsPage, DashboardPage, DetectionPage, MlopsPage, ModelPage, MonitoringPage, NetworkPage, SettingsPage } from "./pages/Pages";

function Router() {
  return <Switch>
    <Route path="/" component={DashboardPage} />
    <Route path="/detection" component={DetectionPage} />
    <Route path="/alerts" component={AlertsPage} />
    <Route path="/network" component={NetworkPage} />
    <Route path="/model" component={ModelPage} />
    <Route path="/mlops" component={MlopsPage} />
    <Route path="/monitoring" component={MonitoringPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route><DashboardPage /></Route>
  </Switch>;
}

export default function App() {
  const refresh = () => window.dispatchEvent(new Event("cb-refresh"));
  return <ErrorBoundary>
    <TooltipProvider>
      <Toaster theme="dark" position="bottom-right" />
      <CloudLayout onRefresh={refresh}>
        <Router />
      </CloudLayout>
    </TooltipProvider>
  </ErrorBoundary>;
}
