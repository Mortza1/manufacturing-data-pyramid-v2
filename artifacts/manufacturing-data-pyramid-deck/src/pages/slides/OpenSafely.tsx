export default function OpenSafely() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute left-0 top-0 h-full w-[36%] bg-[#0d211d]" />
      <div className="absolute left-[9vw] top-[10vh] h-[0.2vw] w-[17vw] bg-[#f3be63]" />
      <div className="relative flex h-full">
        <div className="flex w-[54%] flex-col px-[7vw] py-[8vh]">
          <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">07 / 08</p>
          <h2 className="mt-[2.5vh] max-w-[44vw] font-display text-[4.35vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
            Open and resume safely
          </h2>
          <div className="mt-[9vh] space-y-[3.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 rounded-full border-[0.2vw] border-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Choose a User, Project, and exact Version</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 rounded-full border-[0.2vw] border-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Validate the retrieved snapshot before replacing the working draft</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 rounded-full border-[0.2vw] border-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Preserve the current draft when an open fails</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.15vw] w-[1.15vw] shrink-0 rounded-full border-[0.2vw] border-[#f3be63]" />
              <p className="font-body text-[2.1vw] leading-[1.12] text-[#d8e9df]">Track the source version and latest version in project context</p>
            </div>
          </div>
        </div>
        <div className="relative flex w-[46%] items-center justify-center">
          <div className="relative h-[56vh] w-[29vw] border border-[#d9f2dc]/35 bg-[#10231f] p-[1.3vw]">
            <div className="h-full border border-[#d9f2dc]/25 p-[1.5vw]">
              <div className="h-[0.8vw] w-[10vw] bg-[#f3be63]" />
              <div className="mt-[4vh] h-[0.35vw] w-full bg-[#35584e]" />
              <div className="mt-[3vh] h-[0.35vw] w-[76%] bg-[#35584e]" />
              <div className="mt-[3vh] h-[0.35vw] w-[88%] bg-[#35584e]" />
              <div className="mt-[8vh] h-[17vh] border border-[#f3be63]/55 bg-[#17372e]/55 p-[1.3vw]">
                <div className="h-full border border-[#d9f2dc]/35" />
              </div>
              <div className="mt-[7vh] flex items-center gap-[1vw]">
                <span className="h-[1.2vw] w-[1.2vw] rounded-full bg-[#f3be63]" />
                <span className="h-[0.35vw] w-[8vw] bg-[#d9f2dc]/45" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-[13vh] right-[5vw] h-[12vw] w-[12vw] rounded-full border border-[#f3be63]/55" />
        </div>
      </div>
    </div>
  );
}