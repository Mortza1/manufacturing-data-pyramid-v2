import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_1.png";
import img_2 from "./assets/images/image_2.png";
const Slide1: React.FC = () => {
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
  return <div id="slide-1" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-1" style={{
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
    }}><img key={0} src={img_1} alt="Pyramid Paradigm for Manufacturing Systems" style={{
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1280px",
        height: "719.62px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={1} src={img_2} alt="Generated image 1" style={{
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1279.32px",
        height: "720px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={2} style={{
        position: "absolute",
        left: "82.6px",
        top: "427.54px",
        width: "459.91px",
        height: "136.37px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.8",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"Olga Bylya"}</span></p><p style={{
          lineHeight: "1.8",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"Abhilash Puthanveettil Madathil"}</span></p><p style={{
          lineHeight: "1.8",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"Aleksey "}</span><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"Reshetov"}</span></p></div></div></div>;
};
export default Slide1;
