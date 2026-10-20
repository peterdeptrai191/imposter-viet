import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/baloo-2/800.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./style.css";
import "./bella.css";
class Boundary extends React.Component<
  React.PropsWithChildren,
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="page narrow">
        <h1>App cần tải lại</h1>
        <p>Tiến trình đã lưu được giữ trên trình duyệt này.</p>
        <button className="btn primary" onClick={() => location.reload()}>
          Tải lại ứng dụng
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
