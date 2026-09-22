import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);
const root = process.cwd();

const piper =
  process.env.PIPER_BIN ||
  "/nix/store/k2wp1my6lfn56cgx9wqy30681bckkc0c-piper-2023.11.14-2/bin/piper";
const model = path.join(root, "work", "models", "en_GB-alan-medium.onnx");
const modelConfig = `${model}.json`;
const modelBaseUrl =
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium";

const work = path.join(root, "work", "pyramid-video");
const sourceDir = path.join(root, "attached_assets");
const renderedSlides = path.join(work, "slides-1920x1080");
const rawAudio = path.join(work, "audio-raw");
const narrationText = path.join(work, "narration");
const segments = path.join(work, "segments");
const output = path.join(root, "output");
const outputAudio = path.join(output, "audio");
const finalVideo = path.join(output, "Pyramid_Paradigm_Narrated_Presentation.mp4");

const leadSilence = 0.4;
const trailingSilence = 0.5;
const sampleRate = 48_000;

const narration = [
  "Welcome. This presentation introduces the Pyramid Paradigm for Manufacturing Systems: a configurable framework for industrial AI strategy, architecture and decision support. The purpose is to create a clear shared structure for mapping organisational levels, data, models, agents, connectivity and decisions.",
  "Manufacturing needs this type of framework because industrial manufacturing systems are rarely a single-tool problem. It involves plant-scale complexity, heterogeneous information, multiple time horizons and the need to turn insight into action. Also, different parts of a manufacturing organisation view the same system through very different lenses. Shop-floor teams focus on signals, process conditions and immediate performance, while engineering, management and executive functions interpret information in terms of quality, optimisation, resources, risk and strategy. The Pyramid Paradigm provides a shared structure that connects these different perspectives without losing their organisational context. The pyramid gives organisations a practical starting point.",
  "At the heart of the paradigm is one structural frame and five connected viewpoints. The structural frame anchors the organisation, while the data, models, agentic, connectivity and decision-making pyramids each reveal a different but connected layer of industrial intelligence.",
  "The structural frame can be adapted to each organisation. Levels, sectors and sub-layers can be renamed or expanded, so a small plant, a large enterprise or a multi-site programme can all use the same logic without forcing a fixed template.",
  "The data pyramid organises information into usable assets. Data is mapped by organisational level and by sector, with each data brick capturing source, characteristics, preparation needs and intended purpose. This helps expose what is available and what is missing.",
  "The models pyramid shows that manufacturing value comes from combining model families. Physics-based models, statistical methods, vision models, optimisation and AI can coexist. The right model is chosen based on the question, available data and decision context.",
  "The agentic and connectivity view shows how selected data and models become purposeful agents. Agents consume defined inputs, apply model logic, produce outputs and trigger actions. Connectivity then routes those outputs to people, systems, assets and decisions.",
  "The decision-making pyramid makes clear that intelligence is useful at every level. Data and models support shop-floor decisions, engineering choices, management planning and executive strategy, while maintaining context across the organisation.",
  "In practice, an engagement can progress through six steps: define the structure, map the data, align the models, design agents, connect flows and enable decisions. Completed pyramids can become reusable templates for future plants, processes and sectors.",
  "The overall impact is clarity, readiness, alignment, actionability and scalability. The Pyramid Paradigm gives customers a premium consultancy lens for understanding where to begin, what capabilities they need and how to organise industrial AI into a coherent manufacturing system.",
];

function formatSeconds(seconds) {
  return Number(seconds.toFixed(3));
}

