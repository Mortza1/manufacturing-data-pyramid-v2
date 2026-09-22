export default function ModelTheSystem() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute inset-x-0 bottom-0 h-[31%] bg-[#0d211d]" />
      <div className="absolute right-[6vw] top-[8vh] h-[0.2vw] w-[21vw] bg-[#f3be63]" />
      <div className="absolute right-[6vw] top-[8vh] h-[2.2vw] w-[0.2vw] bg-[#f3be63]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[8vh]">
        <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">04 / 08</p>
        <div className="flex items-end justify-between">
          <h2 className="mt-[2.5vh] max-w-[59vw] font-display text-[4.25vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
            Model the manufacturing system
          </h2>
          <div className="mb-[0.5vh] h-[7vw] w-[7vw] border border-[#d9f2dc]/45 p-[1.2vw]">
            <div className="h-full w-full border border-[#f3be63]/65" />
          </div>
        </div>
        <div className="mt-[8vh] grid flex-1 grid-cols-[1.1fr_0.9fr] gap-[6vw]">
          <div className="space-y-[3.5vh]">
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 rounded-full bg-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Data elements describe the working model</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 rounded-full bg-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Models, agents, and decisions extend the same overlay structure</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 rounded-full bg-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Each object references a level and sector</p>
            </div>
            <div className="flex items-start gap-[1.6vw]">
              <span className="mt-[0.5vh] h-[1.2vw] w-[1.2vw] shrink-0 rounded-full bg-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Review summarizes counts and coverage</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute left-[8vw] top-[7vh] h-[22vh] w-[0.18vw] bg-[#35584e]" />
            <div className="absolute left-[7.55vw] top-[6.6vh] h-[1.1vw] w-[1.1vw] rounded-full bg-[#f3be63]" />
            <div className="space-y-[1.2vh]">
              <div className="flex h-[8vh] w-[24vw] items-center border border-[#d9f2dc]/45 bg-[#16352e] px-[2vw]">
                <div className="h-[2vw] w-[2vw] border border-[#f3be63]" />
              </div>
              <div className="flex h-[8vh] w-[24vw] items-center border border-[#d9f2dc]/35 bg-[#122b26] px-[2vw]">
                <div className="h-[2vw] w-[2vw] rounded-full border border-[#d9f2dc]" />
              </div>
              <div className="flex h-[8vh] w-[24vw] items-center border border-[#d9f2dc]/25 bg-[#10231f] px-[2vw]">
                <div className="h-[2vw] w-[2vw] rotate-45 border border-[#8fa9a0]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}