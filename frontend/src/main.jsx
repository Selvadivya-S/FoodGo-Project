import React from "react";
import ReactDOM from "react-dom/client";
import {
  AuthProvider,
} from "./context/AuthContext";
import {
  BrowserRouter,
} from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import "./styles/App.css";
class FoodGoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("FoodGo frontend runtime error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{minHeight:"100vh",padding:"40px",fontFamily:"Arial,sans-serif",background:"#f8f9fb"}}>
          <div style={{maxWidth:"760px",margin:"60px auto",padding:"32px",background:"#fff",borderRadius:"20px",boxShadow:"0 10px 40px rgba(0,0,0,.08)"}}>
            <h1 style={{marginTop:0}}>FoodGo could not render this page</h1>
            <p style={{color:"#666"}}>The frontend encountered a runtime error. The details below can be used to fix it.</p>
            <pre style={{whiteSpace:"pre-wrap",background:"#f4f4f4",padding:"16px",borderRadius:"12px",overflow:"auto"}}>{this.state.error?.stack || this.state.error?.message}</pre>
            <button onClick={() => window.location.reload()} style={{padding:"12px 18px",border:0,borderRadius:"10px",background:"#ff5a1f",color:"#fff",cursor:"pointer"}}>Reload FoodGo</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
const rootElement =
  document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "Root element #root was not found."
  );
}
ReactDOM.createRoot(rootElement).render(
  <FoodGoErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </FoodGoErrorBoundary>
);
