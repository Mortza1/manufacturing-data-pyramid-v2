export default function ConnectedModel() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute inset-x-0 top-0 h-[1.2vh] bg-[#f3be63]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,242,220,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(217,242,220,0.13) 1px, transparent 1px)',
          backgroundSize: '5vw 5vw',
        }}
      />
      <div className="relative flex h-full flex-col px-[7vw] py-[8vh]">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">02 / 08</p>
            <h2 className="mt-[2.5vh] max-w-[60vw] font-display text-[4.25vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
              One workspace, one connected model
            </h2>
          </div>
          <div className="mb-[1vh] h-[7vw] w-[7vw] rotate-45 border border-[#d9f2dc]/30">
            <div className="m-[1.5vw] h-[4vw] w-[4vw] border border-[#f3be63]/65" />
          </div>
        </div>
        <div className="relative mt-[9vh] grid flex-1 grid-cols-3 gap-[2vw]">
          <div className="absolute left-[15%] right-[15%] top-[14vh] h-[0.18vw] bg-[#35584e]" />
          <div className="absolute left-[31%] top-[13.35vh] h-[1.5vw] w-[1.5vw] rounded-full border-[0.25vw] border-[#f3be63] bg-[#071316]" />
          <div className="absolute left-[64%] top-[13.35vh] h-[1.5vw] w-[1.5vw] rounded-full border-[0.25vw] border-[#f3be63] bg-[#071316]" />
          <div className="relative flex flex-col justify-end border-t-[0.35vw] border-[#d9f2dc] bg-[#10231f]/80 px-[2.2vw] pb-[3vh] pt-[5vh]">
            <div className="mb-[3vh] h-[5vw] w-[5vw] border border-[#d9f2dc]/55 bg-[#17372e] p-[1vw]">
              <div className="h-full w-full border border-[#f3be63]/70" />
            </div>
            <p className="font-body text-[2.05vw] leading-[1.18] text-[#d8e9df]">
              Connect structure, data, and relationships in one workflow
            </p>
          </div>
          <div className="relative flex flex-col justify-end border-t-[0.35vw] border-[#d9f2dc] bg-[#10231f]/80 px-[2.2vw] pb-[3vh] pt-[5vh]">
            <div className="mb-[3vh] flex h-[5vw] w-[5vw] items-end gap-[0.55vw] border-b border-l border-[#d9f2dc]/55 p-[0.8vw]">
              <span className="h-[1.4vw] w-[0.6vw] bg-[#f3be63]" />
              <span className="h-[2.4vw] w-[0.6vw] bg-[#d9f2dc]" />
              <span className="h-[3.4vw] w-[0.6vw] bg-[#8fa9a0]" />
            </div>
            <p className="font-body text-[2.05vw] leading-[1.18] text-[#d8e9df]">
              Use canonical grid positions to make elements spatially inspectable
            </p>
          </div>
          <div className="relative flex flex-col justify-end border-t-[0.35vw] border-[#d9f2dc] bg-[#10231f]/80 px-[2.2vw] pb-[3vh] pt-[5vh]">
            <div className="mb-[3vh] flex h-[5vw] w-[5vw] items-center justify-center border border-[#d9f2dc]/55">
              <div className="h-[2.2vw] w-[2.2vw] rounded-full border-[0.25vw] border-[#f3be63]" />
            </div>
            <p className="font-body text-[2.05vw] leading-[1.18] text-[#d8e9df]">
              Move from setup to review through a staged walkthrough or an advanced mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}