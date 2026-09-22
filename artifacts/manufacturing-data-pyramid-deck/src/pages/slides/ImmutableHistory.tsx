export default function ImmutableHistory() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div className="absolute inset-y-0 right-0 w-[39%] bg-[#0d211d]" />
      <div className="absolute bottom-[9vh] left-[7vw] h-[0.2vw] w-[28vw] bg-[#f3be63]" />
      <div className="relative flex h-full">
        <div className="flex w-[61%] flex-col px-[7vw] py-[8vh]">
          <p className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#f3be63]">06 / 08</p>
          <h2 className="mt-[2.5vh] max-w-[51vw] font-display text-[4.1vw] font-semibold leading-[0.98] tracking-[-0.055em] text-[#edf7f2]">
            Save an immutable project history
          </h2>
          <div className="mt-[8vh] space-y-[2.6vh]">
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.1vw] w-[1.1vw] shrink-0 border border-[#f3be63] bg-[#f3be63]/20" />
              <p className="font-body text-[1.95vw] leading-[1.12] text-[#d8e9df]">Store snapshots with a defined format and schema version</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.1vw] w-[1.1vw] shrink-0 border border-[#f3be63] bg-[#f3be63]/20" />
              <p className="font-body text-[1.95vw] leading-[1.12] text-[#d8e9df]">Assign projects to named users</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.1vw] w-[1.1vw] shrink-0 border border-[#f3be63] bg-[#f3be63]/20" />
              <p className="font-body text-[1.95vw] leading-[1.12] text-[#d8e9df]">Create an immutable version for each successful save</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.1vw] w-[1.1vw] shrink-0 border border-[#f3be63] bg-[#f3be63]/20" />
              <p className="font-body text-[1.95vw] leading-[1.12] text-[#d8e9df]">Let the server control version numbering</p>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <span className="mt-[0.5vh] h-[1.1vw] w-[1.1vw] shrink-0 border border-[#f3be63] bg-[#f3be63]/20" />
              <p className="font-body text-[1.95vw] leading-[1.12] text-[#d8e9df]">Choose between an existing project and a new project</p>
            </div>
          </div>
        </div>
        <div className="relative flex w-[39%] items-center justify-center">
          <div className="absolute left-[5vw] top-[17vh] h-[52vh] w-[0.2vw] bg-[#35584e]" />
          <div className="absolute left-[4.55vw] top-[16vh] h-[1.1vw] w-[1.1vw] rounded-full bg-[#f3be63]" />
          <div className="absolute left-[4.55vw] top-[36vh] h-[1.1vw] w-[1.1vw] rounded-full bg-[#d9f2dc]" />
          <div className="absolute left-[4.55vw] top-[56vh] h-[1.1vw] w-[1.1vw] rounded-full bg-[#d9f2dc]" />
          <div className="relative ml-[5vw] space-y-[2.3vh]">
            <div className="h-[14vh] w-[22vw] border border-[#f3be63]/70 bg-[#17372e] p-[2vw]">
              <div className="h-full border border-[#d9f2dc]/45" />
            </div>
            <div className="h-[14vh] w-[22vw] border border-[#d9f2dc]/45 bg-[#122b26] p-[2vw]">
              <div className="h-full border border-[#d9f2dc]/30" />
            </div>
            <div className="h-[14vh] w-[22vw] border border-[#d9f2dc]/30 bg-[#10231f] p-[2vw]">
              <div className="h-full border border-[#8fa9a0]/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}