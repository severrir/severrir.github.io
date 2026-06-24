import { Component } from "react";

// If anything inside the 3D scene throws (WebGL init failure, a bad frame,
// driver hiccup), this keeps the rest of the page alive instead of letting
// React unmount the whole tree into a white screen. The fallback is a calm
// deep-space backdrop so the overlaid hero/About/Contact content stays usable.
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // surface it once for debugging; do not loop
    console.error("[scene] render error, falling back to static backdrop:", error);
  }

  render() {
    if (this.state.failed) {
      return <div className="scene-fallback" aria-hidden="true" />;
    }
    return this.props.children;
  }
}
