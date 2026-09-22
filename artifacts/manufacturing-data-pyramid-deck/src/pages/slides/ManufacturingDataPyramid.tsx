const base = import.meta.env.BASE_URL;

export default function ManufacturingDataPyramid() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071316] text-[#edf7f2]">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,242,220,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(217,242,220,0.14) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
      />
      <div className="absolute -right-[8vw] -top-[15vh] h-[72vh] w-[55vw] rounded-full bg-[#17362f] opacity-45 blur-[7vw]" />
      <div className="absolute bottom-[-18vh] left-[-10vw] h-[48vh] w-[48vw] rounded-full bg-[#16303b] opacity-35 blur-[8vw]" />
      <div className="relative flex h-full w-full">
        <div className="flex w-[53%] flex-col justify-between px-[7vw] py-[7vh]">
          <div className="flex items-center gap-[1.2vw]">
            <span className="h-[0.55vw] w-[3.2vw] bg-[#f3be63]" />
            <span className="font-mono text-[1.15vw] uppercase tracking-[0.22em] text-[#8fa9a0]">01 / 08</span>
          </div>
          <div className="max-w-[38vw]">
            <h1 className="font-display text-[6.4vw] font-semibold leading-[0.94] tracking-[-0.065em] text-[#edf7f2]">
              Manufacturing
              <span className="block text-[#d9f2dc]">Data Pyramid</span>
            </h1>
            <p className="mt-[4vh] max-w-[29vw] font-body text-[2vw] leading-[1.22] text-[#a8c0b7]">
              A structured workspace for modeling manufacturing systems
            </p>
          </div>
          <div className="flex items-end gap-[1vw]">
            <span className="h-[4.2vw] w-[0.45vw] bg-[#f3be63]" />
            <span className="h-[0.2vw] w-[13vw] bg-[#2a4c43]" />
          </div>
        </div>
        <div className="relative w-[47%] overflow-hidden">
          <img
            src={`${base}cover-pyramid.png`}
            crossOrigin="anonymous"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071316] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071316]/70 via-transparent to-[#071316]/10" />
          <div className="absolute right-[5vw] top-[9vh] h-[34vh] w-[0.12vw] bg-[#d9f2dc]/45" />
          <div className="absolute right-[4.75vw] top-[8.5vh] h-[0.65vw] w-[0.65vw] rounded-full bg-[#f3be63]" />
        </div>
      </div>
    </div>
  );
}