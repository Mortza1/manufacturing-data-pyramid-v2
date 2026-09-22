export default function CurrentProductBehavior() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 49%, rgba(217,242,220,0.18) 49.2% 49.5%, transparent 49.7% 100%)', backgroundSize: '7vw 7vw' }} />
      <div className="absolute bottom-0 left-0 h-[2vh] w-full bg-[#f3be63]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[8vh]">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">08 / 08</p>
            <h2 className="mt-[2.5vh] max-w-[61vw] font-display text-[4.3vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
              Current product behavior
            </h2>
          </div>
          <div className="h-[8vw] w-[8vw] border border-[#d9f2dc]/45 p-[1vw]">
            <div className="h-full w-full border border-[#f3be63]/65" />
          </div>
        </div>
        <div className="mt-[10vh] grid flex-1 grid-cols-[1fr_1.1fr] gap-[7vw]">
          <div className="space-y-[4vh]">
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Review &amp; Save supports existing-project and new-project destinations</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Combine walkthrough review, visualization, persistence, and restart controls</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute left-[2vw] top-[4vh] h-[0.2vw] w-[31vw] bg-[#35584e]" />
            <div className="absolute left-[2vw] top-[4vh] h-[31vh] w-[0.2vw] bg-[#35584e]" />
            <div className="absolute left-[1.55vw] top-[3.55vh] h-[1.1vw] w-[1.1vw] rounded-full bg-[#f3be63]" />
            <div className="grid w-[32vw] grid-cols-2 gap-[1.2vw]">
              <div className="flex h-[17vh] items-end border border-[#d9f2dc]/55 bg-[#17372e] p-[1.7vw]">
                <div className="h-[0.45vw] w-[9vw] bg-[#f3be63]" />
              </div>
              <div className="flex h-[17vh] items-end border border-[#d9f2dc]/42 bg-[#143029] p-[1.7vw]">
                <div className="h-[0.45vw] w-[9vw] bg-[#d9f2dc]" />
              </div>
              <div className="flex h-[17vh] items-end border border-[#d9f2dc]/32 bg-[#122a25] p-[1.7vw]">
                <div className="h-[0.45vw] w-[9vw] bg-[#8fa9a0]" />
              </div>
              <div className="flex h-[17vh] items-end border border-[#f3be63]/55 bg-[#10231f] p-[1.7vw]">
                <div className="h-[0.45vw] w-[9vw] bg-[#f3be63]/70" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[1.2vw]">
          <span className="h-[0.55vw] w-[3.2vw] bg-[#f3be63]" />
          <span className="h-[0.2vw] w-[13vw] bg-[#2a4c43]" />
        </div>
      </div>
    </div>
  );
}