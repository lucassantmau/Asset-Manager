import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/home";
import LawyerSignup from "@/pages/lawyer/signup";
import LawyerSignin from "@/pages/lawyer/signin";
import BlogList from "@/pages/blog/index";
import BlogPost from "@/pages/blog/post";
import ClientArea from "@/pages/client-area";
import LoginPage from "@/pages/login";
import CadastroPage from "@/pages/cadastro";
import AreaClientePage from "@/pages/area-cliente";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/area-cliente" component={AreaClientePage} />
      <Route path="/advogado/signup" component={LawyerSignup} />
      <Route path="/advogado/signin" component={LawyerSignin} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/area-do-cliente" component={ClientArea} />
      <Route path="/termos" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