async function ensureDirectories() {
  for (const dir of [
    work,
    renderedSlides,
    rawAudio,
    narrationText,
    segments,
    output,
    outputAudio,
  ]) {
    await mkdir(dir, { recursive: true });
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    if (options.input) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${command} ${args.join(" ")} failed with exit code ${code}\n${stderr}`,
          ),
        );
      }
    });
  });
}

async function probeDuration(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    filePath,
  ]);
  return Number(stdout.trim());
}

async function probeJson(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    filePath,
  ]);
  return JSON.parse(stdout);
}

async function downloadModelIfNeeded() {
  await mkdir(path.dirname(model), { recursive: true });
  for (const file of [model, modelConfig]) {
    if (await exists(file)) continue;
    const name = path.basename(file);
    await run("curl", [
      "-L",
      "--fail",
      "--retry",
      "3",
      "--retry-delay",
      "2",
      `${modelBaseUrl}/${name}?download=true`,
      "-o",
      file,
    ]);
  }
}

async function findSourceSlides() {
  const files = (await readdir(sourceDir))
    .filter((file) => /^Slide_\d+_.+\.png$/i.test(file))
    .sort((a, b) => {
      const aNumber = Number(a.match(/^Slide_(\d+)/i)[1]);
      const bNumber = Number(b.match(/^Slide_(\d+)/i)[1]);
      return aNumber - bNumber;
    });
  if (files.length !== 10) {
    throw new Error(
      `Expected exactly 10 supplied slide PNGs, found ${files.length}: ${files.join(", ")}`,
    );
  }
  return files.map((file) => path.join(sourceDir, file));
}

async function renderSlide(source, index) {
  const target = path.join(renderedSlides, `slide_${String(index).padStart(2, "0")}.png`);
  await run("ffmpeg", [
    "-y",
    "-i",
    source,
    "-vf",
    "scale=1920:1080:flags=lanczos",
    "-frames:v",
    "1",
    "-pix_fmt",
    "rgb24",
    target,
  ]);
  return target;
}

async function synthesizeSlide(text, index) {
  const stem = `slide_${String(index).padStart(2, "0")}`;
  const textFile = path.join(narrationText, `${stem}.txt`);
  const raw = path.join(rawAudio, `${stem}.wav`);
  const final = path.join(outputAudio, `${stem}.wav`);
  await writeFile(textFile, `${text}\n`, "utf8");

  await run(
    piper,
    [
      "-m",
      model,
      "-c",
      modelConfig,
      "-f",
      raw,
      "--sentence_silence",
      "0.15",
      "--length_scale",
      "0.82",
      "--noise_scale",
      "0.0",
      "--noise_w",
      "0.0",
    ],
    { input: `${text}\n` },
  );

  const spokenDuration = await probeDuration(raw);
  const expectedDuration = spokenDuration + leadSilence + trailingSilence;
  const filter = [
    "loudnorm=I=-20:TP=-1.5:LRA=7",
    `adelay=${Math.round(leadSilence * 1000)}:all=1`,
    "apad",
    `atrim=duration=${expectedDuration.toFixed(3)}`,
  ].join(",");

  await run("ffmpeg", [
    "-y",
    "-i",
    raw,
    "-filter:a",
    filter,
    "-ar",
    String(sampleRate),
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    final,
  ]);

  return {
    raw,
    final,
    narrationDuration: await probeDuration(raw),
    slideVideoDuration: await probeDuration(final),
  };
}

async function renderSegment(image, audio, duration, index) {
  const stem = `slide_${String(index).padStart(2, "0")}`;
  const segment = path.join(segments, `${stem}.mp4`);
  const visualDuration = (Math.ceil(duration * 30) + 1) / 30;
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-framerate",
    "30",
    "-i",
    image,
    "-i",
    audio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-t",
    visualDuration.toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "17",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    segment,
  ]);
  const metadata = await probeJson(segment);
  const videoStream = metadata.streams.find((stream) => stream.codec_type === "video");
  return {
    path: segment,
    videoDuration: Number(videoStream.duration),
  };
}

async function main() {
  await ensureDirectories();
  await downloadModelIfNeeded();

  if (!(await exists(piper))) {
    throw new Error(`Local Piper CLI was not found at ${piper}`);
  }

  const sources = await findSourceSlides();
  const slideRecords = [];
  let timeline = 0;

  for (let index = 1; index <= 10; index += 1) {
    console.log(`Slide ${index}/10: rendering source image`);
    const image = await renderSlide(sources[index - 1], index);
    console.log(`Slide ${index}/10: generating British narration`);
    const audio = await synthesizeSlide(narration[index - 1], index);
    console.log(`Slide ${index}/10: assembling measured segment`);
    const renderedSegment = await renderSegment(
      image,
      audio.final,
      audio.slideVideoDuration,
      index,
    );
    const segment = renderedSegment.path;
    const slideVideoDuration = renderedSegment.videoDuration;

    const startTimestamp = timeline;
    const endTimestamp = timeline + slideVideoDuration;
    slideRecords.push({
      slide: index,
      narrationText: narration[index - 1],
      narrationDuration: formatSeconds(audio.narrationDuration),
      leadSilence: leadSilence,
      trailingSilence: trailingSilence,
      slideVideoDuration: formatSeconds(slideVideoDuration),
      startTimestamp: formatSeconds(startTimestamp),
      endTimestamp: formatSeconds(endTimestamp),
      sourceImage: path.relative(root, sources[index - 1]),
      renderedImage: path.relative(root, image),
      audioFile: path.relative(root, audio.final),
      segmentFile: path.relative(root, segment),
    });
    timeline = endTimestamp;
  }

  const concatFile = path.join(work, "segments.concat.txt");
  await writeFile(
    concatFile,
    slideRecords
      .map((record) => `file '${path.resolve(root, record.segmentFile)}'`)
      .join("\n") + "\n",
    "utf8",
  );

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    finalVideo,
  ]);

  const finalMetadata = await probeJson(finalVideo);
  const finalDuration = await probeDuration(finalVideo);
  const timings = {
    visualSource: "Supplied dark-mode slide PNGs from the attached PPTX",
    slideCount: 10,
    resolution: "1920x1080",
    frameRate: "30 fps",
    videoCodec: "H.264 / libx264",
    audioCodec: "AAC / 192 kbps",
    tts: {
      engine: "Piper 2023.11.14 local CLI",
      model: "en_GB-alan-medium.onnx",
      voice: "Alan, en_GB-alan-medium, en-gb-x-rp phoneme voice",
      locale: "English (Great Britain)",
      gender: "male",
      freeLocal: true,
      apiKeyUsed: false,
      paidServiceUsed: false,
      lengthScale: 0.82,
      rationale:
        "Selected because it is a locally runnable open-source British male voice with natural technical delivery and substantially better quality than the legacy eSpeak and Flite voices available in the environment, while remaining CPU-friendly and offline.",
    },
    totalVideoDuration: formatSeconds(finalDuration),
    slides: slideRecords,
    output: {
      video: "/output/Pyramid_Paradigm_Narrated_Presentation.mp4",
      audioDirectory: "/output/audio/",
      timings: "/output/timings.json",
    },
    ffprobe: finalMetadata,
  };
  await writeFile(path.join(output, "timings.json"), JSON.stringify(timings, null, 2) + "\n");

  console.log(JSON.stringify({
    video: "/output/Pyramid_Paradigm_Narrated_Presentation.mp4",
    timings: "/output/timings.json",
    totalDuration: timings.totalVideoDuration,
    slideDurations: slideRecords.map((record) => record.slideVideoDuration),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});