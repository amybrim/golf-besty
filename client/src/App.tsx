import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Tournaments from "./pages/Tournaments";
import Players from "./pages/Players";
import Odds from "./pages/Odds";
import Showdown from "./pages/Showdown";
import MyGame from "./pages/MyGame";
import Feed from "./pages/Feed";
import Memory from "./pages/Memory";
import Trivia from "./pages/Trivia";
import FamilyDrops from "./pages/FamilyDrops";
import Layout from "./components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Chat} />
        <Route path="/showdown" component={Showdown} />
        <Route path="/feed" component={Feed} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/players" component={Players} />
        <Route path="/mygame" component={MyGame} />
        <Route path="/odds" component={Odds} />
        <Route path="/memory" component={Memory} />
        <Route path="/trivia" component={Trivia} />
        <Route path="/family" component={FamilyDrops} />
        {/* Legacy redirect */}
        <Route path="/picks" component={Showdown} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
