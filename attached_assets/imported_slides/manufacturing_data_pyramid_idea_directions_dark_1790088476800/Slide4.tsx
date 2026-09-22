import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_6.png";
import img_2 from "./assets/images/image_7.png";
const Slide4: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    s: 1,
    x: 0,
    y: 0
  });
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / 1280, h / 720);
      setLayout({
        s,
        x: (w - 1280 * s) / 2,
        y: (h - 720 * s) / 2
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div id="slide-4" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-4" style={{
      position: "absolute",
      width: "1280px",
      height: "720px",
      overflow: "hidden",
      transformOrigin: "top left",
      color: "#000000",
      backgroundColor: "#ffffff",
      transform: `scale(${layout.s})`,
      left: layout.x + "px",
      top: layout.y + "px"
    }}><img key={0} src={img_1} alt="Picture 1" style={{
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1279.32px",
        height: "720px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={1} src={img_2} alt="Picture 3" style={{
        position: "absolute",
        left: "0.34px",
        top: "0px",
        width: "1279.32px",
        height: "720px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide4;
