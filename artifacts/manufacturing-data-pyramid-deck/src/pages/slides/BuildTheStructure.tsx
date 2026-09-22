export default function BuildTheStructure() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute right-0 top-0 h-full w-[39%] bg-[#0e211d]" />
      <div
        className="absolute right-0 top-0 h-full w-[39%] opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,242,220,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(217,242,220,0.13) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
      />
      <div className="relative flex h-full">
        <div className="flex w-[61%] flex-col px-[7vw] py-[8vh]">
          <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">03 / 08</p>
          <h2 className="mt-[2.5vh] max-w-[45vw] font-display text-[4.5vw] font-semibold leading-[0.98] tracking-[-0.06em] text-[#edf7f2]">
            Build the structure
          </h2>
          <div className="mt-[9vh] space-y-[3.3vh]">
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Define levels and sectors</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Place elements on a canonical grid</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Keep identifiers stable across the working draft</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 bg-[#f3be63]" />
              <p className="font-body text-[2.15vw] leading-[1.12] text-[#d8e9df]">Review the model before moving to visualization</p>
            </div>
          </div>
        </div>
        <div className="relative flex w-[39%] items-center justify-center">
          <div className="absolute bottom-[12vh] left-[9vw] h-[0.2vw] w-[20vw] bg-[#d9f2dc]/40" />
          <div className="absolute bottom-[12vh] left-[9vw] h-[20vw] w-[0.2vw] bg-[#d9f2dc]/40" />
          <div className="absolute bottom-[12vh] left-[8.7vw] h-[1vw] w-[1vw] rounded-full bg-[#f3be63]" />
          <div className="relative flex h-[45vh] w-[29vw] flex-col items-center justify-end">
            <div className="h-[9vh] w-[12vw] border border-[#d9f2dc]/60 bg-[#17372e]" />
            <div className="h-[10vh] w-[18vw] border border-[#d9f2dc]/55 bg-[#153029]" />
            <div className="h-[11vh] w-[24vw] border border-[#d9f2dc]/50 bg-[#122a25]" />
            <div className="h-[12vh] w-[29vw] border border-[#f3be63]/70 bg-[#10231f]" />
          </div>
        </div>
      </div>
    </div>
  );
}