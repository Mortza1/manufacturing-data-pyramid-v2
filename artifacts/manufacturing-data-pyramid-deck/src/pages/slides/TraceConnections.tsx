export default function TraceConnections() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(217,242,220,0.32) 1px, transparent 1px)', backgroundSize: '3vw 3vw' }} />
      <div className="absolute left-0 top-0 h-full w-[43%] bg-[#0d211d]" />
      <div className="relative flex h-full">
        <div className="flex w-[43%] flex-col px-[7vw] py-[8vh]">
          <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">05 / 08</p>
          <h2 className="mt-[2.5vh] max-w-[34vw] font-display text-[4.2vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
            Trace connections as ordered loops
          </h2>
          <div className="mt-[8vh] space-y-[3vh]">
            <div className="flex items-start gap-[1.4vw]">
              <span className="mt-[0.55vh] h-[1.05vw] w-[1.05vw] bg-[#f3be63]" />
              <p className="font-body text-[2vw] leading-[1.12] text-[#d8e9df]">Organize connections into named loops</p>
            </div>
            <div className="flex items-start gap-[1.4vw]">
              <span className="mt-[0.55vh] h-[1.05vw] w-[1.05vw] bg-[#f3be63]" />
              <p className="font-body text-[2vw] leading-[1.12] text-[#d8e9df]">Give each segment an explicit sequence</p>
            </div>
            <div className="flex items-start gap-[1.4vw]">
              <span className="mt-[0.55vh] h-[1.05vw] w-[1.05vw] bg-[#f3be63]" />
              <p className="font-body text-[2vw] leading-[1.12] text-[#d8e9df]">Inspect the spatial model in 3D</p>
            </div>
            <div className="flex items-start gap-[1.4vw]">
              <span className="mt-[0.55vh] h-[1.05vw] w-[1.05vw] bg-[#f3be63]" />
              <p className="font-body text-[2vw] leading-[1.12] text-[#d8e9df]">Use the 2D Cross-Section for an alternate view</p>
            </div>
          </div>
        </div>
        <div className="relative flex w-[57%] items-center justify-center">
          <div className="absolute left-[8vw] top-[18vh] h-[0.2vw] w-[31vw] rotate-[18deg] bg-[#d9f2dc]/65" />
          <div className="absolute left-[12vw] top-[31vh] h-[0.2vw] w-[28vw] rotate-[-20deg] bg-[#f3be63]/75" />
          <div className="absolute left-[19vw] top-[45vh] h-[0.2vw] w-[25vw] rotate-[12deg] bg-[#d9f2dc]/45" />
          <div className="absolute left-[10vw] top-[56vh] h-[0.2vw] w-[29vw] rotate-[-14deg] bg-[#f3be63]/55" />
          <div className="absolute left-[13vw] top-[11vh] h-[46vh] w-[22vw] rounded-[50%] border-[0.22vw] border-[#d9f2dc]/55 rotate-[18deg]" />
          <div className="absolute left-[18vw] top-[17vh] h-[35vh] w-[18vw] rounded-[50%] border-[0.22vw] border-[#f3be63]/65 rotate-[-24deg]" />
          <div className="absolute left-[23vw] top-[31vh] h-[20vh] w-[10vw] rounded-[50%] border-[0.22vw] border-[#d9f2dc]/40 rotate-[22deg]" />
          <div className="absolute left-[10.8vw] top-[24vh] h-[1.3vw] w-[1.3vw] rounded-full bg-[#f3be63]" />
          <div className="absolute left-[39vw] top-[26vh] h-[1.3vw] w-[1.3vw] rounded-full bg-[#d9f2dc]" />
          <div className="absolute left-[22vw] top-[51vh] h-[1.3vw] w-[1.3vw] rounded-full bg-[#f3be63]" />
          <div className="absolute left-[41vw] top-[54vh] h-[1.3vw] w-[1.3vw] rounded-full bg-[#d9f2dc]" />
        </div>
      </div>
    </div>
  );
}